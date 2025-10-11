import mongoose from "mongoose";
import Hotel from "../models/hotelModel.js";
import Rooms from "../models/RoomModel.js";
import User from "../models/userModel.js";

export const createRoom = async (req, res) => {
  try {
    const {
      hotelId,
      type,
      description,
      capacity,
      basePrice,
      taxRate,
      amenities,    
      images,
      cancellationRules,
      totalRooms,
      isActive
    } = req.body;

    if (!hotelId || !totalRooms || !basePrice || !capacity) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can add rooms" });
    }

    // Optional: verify the hotel belongs to this vendor
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    if (hotel.vendorId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You can only add rooms to your own hotels" });
    }

    const room = new Rooms({
      hotelId,
      type,
      description,
      capacity,
      basePrice,
      taxRate,
      amenities,
      images,
      cancellationRules,
      totalRooms,
      isActive
    });

    const newRoom = await room.save();
    res.status(201).json(newRoom);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const getAllRooms = async (req, res) => {
  try {
    const {
      city,
      state,
      country,
      children,
      adults,
      type,
      amenities,
      // minPrice,
      // maxPrice,
    } = req.query;

    const filter = {};

    // ---- Capacity filters ----
    if (children) filter["capacity.children"] = { $gte: Number(children) };
    if (adults)   filter["capacity.adults"]  = { $gte: Number(adults) };

    // ---- Type filter ----
    if (type) {
      const types = type.split(",").map((t) => t.trim());
      filter.type = { $in: types };
    }

    // ---- Price filter ----
    // if (minPrice || maxPrice) {
    //   filter.basePrice = {};
    //   if (minPrice) filter.basePrice.$gte = Number(minPrice);
    //   if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    // }

    // ---- Amenities filter ----
    if (amenities) {
      const list = amenities.split(",").map((a) => a.trim());
      filter.amenities = { $all: list };
    }

    // ---- Hotel location filters ----
    // Build a match object for the populated Hotel
    const hotelMatch = {};
    if (city)    hotelMatch["location.city"]    = { $regex: city, $options: "i" };
    if (state)   hotelMatch["location.state"]   = { $regex: state, $options: "i" };
    if (country) hotelMatch["location.country"] = { $regex: country, $options: "i" };

    // ---- Query Rooms and populate hotel with location filter ----
    const rooms = await Rooms.find(filter)
      .populate({
        path: "hotelId",
        select: "name location rating",
        match: hotelMatch, // match nested fields inside location
      })
      .lean();

    // Remove rooms where the populated hotel did not match
    const filteredRooms = rooms.filter((r) => r.hotelId);

    res.status(200).json(filteredRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getRoomDetails = async(req,res) => {
  try {
    const {id} = req.params;

    const room = await Rooms.findById(id).populate("hotelId","_id name location rating description policies");
    if(!room){
      return res.status(400).json({message : "room not found"})
    }

    return res.status(200).json(room);

  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}



export const getHotelRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { minPrice, maxPrice, amenities } = req.query;

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required" });
    }

    // Build the filter object dynamically
    const filter = { hotelId, isActive: true };

    // Price filter - FIXED: Handle string to number conversion
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== undefined) {
        filter.basePrice.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.basePrice.$lte = Number(maxPrice);
      }
    }

    // Amenities filter - FIXED: Handle $all for matching ALL amenities
    if (amenities) {
      let amenitiesArray = [];
      if (typeof amenities === "string") {
        amenitiesArray = [amenities];
      } else if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      }
      
      // Use $all instead of $in if you want rooms with ALL selected amenities
      // Use $in if you want rooms with ANY of the selected amenities
      filter.amenities = { $all: amenitiesArray };
      // OR: filter.amenities = { $in: amenitiesArray };
    }


    // Fetch rooms with filters
    const rooms = await Rooms.find(filter).populate(
      "hotelId",
      "_id name location rating description"
    );


    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ 
        success: true, 
        message: "No rooms found matching filters",
        rooms: []
      });
    }

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getRoomsGroupedByType = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const grouped = await Rooms.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: { type: "$type", hotelId: "$hotelId" },
          rooms: { $push: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "hotels",               // 👈 collection name of Hotel model
          localField: "_id.hotelId",    // hotelId from group
          foreignField: "_id",          // hotel _id
          as: "hotel"
        }
      },
      { $unwind: "$hotel" }, // because we only expect one hotel
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          hotel: 1,
          rooms: 1
        }
      }
    ]);

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



export const vendorRooms = async (req, res) => {
  try {
    const hotels = await Hotel.find({ vendorId: req.user._id });

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found for this vendor" });
    }

    const hotelIds = hotels.map((hotel) => hotel._id);

    const rooms = await Rooms.find({ hotelId: { $in: hotelIds } });

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: "No rooms found for these hotels" });
    }

    // Step 4: Calculate the total number of rooms
    const totalRooms = rooms.reduce((sum, room) => sum + (room.totalRooms || 0), 0);

    // Step 5: Send response
    return res.status(200).json({
      message: "Vendor rooms fetched successfully",
      hotelsCount: hotels.length,
      roomsCount: rooms.length,
      totalRooms,
      rooms,
    });
  } catch (error) {
    console.error("Error fetching vendor rooms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
