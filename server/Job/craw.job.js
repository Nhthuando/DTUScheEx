import cron from 'node-cron';
import { scrapeCourse } from "../controllers/GetSche.controller.js";

cron.schedule("0 */5 * * *", async () => {
    console.log("[CRON] Bắt đầu cào danh sách thi...");
    try {
        const result = await scrapeCourse();
        console.log("[CRON] Xong!", result);
    } catch (err) {
        console.error("[CRON] Lỗi:", err.message);
    }
});
