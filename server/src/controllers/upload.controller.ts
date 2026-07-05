import { Request, Response } from "express";
import { imagekit } from "../config/imagekit";
import { sendSuccess, sendError } from "../utils";
import crypto from "crypto";
import fetch from "node-fetch";

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

    const hash = crypto.createHash("sha256");
    hash.update(req.file.buffer);
    const checksum = hash.digest("hex");

    const { appName, packageName, versionName } = req.body;
    let fileName = `apk_${Date.now()}_${req.file.originalname}`;

    if (appName && packageName && versionName) {
      const cleanName = appName.replace(/[^a-zA-Z0-9]/g, "_");
      fileName = `${cleanName}_${packageName}_v${versionName}.apk`;
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubOwner || !githubRepo) {
      sendError(res, "GitHub upload not configured", 500);
      return;
    }

    const releaseTag = process.env.GITHUB_RELEASE_TAG || "latest";
    const releaseApiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases/tags/${releaseTag}`;

    let release: any;
    const releaseRes = await fetch(releaseApiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (releaseRes.ok) {
      release = await releaseRes.json();
    } else if (releaseRes.status === 404) {
      const createReleaseRes = await fetch(
        `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            tag_name: releaseTag,
            name: `Release ${releaseTag}`,
            draft: false,
            prerelease: false,
          }),
        },
      );

      if (!createReleaseRes.ok) {
        throw new Error("Failed to create GitHub release");
      }
      release = await createReleaseRes.json();
    } else {
      throw new Error("Failed to access GitHub release");
    }

    const assetName = fileName;
    const existingAssets = release.assets || [];
    const existingAsset = existingAssets.find(
      (asset: any) => asset.name === assetName,
    );

    if (existingAsset?.browser_download_url) {
      sendSuccess(
        res,
        {
          url: existingAsset.browser_download_url,
          fileId: existingAsset.id,
          fileSize: req.file.size,
          checksum,
          skippedUpload: true,
        },
        "APK already exists, reused",
      );
      return;
    }

    const uploadUrl = `https://uploads.github.com/repos/${githubOwner}/${githubRepo}/releases/${release.id}/assets?name=${encodeURIComponent(assetName)}`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/vnd.android.package-archive",
      },
      body: req.file.buffer,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload APK to GitHub release");
    }

    const uploadedAsset = await uploadRes.json();

    sendSuccess(
      res,
      {
        url: uploadedAsset.browser_download_url,
        fileId: uploadedAsset.id,
        fileSize: req.file.size,
        checksum,
        skippedUpload: false,
      },
      "APK uploaded to GitHub release",
    );
  } catch (error) {
    console.error("GitHub APK Upload Error:", error);
    sendError(res, "APK upload failed", 500);
  }
};
