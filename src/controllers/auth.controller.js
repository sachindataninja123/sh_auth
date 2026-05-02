import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

export const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "userName, email, and password are required!",
        success: false,
      });
    }

    const existUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existUser) {
      return res.status(409).json({
        message: "user already Exists!",
        success: false,
      });
    }

    // generate salt
    const genSalt = await bcrypt.genSalt(10);

    // create hash password
    const hashPassword = await bcrypt.hash(password, genSalt);

    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
    });

    return res.status(201).json({
      message: "User Registered successfully!",
      user,
    });
  } catch (error) {
    console.error(`[ERROR]: ${error.message}`);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
