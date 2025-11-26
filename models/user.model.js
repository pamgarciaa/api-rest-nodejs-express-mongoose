
import mongoose from "mongoose";
import bcrypt from "bcrypt";


const userSchema = mongoose.Schema(
  {
    username: {
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      lowercase: true, 
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      
      select: false,
    },
    profilePicture: {
      type: String,
      default: "./uploads/profile_pictures/defaultimage.png",
    },
    address: {
      type: String,
      default: "", 
    },
    phone: {
      type: String,
      default: "",
    },
    resetPasswordToken: String, 
    resetPasswordExpire: Date, 
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
  },
  
  { timestamps: true }
);


userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return; 
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model("User", userSchema);

export default User;
