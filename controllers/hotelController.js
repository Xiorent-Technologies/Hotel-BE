import Hotel from "../models/hotelModel.js";
import User from "../models/userModel.js";

export const createHotel = async (req, res) => {
  try {
    const {
      name,description,location,contact,amenities,policies,images,status,paymentOptions
    } = req.body;

    const vendor = await User.findById(req.user._id);

    if (!vendor) {
      return res.status(400).json({ message: "vendor is not present" });
    }

    if(vendor.role !== "vendor"){
        return res.status(403).json({message: "users cant create hotels"})
    }

    if (!name) {
      return res.status(400).json({ message: "Hotel name is required" });
    }

    const hotel = new Hotel({
      vendorId : vendor._id,
      name,
      description,
      location,
      contact,
      amenities,
      policies,
      images,
      status,
      paymentOptions
    });

    const savedHotel = await hotel.save();
    res.status(201).json(savedHotel);
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getAllHotels = async (req, res) => {
  try {

    const hotels = await Hotel.find().populate("vendorId","name email");
    res.status(200).json(hotels);
    
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};