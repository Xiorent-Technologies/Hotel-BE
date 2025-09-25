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
     const {
      city,state,country,status,amenities,vendorId
    } = req.query;
     
    const filter = {};
    
    if(city) filter["location.city"] = new RegExp(`^${city}$`,"i");
    if(state) filter["location.state"] = new RegExp(`^${state}$`,"i");
    if(country) filter["location.country"] = new RegExp(`^${country}$`,"i");

    if(vendorId) filter.vendorId = vendorId;

    if(status) filter.status = status;

     if (amenities) {
      const list = amenities.split(",").map(a => a.trim());
      filter.amenities = { $all: list };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const hotels = await Hotel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    return res.status(200).json(hotels);

  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};