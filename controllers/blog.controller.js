import blogService from "../services/blog.service.js";

import fs from "fs-extra";

const createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const blogData = {
      title,
      content,
      image: req.file.filename,
      author: req.user._id,
    };

    const newBlog = await blogService.createBlog(blogData);

    res.status(201).json(newBlog);
  } catch (error) {
    if (req.file) await fs.remove(req.file.path);

    res.status(400).json({ message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const newImage = req.file ? req.file.filename : undefined;

    const updatedBlog = await blogService.updateBlog(id, updateData, newImage);

    res.json(updatedBlog);
  } catch (error) {
    if (req.file) await fs.remove(req.file.path);

    if (error.message === "Blog not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    if (error.message === "Blog not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await blogService.getAllBlogs();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createBlog, updateBlog, deleteBlog, getAllBlogs };


