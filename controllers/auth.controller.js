import authService from "../services/auth.service.js";
import generateToken from "../utils/generateToken.util.js";
import User from "../models/user.model.js";
import fs from "fs-extra";

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  
  res.status(statusCode).cookie("jwt", token, options).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
  });
};


const register = async (req, res) => {
  try {
    
    const pictureName = req.file ? req.file.filename : "default-avatar.png";

    const userData = {
      ...req.body,
      profilePicture: pictureName,
    };

    const user = await authService.registerUser(userData);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (req.file && req.file.path) {
      await fs.remove(req.file.path); 
    }
    
    res.status(400).json({ message: error.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.loginUser(email, password);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};


const logout = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};


const remove = async (req, res) => {
  try {
    await authService.deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const pin = await authService.forgotPassword(email);

    res.json({
      message: "Email sent successfully",
      pin: pin,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const currentUser = await User.findById(userId);
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.phone) updates.phone = req.body.phone;

    if (req.file) {
      updates.profilePicture = req.file.filename;

      if (
        currentUser.profilePicture &&
        currentUser.profilePicture !== "default-avatar.png"
      ) {
        const oldPath = "uploads/" + currentUser.profilePicture;
        if (await fs.pathExists(oldPath)) {
          await fs.remove(oldPath);
        }
      }
    }

    const updatedUser = await authService.updateUserProfile(userId, updates);
    res.json(updatedUser);
  } catch (error) {
    if (req.file && req.file.path) {
      await fs.remove(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
};

export {
  register,
  login,
  logout,
  remove,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};
