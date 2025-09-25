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
      userId,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      guestDetails,
      roomsRequested = 1 // Default to 1 if not provided
    } = req.body;

    if (!userId || !hotelId || !roomId || !checkIn || !checkOut || !adults || !guestDetails) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required booking information' });
    }

    // Normalize check-in and check-out dates to avoid timezone issues
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

    // Create availability records for dates that don't exist
    console.log('Processing dates for availability:', datesToCheck.map(d => d.toDateString()));
    
    const availabilityPromises = datesToCheck.map(async (date, index) => {
      // Use the date directly without additional normalization
      const dateToUse = new Date(date);
      dateToUse.setHours(0, 0, 0, 0);
      
      console.log(`Processing date ${index + 1}:`, date.toDateString(), '-> Using:', dateToUse.toDateString());
      
      let availability = await RoomAvailability.findOne({
        roomId,
        hotelId,
        date: {
          $gte: new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate()),
          $lt: new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate() + 1)
        }
      }).session(session);

      if (!availability) {
        console.log('Creating new availability for:', dateToUse.toDateString());
        // Create new availability record
        availability = await RoomAvailability.create([{
          roomId,
          hotelId,
          date: dateToUse,
          status: 'available',
          availableRooms: room.totalRooms,
          price: room.basePrice
        }], { session });
        return availability[0]; // create() returns an array
      } else {
        console.log('Found existing availability for:', dateToUse.toDateString(), 'Available rooms:', availability.availableRooms);
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

    // Create the booking
    const newBooking = await Bookings.create([{
      userId,
      hotelId,
      roomId,
      dates: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
      },
      guests: {
        adults,
        children,
        details: req.body.guestDetails?.details || []
      },
      guestDetails: {
        primaryGuest: guestDetails.primaryGuest,
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

    // Update room availability for each date
    console.log('Updating availability for dates:', availabilityRecords.map((avail, i) => `${datesToCheck[i].toDateString()}: ${avail.availableRooms} -> ${avail.availableRooms - roomsRequested}`));
    
    const updatePromises = availabilityRecords.map(async (availability, index) => {
      const newAvailableRooms = availability.availableRooms - roomsRequested;
      console.log(`Updating availability for ${datesToCheck[index].toDateString()}: ${availability.availableRooms} - ${roomsRequested} = ${newAvailableRooms}`);
      
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

export const getAllBookings = async(req,res) => {
    try {
        const {hotelId} = req.params;

    const hotel = await Hotel.findById(hotelId);
    if(!hotel){
        return res.status(404).json({message : "hotel not found"});
    }

    const bookings = await Bookings.find({ hotelId }).lean();
    if(bookings.length === 0){
        return res.status(404).json({message : "booking not found"});
    }

    return res.status(200).json(bookings);

    } catch (error) {
        res.status(500).json({ success: false, message: "fetching failed", error: error.message });
    }

}