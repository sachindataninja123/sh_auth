import express from "express";
import {
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  registerController,
  verifyEmail,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

//POST /api/auth/register
authRouter.post("/register", registerController);

//POST /api/get/login
authRouter.post("/login", login);

//GET /api/auth/get-me
authRouter.get("/get-me", getMe);

//GET /api/auth/refresh-token
authRouter.get("/refresh-token", refreshToken);

//GET /api/auth/logout
authRouter.get("/logout", logout);

//GET /api/auth/logout-all
authRouter.get("/logout-all", logoutAll);

//POST /api/auth/verify-email
authRouter.post("/verify-email", verifyEmail);

export default authRouter;
