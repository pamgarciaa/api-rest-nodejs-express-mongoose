
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import logger from "./middlewares/logger.middleware.js";
import dotenv from "dotenv";
import connectDB from "./config/database.config.js";

const app = express();

dotenv.config();

connectDB();

app.use(express.json());

app.use(cookieParser());

app.use(logger);

app.use("/uploads", express.static("uploads"));

app.use("/api/users", authRoutes);

app.use("/api/blogs", blogRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

