import cloudinary from "../config/cloudinary.js";
import { generateTokenAndSetCookie } from "../cookie/generateTokenAndSetCookie.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const signup = async(req,res) => {
    try{

    const {name,email,password} = req.body;
            
    if(!name || !email || !password){

        return res.status(400).json({message: "Please provide all required fields"});
    }
    
    const userExists = await User.findOne({email});
    if(userExists){
        return res.status(400).json({message: "User already exists"});
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    if(user){
        generateTokenAndSetCookie(user._id,res);
    }
    return res.status(201).json({user})
    
} catch(error){
    console.error(error);
    res.status(500).json({message: "Server error"});
}
}

export const logIn = async(req,res) => {
try{

        const {email,password} = req.body;
        
        if(!email || !password){
            return res.status(400).json({message : "plz add all fields"});
        }
        
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({message : "user not found"});
        }

        const isMatch = await bcrypt.compare(password,user?.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        generateTokenAndSetCookie(user._id,res);
        
        return res.status(200).json({user});
    }

    catch(err){
        console.log(err.message);
        res.status(500).json({error : err.message}); 
    }
}

export const logOut = async(req,res) => {
    try{

        res.cookie("jwt","",{
            MaxAge:1
        })
        res.status(200).json({message: "Logged out successfully"});
    } catch(error){
        console.error(error);
        res.status(500).json({message: "Server error"});
    } 
}


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, bio, username, phone, image } = req.body;

    // 🔹 Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🔹 Default image URL (keep existing)
    let imageUrl = user.image;

    // 🔹 If new image (base64), upload to Cloudinary
    if (image && image.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "user_profiles",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // 🔹 Update only provided fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.bio = bio || user.bio;
    user.username = username || user.username;
    user.phone = phone || user.phone;
    user.image = imageUrl;
    // user.loginActivity=loginActivity,
    // user.loginDevices=activeDevices,

    const updatedUser = await user.save();

    // 🔹 Return updated payload
    const payload = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      username: updatedUser.username,
      phone: updatedUser.phone,
      image: updatedUser.image,
      lastLogin: updatedUser.lastLogin,   // 🟢 add this
      devices: updatedUser.lastLoginDevice,
    };
       

    res.status(200).json({ success: true, data: payload });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUser = async(req,res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({message : "user not found"});

        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const getVendors = async(req,res) => {
    try {
        const vendors = await User.find({role : "vendor"});
        return res.status(200).json(vendors);

    } catch (error) {
        res.status(500).json({ success: false, message: err.message });
    }
}