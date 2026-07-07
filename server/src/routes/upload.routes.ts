import { Router } from "express";
import { uploadImage, uploadApk, checkApkExists } from "../controllers/upload.controller";
import { upload } from "../config/imagekit";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/image", requireAdmin, upload.single("file"), uploadImage);
router.get("/check-apk", requireAdmin, checkApkExists);
router.post("/apk", requireAdmin, upload.single("file"), uploadApk);

export default router;
