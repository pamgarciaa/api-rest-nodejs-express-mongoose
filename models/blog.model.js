import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    },

    content: {
      type: String, 
      required: true, 
    },

    image: {
      type: String, 
      required: true, 
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true, 
    },
  },

  {
    timestamps: true, 
  }
);


const Blog = mongoose.model("Blog", blogSchema);

export default Blog;

