import axios from "axios";
import * as cheerio from "cheerio";
import * as xlsx from "xlsx";
import prisma from "../config/prisma.js";

export const scrapeCourse = async () => {
    const response = await axios.get("https://pdaotao.duytan.edu.vn/EXAM_LIST/?lang=VN");
    const $ = cheerio.load(response.data);
    const courses = []
    $('td.border_main a.txt_l4[href*="EXAM_LIST_Detail"]').each((index, element) => {
        const href = $(element).attr("href");
        const text = ($(element).text()).replace(/\s+/g, " ").trim();
        const url = "https://pdaotao.duytan.edu.vn" + href.replace("../", "/");
        courses.push({ name: text, sourceUrl: url });
    })
    await prisma.examPeriod.createMany({ data: courses, skipDuplicates: true, });
    return { success: true, count: courses.length }
}

export const findCourse = async (req, res) => {
    try {
        let { maMonHoc } = req.body;
        if (!maMonHoc) return res.status(400).json({ message: "Trường bắt buộc bị thiếu!" });
        
        const match = maMonHoc.trim().match(/^([a-zA-Z\-]+\s*\d{3,4})\s*(.+)$/i);
        if (!match) return res.status(404).json({ message: "Chưa có phòng thi mã môn học đang tìm kiếm!" });
        
        let baseCourseCode = match[1].trim();
        baseCourseCode = baseCourseCode.replace(/^([a-zA-Z\-]+)(\d+)/i, "$1 $2"); // Format as "MED 705"
        
        const course = await prisma.examPeriod.findFirst({ where: { name: { contains: baseCourseCode, mode: "insensitive" } } });
        if (!course) return res.status(404).json({ message: "Chưa có phòng thi mã môn học đang tìm kiếm!" });
        return res.status(200).json({ message: "Đã tìm ra phòng thi!", maMonHoc, sourceUrl: course.sourceUrl });
    } catch (error) {
        console.log("Lỗi:", error.message);
        console.log("Stack:", error.stack);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
}

export const getExamSche = async (req, res) => {
    try {
        const { sourceUrl } = req.body;
        if (!sourceUrl) return res.status(400).json({ message: "Không tìm thấy sourceUrl!" });
        const examPeriod = await prisma.examPeriod.findFirst({ where: { sourceUrl } });
        if (!examPeriod) return res.status(404).json({ message: "Không tìm thấy đợt thi!" });
        const examPeriodId = examPeriod.id;

        const hasSchedules = await prisma.examSchedule.findFirst({ where: { examPeriodId } });
        const hoursSinceScrape = (new Date() - new Date(examPeriod.scrapedAt)) / (1000 * 60 * 60);
        if (hasSchedules && hoursSinceScrape < 24) {
            return res.status(200).json({ message: "Dữ liệu đã có sẵn trong DB, bỏ qua cào lại!" });
        }

        await prisma.examPeriod.update({
            where: { id: examPeriodId },
            data: { scrapedAt: new Date() }
        });

        const response = await axios.get(sourceUrl);
        const $ = cheerio.load(response.data);
        let url = $('a.txt_l4[href$=".xlsx"]').attr("href");
        if (!url) url = $('a.txt_l4[href$=".xls"]').attr("href");
        if (!url) return res.status(404).json({ message: "Không tìm thấy file Excel đính kèm!" });
        const excelUrl = "https://pdaotao.duytan.edu.vn" + url.replace("../", "/");
        const excelResponse = await axios.get(excelUrl, { responseType: "arraybuffer" });
        const buffer = excelResponse.data;
        const workbook = xlsx.read(buffer, { type: "buffer" });
        let sheetName = workbook.SheetNames.find(name => name.toUpperCase() === "DS_THI" || name.toUpperCase().includes("THI"));
        if (!sheetName) sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        let courseCode = "", courseName = "", credits = null, semester = "", examAttempt = 1, group = "";
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const rowText = rows[i].join(" ").trim();
            const codeMatch = rowText.match(/MÃ MÔN:\s*([A-Z\-]+\s*\d+)/i);
            if (codeMatch) courseCode = codeMatch[1].trim();
            const nameMatch = rowText.match(/(?<!MÃ )MÔN:\s*(.+?)(?:\*|\s{2,}|SỐ)/i);
            if (nameMatch) courseName = nameMatch[1].trim();
            const creditMatch = rowText.match(/SỐ TÍN CHỈ:\s*(\d+)/i);
            if (creditMatch) credits = parseInt(creditMatch[1]);
            const semMatch = rowText.match(/HK:\s*(.+?)(?:\s{2,}|$)/i);
            if (semMatch) semester = semMatch[1].trim();
            const attemptMatch = rowText.match(/Lần thi\s*:\s*(\d+)/i);
            if (attemptMatch) examAttempt = parseInt(attemptMatch[1]);
            const groupMatch = rowText.match(/LỚP:\s*[A-Z\-]+\s*\d+\s*\((.+?)\)/i);
            if (groupMatch) group = groupMatch[1].trim();
        }
        let currentRoom = null;
        let currentLocation = null;
        let currentExamDate = null;
        let currentStartTime = null;
        const schedules = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowText = row.join(" ").trim();
            if (rowText.includes("Thời gian") && rowText.includes("Phòng")) {
                const timeMatch = rowText.match(/Thời gian:\s*(\d{1,2}h\d{2})\s*-\s*(\d{2}\/\d{2}\/\d{4})/i);
                if (timeMatch) {
                    currentStartTime = timeMatch[1];
                    const [day, month, year] = timeMatch[2].split("/");
                    currentExamDate = new Date(`${year}-${month}-${day}`);
                }
                const roomMatch = rowText.match(/Phòng:\s*(.+)/i);
                if (roomMatch) {
                    const roomParts = roomMatch[1].trim();
                    const locMatch = roomParts.match(/^(.+?)\s+-\s+(.+)$/);
                    if (locMatch) {
                        currentRoom = locMatch[1].trim();
                        currentLocation = locMatch[2].trim();
                    } else {
                        currentRoom = roomParts;
                        currentLocation = null;
                    }
                }
                schedules.push({
                    room: currentRoom,
                    location: currentLocation,
                    examDate: currentExamDate,
                    startTime: currentStartTime,
                    students: [],
                });
                continue;
            }
            const maSV = String(row[2] || "").trim();
            if (maSV && /^\d{8,}$/.test(maSV) && schedules.length > 0) {
                const currentSchedule = schedules[schedules.length - 1];
                const rawNote = row[11];
                const note = typeof rawNote === "string" && rawNote.trim() !== "" ? rawNote.trim() : null;
                currentSchedule.students.push({
                    studentId: maSV,
                    lastName: String(row[3] || "").trim(),
                    firstName: String(row[4] || "").trim(),
                    examClass: String(row[5] || "").trim(),
                    classCode: String(row[6] || "").trim(),
                    note,
                });
            }
        }
        const validSchedules = schedules.filter(s => s.students.length > 0);
        for (const schedule of validSchedules) {
            const examSchedule = await prisma.examSchedule.upsert({
                where: {
                    examPeriodId_courseCode_group_room_examDate: {
                        examPeriodId: examPeriodId,
                        courseCode: courseCode,
                        group: group || "",
                        room: schedule.room,
                        examDate: schedule.examDate,
                    }
                },
                update: {},
                create: {
                    examPeriodId,
                    courseCode,
                    courseName,
                    group,
                    examDate: schedule.examDate,
                    startTime: schedule.startTime,
                    room: schedule.room,
                    location: schedule.location,
                    examAttempt,
                    semester,
                    credits,
                }
            });
            if (schedule.students.length > 0) {
                await prisma.examStudent.createMany({
                    data: schedule.students.map(s => ({
                        examScheduleId: examSchedule.id,
                        studentId: s.studentId,
                        lastName: s.lastName,
                        firstName: s.firstName,
                        classCode: s.classCode,
                        note: s.note,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return res.status(200).json({ message: "Đã parse và lưu Excel thành công!", totalRooms: schedules.length, totalStudents: schedules.reduce((sum, s) => sum + s.students.length, 0) });
    } catch (error) {
        console.log("Lỗi:", error.message);
        console.log("Stack:", error.stack);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
}

export const findExamSche = async (req, res) => {
    try {
        const { maSinhVien, maMonHoc } = req.body;
        if (!maSinhVien || !maMonHoc) return res.status(400).json({ message: "Các trường bắt buộc bị thiếu!" });
        
        const match = maMonHoc.trim().match(/^([a-zA-Z\-]+\s*\d{3,4})\s*(.+)$/i);
        if (!match) return res.status(404).json({ message: "Không tìm thấy phòng thi cho sinh viên này!" });
        
        let baseCourseCode = match[1].trim();
        baseCourseCode = baseCourseCode.replace(/^([a-zA-Z\-]+)(\d+)/i, "$1 $2");
        let groupCode = match[2].trim().replace(/[()]/g, '');

        const results = await prisma.examStudent.findMany({
            where: {
                studentId: maSinhVien,
                examSchedule: {
                    courseCode: { contains: baseCourseCode, mode: "insensitive" },
                    group: { contains: groupCode, mode: "insensitive" }
                },
            },
            include: {
                examSchedule: {
                    select: {
                        courseCode: true,
                        courseName: true,
                        group: true,
                        examDate: true,
                        startTime: true,
                        room: true,
                        location: true,
                        examAttempt: true,
                        semester: true,
                    }
                }
            }
        });
        if (results.length === 0) return res.status(404).json({ message: "Không tìm thấy phòng thi cho sinh viên này!" });
        return res.status(200).json({ message: "Đã tìm thấy thông tin!", data: results });
    } catch (error) {
        console.log("Lỗi:", error.message);
        console.log("Stack:", error.stack);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
}

export const getAllSche = async (req, res) => {
    try {
        const schedules = await prisma.examPeriod.findMany({
            orderBy: { scrapedAt: 'desc' },
            take: 100
        });
        if (schedules.length === 0) return res.status(404).json({ message: "Chưa có bất cứ dữ liệu nào!" });
        return res.status(200).json({ message: "Ok!", data: schedules });
    } catch (error) {
        console.log("Lỗi:", error.message);
        console.log("Stack:", error.stack);
        res.status(500).json({ error: "Có lỗi server!", detail: error.message });
    }
}