import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

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

    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token);

    return res.status(201).json({
      message: "User Registered successfully!",
      user,
      token,
    });
  } catch (error) {
    console.error(`[ERROR]: ${error.message}`);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(409).json({
        message: "Token is missing",
        success: false,
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    return res.status(200).json({
      message: "User Fetched successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(`[ERROR]: ${error.message}`);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
