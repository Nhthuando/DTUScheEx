import express from "express";
import { scrapeCourse, findCourse, findExamSche, getExamSche, getAllSche } from "../controllers/GetSche.controller.js"

const router = express.Router();

router.get("/scrape", async (req, res) => {
    try {
        const result = await scrapeCourse();
        return res.status(200).json({ message: "Cào thành công!", ...result });
    } catch (error) {
        console.log("Lỗi:", error.message);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
});

router.post("/findCourse", findCourse);
router.post("/getExamSchedule", getExamSche);
router.post("/findExamSchedule", findExamSche);
router.get("/allSche", getAllSche);

export default router;