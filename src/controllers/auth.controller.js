import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, generateOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

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
        message: "User already exists!",
        success: false,
      });
    }

    // hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
    });

    const otp = generateOtp();
    const html = generateOtpHtml(otp, username);

    const otpHash = await bcrypt.hash(otp, 10);

    await otpModel.create({
      email,
      user: user._id,
      otpHash,
    });

    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);

    return res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }

    // find user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    if (!user.verified) {
      return res.status(401).json({
        message: "Email not verified",
      });
    }

    // compare password
    const isValidUser = await bcrypt.compare(password, user.password);

    if (!isValidUser) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    // 1. create session first
    const session = await sessionModel.create({
      user: user._id,
      refreshTokenHash: "placeholder",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 2. generate tokens with sessionId
    const refreshToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const accessToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 3. hash refresh token and update session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    session.refreshTokenHash = refreshTokenHash;
    await session.save();

    // set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
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
      return res.status(401).json({
        // 401 not 409
        message: "Token is missing",
        success: false,
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
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

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    // verify token
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);

    // find session
    const session = await sessionModel.findOne({
      user: decoded.id,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Session not found",
      });
    }

    // compare incoming token with stored hash
    const isValid = await bcrypt.compare(token, session.refreshTokenHash);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // generate new tokens
    const newAccessToken = jwt.sign(
      { id: decoded.id, sessionId: session._id },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, sessionId: session._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // hash and rotate refresh token
    const newHash = await bcrypt.hash(newRefreshToken, 10);
    session.refreshTokenHash = newHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({
        message: "Refresh token not found",
      });
    }

    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);

    const session = await sessionModel.findOne({
      user: decoded.id,
      revoked: false,
    });

    if (!session) {
      return res.status(400).json({
        message: "Session not found",
      });
    }

    const isValid = await bcrypt.compare(token, session.refreshTokenHash);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    // revoke session
    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutAll = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh Token not found",
      });
    }

    const decoded = await jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    await sessionModel.updateMany(
      {
        user: decoded._id,
        revoked: false,
      },
      {
        revoked: true,
      },
    );

    (res, clearCookie("refreshToken"));

    return res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error(`[ERROR]: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;

    const otpDoc = await otpModel.findOne({ email });

    if (!otpDoc) {
      return res.status(400).json({
        message: "OTP not found",
      });
    }

    const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const user = await userModel.findByIdAndUpdate(
      otpDoc.user,
      { verified: true },
      { new: true }, // important
    );

    await otpModel.deleteMany({
      user: otpDoc.user,
    });

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
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
