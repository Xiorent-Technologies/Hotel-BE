import mongoose from "mongoose";
import Bookings from "../models/bookingModel.js";
import Rooms from "../models/RoomModel.js";
import RoomAvailability from "../models/RoomVacantModel.js";
import Hotel from "../models/hotelModel.js";

const getDateRange = (startDate, endDate) => {
  const dates = [];
  // Normalize input dates to avoid timezone issues
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const current = new Date(start);
  
  while (current < end) {
    dates.push(new Date(current)); // Create new date object
    current.setDate(current.getDate() + 1);
  }
  
  console.log('Date range from', start.toDateString(), 'to', end.toDateString(), ':', dates.map(d => d.toDateString()));
  return dates;
};

export const bookRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      hotelId,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      guestDetails, // includes firstName, lastName, email, phone, address, idProof, specialRequests
      roomsRequested = 1 // Default to 1 if not provided
    } = req.body;

    // ✅ Updated validation (no userId required anymore)
    if (!hotelId || !roomId || !checkIn || !checkOut || !adults || !guestDetails?.firstName || !guestDetails?.email || !guestDetails?.phone) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required booking information' });
    }

    // Normalize check-in and check-out dates
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate >= checkOutDate || checkInDate < today) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid check-in or check-out dates' });
    }

    console.log('Booking request - Check-in:', checkInDate.toDateString(), 'Check-out:', checkOutDate.toDateString());

    // Find room
    const room = await Rooms.findById(roomId).session(session);
    if (!room || !room.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Room not found or not available' });
    }

    const totalGuests = adults + (children || 0);
    if (totalGuests > room.capacity.total) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Room capacity exceeded. Maximum ${room.capacity.total} guests allowed`
      });
    }

    const datesToCheck = getDateRange(checkInDate, checkOutDate);

    // Ensure availability exists for each date
    const availabilityPromises = datesToCheck.map(async (date) => {
      const dateToUse = new Date(date);
      dateToUse.setHours(0, 0, 0, 0);

      let availability = await RoomAvailability.findOne({
        roomId,
        hotelId,
        date: {
          $gte: new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate()),
          $lt: new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate() + 1)
        }
      }).session(session);

      if (!availability) {
        availability = await RoomAvailability.create([{
          roomId,
          hotelId,
          date: dateToUse,
          status: 'available',
          availableRooms: room.totalRooms,
          price: room.basePrice
        }], { session });
        return availability[0];
      }
      return availability;
    });

    const availabilityRecords = await Promise.all(availabilityPromises);

    // Validate availability and calculate price
    let totalBasePrice = 0;

    for (let i = 0; i < availabilityRecords.length; i++) {
      const availability = availabilityRecords[i];
      const currentDate = datesToCheck[i];

      if (!availability || availability.status === 'sold_out' || availability.availableRooms < roomsRequested) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Not enough rooms available on ${currentDate.toDateString()}. Available: ${availability?.availableRooms || 0}, Requested: ${roomsRequested}`
        });
      }

      totalBasePrice += (availability.price || room.basePrice) * roomsRequested;
    }

    const taxAmount = totalBasePrice * (room.taxRate || 0) / 100;
    const finalAmount = totalBasePrice + taxAmount;
    const nights = datesToCheck.length;

    // ✅ Create the booking (no userId, store guest info directly)
    const newBooking = await Bookings.create([{
      hotelId,
      roomId,
      dates: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
      },
      guests: {
        adults,
        children,
        details: req.body.guests?.details || [] // optional details about additional guests
      },
      guestDetails: {
        firstName: guestDetails.firstName,
        lastName: guestDetails.lastName,
        email: guestDetails.email,
        phone: guestDetails.phone,
        address: guestDetails.address,
        idProof: guestDetails.idProof,
        specialRequests: guestDetails.specialRequests
      },
      pricing: {
        basePrice: totalBasePrice,
        taxAmount,
        extraCharges: 0,
        discount: 0,
        totalAmount: finalAmount
      },
      status: 'pending',
      paymentStatus: 'pending',
      roomsBooked: roomsRequested
    }], { session });

    // Update room availability
    const updatePromises = availabilityRecords.map(async (availability) => {
      const newAvailableRooms = availability.availableRooms - roomsRequested;

      return await RoomAvailability.findByIdAndUpdate(
        availability._id,
        {
          $inc: { availableRooms: -roomsRequested },
          $set: {
            status: newAvailableRooms <= 0 ? 'sold_out' : 'available'
          }
        },
        { session, new: true }
      );
    });

    await Promise.all(updatePromises);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Room booked successfully',
      data: {
        bookingId: newBooking[0]._id,
        booking: newBooking[0],
        roomDetails: {
          type: room.type,
          capacity: room.capacity,
          amenities: room.amenities
        },
        pricing: {
          basePrice: totalBasePrice,
          taxAmount,
          totalAmount: finalAmount,
          nights,
          roomsBooked: roomsRequested
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: "Booking failed",
      error: error.message
    });
  }
};


export const getAllBookings = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { roomId, paymentStatus } = req.query;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // build a dynamic query
    const filter = { hotelId };
    if (roomId) {
      filter.roomId = roomId;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const bookings = await Bookings.find(filter).lean();

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    return res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fetching failed",
      error: error.message,
    });
  }
};


export const confirmation = async(req,res) => {
  try {
    const {bookingId} = req.params;
    const booking  = await Bookings.findById(bookingId).populate("hotelId","name location amenities description rating");
    if(!booking){
      return res.status(404).json({message : "booking not found"});
    }

    return res.status(200).json(booking);

  } catch (error) {
    res.status(500).json({ success: false, message: "fetching failed", error: error.message });
  }
}

export const vendorEarnings = async(req,res)=>{
  try {
    const hotels = await Hotel.find({ vendorId: req.user._id });

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found for this vendor" });
    }

    const hotelIds = hotels.map((hotel) => hotel._id);

    const bookings = await Bookings.find({ hotelId: { $in: hotelIds } })

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings done for this vendor" });
    }

    const totalEarnings = bookings.reduce((sum, book) => sum + (book.pricing.totalAmount || 0), 0);

 return res.status(200).json({
      message: "Vendor earnings calculated successfully",
      vendorId: req.user._id,
      bookingsCount: bookings.length,
      totalEarnings,
    });
  } catch (error) {
    console.error("Error fetching vendor bookings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const getMonthlyBookings = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const monthlyData = await Bookings.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        // Group by month
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        // Sort by month ascending
        $sort: { "_id": 1 }
      }
    ]);

    // Map month numbers to names
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "June",
      "July", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const formattedData = monthNames.map((name, index) => ({
      month: name,
      count:
        monthlyData.find(item => item._id === index + 1)?.count || 0
    }));

    return res.status(200).json({
      success: true,
      year,
      data: formattedData
    });
  } catch (error) {
    console.error("Error fetching monthly bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get monthly booking data"
    });
  }
};


export const totalBookings = async (req, res) => {
  try {
    // Aggregate total sum of all booking amounts
    const result = await Bookings.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$pricing.totalAmount" },
        },
      },
    ]);

    const totalAmount = result.length > 0 ? result[0].totalAmount : 0;

    return res.status(200).json({
      success: true,
      totalAmount,
    });

  } catch (error) {
    console.error("Error calculating total booking amount:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
