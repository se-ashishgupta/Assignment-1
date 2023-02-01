import { Blog } from "../models/Blog.js";
import { User } from "../models/User.js";
import cloudinary from "cloudinary";

export const createBlog = async (req, res, next) => {
  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
      folder: "blogs",
    });
    const newBlogdata = {
      caption: req.body.caption,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      owner: req.user._id,
    };

    const blog = await Blog.create(newBlogdata);
    const user = await User.findById(req.user._id);
    user.blogs.unshift(blog._id);
    await user.save();
    res.status(201).json({
      success: true,
      message: "Blog Created Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog Not Found",
      });
    }
    if (blog.owner.toString() != req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    await cloudinary.v2.uploader.destroy(blog.image.public_id);

    await blog.remove();
    const user = await User.findById(req.user._id);
    const index = user.blogs.indexOf(blog._id);
    user.blogs.splice(index, 1);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Blog Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const likeAndDislikeBlog = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog Not Found",
      });
    }

    if (post.likes.includes(req.user._id)) {
      const index = post.likes.indexOf(req.user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Blog Disliked Successfully",
      });
    } else {
      post.likes.push(req.user._id);

      await post.save();
      return res.status(200).json({
        success: true,
        message: "Blog Liked Successfully",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBlogsofFollwoing = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const blogs = await Blog.find({ owner: { $in: user.following } }).populate(
      "owner likes comments.user"
    );
    res.status(200).json({
      success: true,
      blogs: blogs.reverse(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCaption = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog Not Found",
      });
    }

    if (post.owner.toString() != req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    post.caption = req.body.caption;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Caption Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const getAllBlogs = async (req, res, next) => {
//   try {
//     const blogs = await Blog.find().populate("owner likes comments.user");
//     res.status(200).json({
//       success: true,
//       blogs: blogs.reverse(),
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
