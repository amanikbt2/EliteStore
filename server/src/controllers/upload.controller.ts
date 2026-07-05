import { Request, Response } from "express";
import { imagekit } from "../config/imagekit";
import { sendSuccess, sendError } from "../utils";
import crypto from "crypto";

export const uploadImage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No file provided", 400);
      return;
    }

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `image_${Date.now()}_${req.file.originalname}`,
      folder: "/elitestore/images",
    });

    sendSuccess(
      res,
      { url: result.url, fileId: result.fileId },
      "Image uploaded",
    );
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    sendError(res, "Image upload failed", 500);
  }
};

export const uploadApk = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, "No file provided", 400);
      return;
    }

    // Calculate SHA256 checksum
    const hash = crypto.createHash("sha256");
    hash.update(req.file.buffer);
    const checksum = hash.digest("hex");

    const { appName, packageName, versionName } = req.body;
    let fileName = `apk_${Date.now()}_${req.file.originalname}`;

    if (appName && packageName && versionName) {
      const cleanName = appName.replace(/[^a-zA-Z0-9]/g, "_");
      fileName = `${cleanName}_${packageName}_v${versionName}.apk`;
    }

    const existingFilesResponse = await imagekit.listFiles({
      folder: "/elitestore/apks",
      limit: 100,
    } as any);
    const existingFiles = Array.isArray(existingFilesResponse)
      ? existingFilesResponse
      : (existingFilesResponse as any)?.data || [];

    const normalizedExpectedName = fileName.toLowerCase();
    const existingFile = existingFiles.find((file: any) => {
      const existingName = (file?.name || "").toLowerCase();
      return [
        normalizedExpectedName,
        normalizedExpectedName.replace(/\.apk$/i, ""),
        `${normalizedExpectedName.replace(/\.apk$/i, "")}.apk`,
      ].includes(existingName);
    }) as any;

    if (existingFile?.url) {
      sendSuccess(
        res,
        {
          url: existingFile.url,
          fileId: existingFile.fileId,
          fileSize: req.file.size,
          checksum,
          skippedUpload: true,
        },
        "APK already exists, reused",
      );
      return;
    }

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName,
      folder: "/elitestore/apks",
      useUniqueFileName: false,
    });

    sendSuccess(
      res,
      {
        url: result.url,
        fileId: result.fileId,
        fileSize: req.file.size,
        checksum,
        skippedUpload: false,
      },
      "APK uploaded",
    );
  } catch (error) {
    console.error("ImageKit APK Upload Error:", error);
    sendError(res, "APK upload failed", 500);
  }
};
