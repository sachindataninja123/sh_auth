import express from "express";
import {
  getMe,
  refreshToken,
  registerController,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

//POST /api/auth/register
authRouter.post("/register", registerController);

//GET /api/auth/get-me
authRouter.get("/get-me", getMe);

//GET /api/auth/refresh-token
authRouter.get("/refresh-token", refreshToken);

export default authRouter;
