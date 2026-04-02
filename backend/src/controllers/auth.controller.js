import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js"
import jwt from "jsonwebtoken"

export async function signup(req,res) {
  const {email,password,fullName} = req.body
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    if(!normalizedEmail || !password || !fullName) {
      return  res.status(400).json({message: "All fields are required"})
    }
    if(password.length<6){
      return res.status(400).json({message: "Password must be atleast 6 characters"})
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(normalizedEmail)){
      return res.status(400).json({message: "Invalid email format"})
    }
    const extinguishUser = await User.findOne({email: normalizedEmail})
    if(extinguishUser){
      return res.status(400).json({message: "Email already exists, Please use a different one"})
    }

     // Avatar generate
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;

    // User create
    const user = await User.create({
      email: normalizedEmail,
      password, // (later bcrypt use karna)
      fullName,
      profilePic: avatar, // 👈 IMPORTANT
    });

    // ++++ CREATING THE USER IN STREAM AS WELL ++++
    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.profilePic || "",
      });
      console.log(`Stream user created for ${user.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }


    // const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,{
    //   expiresIn: "7d"
    // }) youtube
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{
      expiresIn: "7d"
    })

    res.cookie("jwt",token,{
      maxAge: 7*24*60*60*1000,
      httpOnly: true, // prevent XSS attacks
      sameSite: "strict", // prevent CSRF attacks    YOUTUBE 
      // sameSite: "lax",
      //secure: true,  prevent HTTP requests
      secure: process.env.NODE_ENV==="production"
    })
    // res.status(201).json({success:true, user:newUser}) youtube
    res.status(201).json({success:true, user}) 
  
  } catch(error) {
    console.log("Error in signup controller", error);
    res.status(500).json({message:"Internal Server Error"});
  }
}





export async function login(req,res) {
  try{
    const {email,password}=req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    
    if(!normalizedEmail||!password){
      return res.status(400).json({message: "All fields are required"});
    }
    
    const user = await User.findOne({email: normalizedEmail})
    if(!user) return res.status(401).json({message: "Invalid email or password"})

    const isPasswordCorrect = await user.matchPassword(password)
    if(!isPasswordCorrect) return res.status(401).json({message: "Invalid email or password"})

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{
      expiresIn: "7d"
    })
    res.cookie("jwt",token,{
      maxAge: 7*24*60*60*1000,
      httpOnly: true, 
      sameSite: "strict",   //YOUTUBE
      // sameSite: "lax",
      secure: process.env.NODE_ENV==="production"
    })
    res.status(201).json({success:true, user})

  } catch(error) {
    console.log("Error in signup controller", error);
    res.status(500).json({message:"Internal Server Error"});
  }
}





export async function logout(req,res) {
  res.clearCookie("jwt")
  res.status(200).json({success:true, message: "Logout successful"})
}


export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}