import Blog from "../models/blog.model.js";
import fs from "fs-extra";
const createBlog = async (blogData) => {
  return await Blog.create(blogData);
};

const getAllBlogs = async () => {
  return await Blog.find().populate("author", "username email");
};


const updateBlog = async (id, updateData, newImageFilename) => {
  const blog = await Blog.findById(id);

  if (!blog) throw new Error("Blog not found");

  
  if (newImageFilename) {
    
    if (blog.image) {
      const oldPath = "uploads/" + blog.image;

      if (await fs.pathExists(oldPath)) {
        await fs.remove(oldPath);
      }
    }
    updateData.image = newImageFilename;
  }

  
  Object.assign(blog, updateData);

 
  await blog.save();


  return blog;
};


const deleteBlog = async (id) => {
  
  const blog = await Blog.findById(id);

  if (!blog) throw new Error("Blog not found");

  if (blog.image) {
    const imagePath = "uploads/" + blog.image;
    if (await fs.pathExists(imagePath)) {
      await fs.remove(imagePath);
    }
  }

  await Blog.findByIdAndDelete(id);

  return true; 
};

export default {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
};


