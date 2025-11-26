
import express from "express";

import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
} from "../controllers/blog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
const router = express.Router();

router.get("/", getAllBlogs);


router.post(
  "/",
  protect,
  checkRole(["admin", "moderator"]),
  upload.single("image"),
  createBlog
);


router.put(
  "/:id", 
  protect,
  checkRole(["admin", "moderator"]),
  upload.single("image"), 
  updateBlog
);

router.delete("/:id", protect, checkRole(["admin", "moderator"]), deleteBlog);

export default router;

