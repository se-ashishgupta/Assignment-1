import { User } from "../models/User.js";
import { Blog } from "../models/Blog.js";
import cloundinary from "cloudinary";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, cpassword, avatar } = req.body;

    let user = await User.findOne({ email });

    if (password != cpassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match",
      });
    }

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already Exists",
      });
    }
    const myCloud = await cloundinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });

    user = await User.create({
      name,
      email,
      password,
      cpassword,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    const token = await user.generateToken();
    const option = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(201).cookie("token", token, option).json({
      success: true,
      user,
      token,
      message: "User Created Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select("+password")
      .populate("blogs following followers");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const token = await user.generateToken();
    const option = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("token", token, option).json({
      success: true,
      user,
      token,
      message: "Logged In Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()) })
      .json({
        success: true,
        message: "Logged Out Successfully",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
      const indexFollowers = userToFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexFollowing, 1);
      userToFollow.followers.splice(indexFollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      return res.status(200).json({
        success: true,
        message: "User Unfollowed Successfully",
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Followed Successfully",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword, cnewPassword } = req.body;

    if (!oldPassword || !newPassword || !cnewPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    if (newPassword != cnewPassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old Password is incorrect",
      });
    }

    user.password = newPassword;
    user.cpassword = cnewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, avatar } = req.body;
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    //user Avatar
    if (avatar) {
      await cloundinary.v2.uploader.destroy(user.avatar.public_id);

      const myCloud = await cloundinary.v2.uploader.upload(avatar, {
        folder: "avatars",
      });
      user.avatar.public_id = myCloud.public_id;
      user.avatar.url = myCloud.secure_url;
    }

    await user.save();

    res.status(200).json({
      sucess: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const blogs = user.blogs;
    const userId = user._id;
    const followers = user.followers;
    const following = user.following;

    //Removing Avatar from cloudinary
    await cloundinary.v2.uploader.destroy(user.avatar.public_id);

    await user.remove();

    //Logout the user after deleting the profile
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    //Remove the user from the follwer's following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }
    //Remove the user from the following's  follower
    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);
      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }

    //Delete all the blogs of the user
    for (let i = 0; i < blogs.length; i++) {
      const blog = await Blog.findById(blogs[i]);
      await cloundinary.v2.uploader.destroy(blog.image.public_id);
      await blog.remove();
    }

    res.status(200).json({
      success: true,
      message: "Profile Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const myProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).populate("blogs");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("blogs");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBlogs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const blogs = [];

    for (let i = 0; i < user.blogs.length; i++) {
      const blog = await Blog.findById(user.blogs[i]).populate(
        "owner likes comments.user"
      );
      blogs.push(blog);
    }

    res.status(200).json({
      success: true,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
