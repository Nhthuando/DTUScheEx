import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import getScheRoute from "./routes/GetSche.route.js"
import "./Job/craw.job.js";
import { scrapeCourse } from "./controllers/GetSche.controller.js"
const app = express();
app.use(cors());
app.use(express.json());
const PORT = (process.env.PORT || 5000);

app.use("/api/exams", getScheRoute);

app.listen(PORT, () => {
    console.log("-----------------------------------------------");
    console.log("CovAI server đang được chạy dưới port: " + PORT);
    console.log("-----------------------------------------------");
    scrapeCourse();
})