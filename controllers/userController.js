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