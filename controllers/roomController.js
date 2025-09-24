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

    const rooms = await Rooms.find().populate("hotelId","name location");
    res.status(200).json(rooms);
    
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};