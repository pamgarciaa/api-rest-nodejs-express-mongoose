import crypto from "crypto";
import User from "../models/user.model.js";

const registerUser = async (userData) => {
  const { username, email, password, profilePicture } = userData;
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error("User already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
    profilePicture,
  });

  return user;
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new Error("Invalid email or password");
  const isMatch = await user.matchPassword(password);

  if (!isMatch) throw new Error("Invalid email or password");

  return user;
};


const deleteUser = async (id) => {
  const user = await User.findById(id);

  if (!user) throw new Error("User not found");

  await User.findByIdAndDelete(id);

  return true;
};

const getAllUsers = async () => {
  return await User.find().select("-password");
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  const resetToken = crypto.randomInt(100000, 999999).toString();

  user.resetPasswordToken = resetToken;

  user.resetPasswordExpire = Date.now() + 3600000;

  await user.save();

  return resetToken;
};


const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired PIN");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return true;
};


const updateUserProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true, 
    runValidators: true, 
  }).select("-password"); 

  if (!user) throw new Error("User not found");
  return user;
};

export default {
  registerUser,
  loginUser,
  deleteUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};
