import cloudinary from "../config/cloudinary.js";
import Hotel from "../models/hotelModel.js";
import User from "../models/userModel.js";

export const createHotel = async (req, res) => {
  try {
    const {
      vendorId,
      name,
      description,
      location,
      contact,
      amenities,
      policies,
      images,
      status,
      paymentOptions,
    } = req.body;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // if (vendor.role !== "admin") {
    //   return res.status(403).json({ message: "Only admins can create hotels" });
    // }

    if (!name) {
      return res.status(400).json({ message: "Hotel name is required" });
    }

    // 2️⃣ Upload images to Cloudinary
    let uploadedImages = [];
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          if (img.file) {
            const uploadRes = await cloudinary.uploader.upload(img.file, {
              folder: "hotels",
            });

            uploadedImages.push({
              url: uploadRes.secure_url,
              caption: img.caption || "",
              isPrimary: img.isPrimary || false,
            });
          } else if (img.url) {
            uploadedImages.push({
              url: img.url,
              caption: img.caption || "",
              isPrimary: img.isPrimary || false,
            });
          }
        } catch (err) {
          console.error("Cloudinary upload error:", err);
          return res.status(500).json({
            message: "Image upload failed",
            error: err.message,
          });
        }
      }
    }

    // 3️⃣ Create hotel document
    const hotel = new Hotel({
      vendorId,
      name,
      description,
      location,
      contact,
      amenities,
      policies,
      images: uploadedImages,
      status: status || "pending",
      paymentOptions,
    });

    const savedHotel = await hotel.save();

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      hotel: savedHotel,
    });
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating hotel",
      error: error.message,
    });
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

export const getRandom = async(req,res) => {
  try {
    const hotels = await Hotel.aggregate([
      { $match: { status: "approved" } }, 
      { $sample: { size: 4 } }
    ]);

    res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching random hotels:", error);
    res.status(500).json({ message: "Failed to fetch random hotels." });
  }
}


export const RateUs = async(req,res) => {
  try {
    const {name,email,rating,comment} = req.body;
    const {hotelId} = req.params;

    const hotel = await Hotel.findById(hotelId);
    if(!hotel){
      return res.status(404).json({message : "hotel not found"});
    }

   hotel.reviews.push({
      name,
      email,
      rating,
      comment,
    });

    hotel.rating.totalReviews = hotel.reviews.length;
    hotel.rating.average = hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.rating.totalReviews;


    await hotel.save();

    return res.status(201).json(hotel);

  } catch (error) {
    console.error("Error fetching random hotels:", error);
    res.status(500).json({ message: "Failed to fetch random hotels." });
  }
}

export const vendorHotels = async(req,res) => {
  try {
    const {vendorId} = req.params;
    if(!vendorId){
      return res.status(404).json({message : "vendor not found "})
    }
    const hotels = await Hotel.find({vendorId : vendorId});

    return res.status(200).json(hotels.length);

  } catch (error) {
    console.error("Error fetching total hotels:", error);
    res.status(500).json({ message: "Failed to fetch total hotels." });
  }
}