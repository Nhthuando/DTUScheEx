import express from "express";
import { scrapeCourse, findCourse, findExamSche, getExamSche } from "../controllers/GetSche.controller.js"

const router = express.Router();

// GET — trigger cào thủ công (không cần body)
router.get("/scrape", async (req, res) => {
    try {
        const result = await scrapeCourse();
        return res.status(200).json({ message: "Cào thành công!", ...result });
    } catch (error) {
        console.log("Lỗi:", error.message);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
});

// POST — các endpoint nhận body
router.post("/findCourse", findCourse);
router.post("/getExamSchedule", getExamSche);
router.post("/findExamSchedule", findExamSche);

export default router;