import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
config({
  path: "./config/config.env",
});

const app = express();

//Using MiddleWare
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

//Importing & Using Routes
import user from "./routes/userRoutes.js";
import blog from "./routes/blogRoutes.js";

app.use("/api/v1", user);
app.use("/api/v1", blog);

export default app;
