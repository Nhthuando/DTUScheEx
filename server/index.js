import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import getScheRoute from "./routes/GetSche.route.js"
import "./Job/craw.job.js";

const app = express();
app.use(express.json());

const PORT = (process.env.PORT || 5000);

app.use("/api/exams", getScheRoute);

app.listen(PORT, () => {
    console.log("-----------------------------------------------");
    console.log("CovAI server đang được chạy dưới port: " + PORT);
    console.log("-----------------------------------------------");
})