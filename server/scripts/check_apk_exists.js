// Simple script to reproduce APK exists check from upload.controller
// Usage: node check_apk_exists.js <appName> <packageName> <versionName> <githubOwner> <githubRepo> [githubToken]

const [
  ,
  ,
  appName,
  packageName,
  versionName,
  githubOwner,
  githubRepo,
  githubToken,
] = process.argv;

if (!appName || !packageName || !versionName || !githubOwner || !githubRepo) {
  console.error(
    "Usage: node check_apk_exists.js <appName> <packageName> <versionName> <githubOwner> <githubRepo> [githubToken]",
  );
  process.exit(1);
}

const normalize = (s) => s.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();

(async () => {
  try {
    const cleanName = appName.replace(/[^a-zA-Z0-9]/g, "_");
    const assetName = `${cleanName}_${packageName}_v${versionName}.apk`;

    console.log("Computed assetName:", assetName);

    const listReleasesUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases`;
    const headers = { Accept: "application/vnd.github+json" };
    if (githubToken) headers.Authorization = `token ${githubToken}`;

    const res = await fetch(listReleasesUrl, { headers });
    if (!res.ok) {
      console.error("Failed to list releases", res.status, await res.text());
      process.exit(2);
    }

    const releases = await res.json();

    for (const r of releases) {
      const assets = r.assets || [];
      const match = assets.find(
        (a) => normalize(a.name) === normalize(assetName),
      );
      if (match) {
        console.log("Found asset in release:", r.tag_name || r.name);
        console.log("Asset name:", match.name);
        console.log("Browser URL:", match.browser_download_url);
        process.exit(0);
      }
    }

    console.log("Asset not found in any release.");
    process.exit(3);
  } catch (err) {
    console.error("Error:", err);
    process.exit(4);
  }
})();
