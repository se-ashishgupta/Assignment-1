import express from "express";
import {
  createBlog,
  deleteBlog,
  // getAllBlogs,
  getBlogsofFollwoing,
  likeAndDislikeBlog,
  updateCaption,
} from "../controllers/userBlogController.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.route("/blog/upload").post(isAuthenticated, createBlog);

router
  .route("/blog/:id")
  .get(isAuthenticated, likeAndDislikeBlog)
  .put(isAuthenticated, updateCaption)
  .delete(isAuthenticated, deleteBlog);

router.route("/blogs").get(isAuthenticated, getBlogsofFollwoing);

// router.route("/allblogs").get(isAuthenticated, getAllBlogs);

export default router;
