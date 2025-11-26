import express from "express";

import {
  register, 
  login, 
  logout, 
  remove, 
  getAllUsers, 
  resetPassword, 
  forgotPassword, 
  updateUserProfile, 
} from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

import { checkRole } from "../middlewares/role.middleware.js";

import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/register", upload.single("profilePicture"), register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/getallusers", protect, checkRole("admin"), getAllUsers);

router.post("/forgotpassword", forgotPassword);

router.post("/resetpassword", resetPassword);

router.delete("/:id", protect, checkRole("admin"), remove);

router.put(
  "/profile",
  protect,
  upload.single("profilePicture"),
  updateUserProfile
);

export default router;

