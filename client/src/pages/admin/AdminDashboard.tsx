import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Upload,
  LayoutGrid,
  Search,
  ArrowLeft,
  History,
  UploadCloud,
  BarChart3,
  AppWindow,
  Star,
  Download,
  Copy,
  Check,
  Trash2,
  Activity,
  Globe2,
  Eraser,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "apps" | "logs">(
    "overview",
  );
  const [apps, setApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isPublishingNew, setIsPublishingNew] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [stats, setStats] = useState({
    totalApps: 0,
    totalDownloads: 0,
    pendingReviews: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [appSize, setAppSize] = useState("");
  const [description, setDescription] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<FileList | null>(null);

  const iconInputRef = useRef<HTMLInputElement>(null);
  const apkInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);

  const [updateVersion, setUpdateVersion] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateApkFile, setUpdateApkFile] = useState<File | null>(null);
  const [updateIconFile, setUpdateIconFile] = useState<File | null>(null);
  const [updateScreenshotFiles, setUpdateScreenshotFiles] =
    useState<FileList | null>(null);
  const [updateDescription, setUpdateDescription] = useState("");
  const updateApkInputRef = useRef<HTMLInputElement>(null);
  const updateIconInputRef = useRef<HTMLInputElement>(null);
  const updateScreenshotsInputRef = useRef<HTMLInputElement>(null);
  const [isTogglingDownload, setIsTogglingDownload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    fetchApps();
    fetchStats();
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (activeTab === "logs") {
      fetchLogs(); // Initial fetch
      intervalId = setInterval(() => {
        fetchLogs(true); // Poll silently
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchApps = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/api/apps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApps(data.data.apps || []);
      }
    } catch (error) {
      console.error("Error fetching apps:", error);
    }
  };

  const fetchLogs = async (hideLoader = false) => {
    if (!hideLoader) setIsFetchingLogs(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/api/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLogs(data.data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      if (!hideLoader) setIsFetchingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all logs? This cannot be undone.",
      )
    )
      return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/api/logs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Logs cleared successfully");
        setLogs([]);
      }
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  const uploadWithProgress = async (
    url: string,
    formData: FormData,
    token: string | null,
    label: string,
  ) => {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          setUploadStatus(`${label} ${percent}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`${label} failed`));
        }
      };

      xhr.onerror = () => reject(new Error(`${label} failed`));
      xhr.send(formData);
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !appName ||
      !packageName ||
      !developer ||
      !description ||
      !iconFile ||
      !apkFile
    ) {
      return toast.error(
        "Please fill in all required fields and select an Icon and APK.",
      );
    }

    setIsPublishing(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");
    const toastId = toast.loading("Uploading files...");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");

      // 1. Upload Icon
      const iconFormData = new FormData();
      iconFormData.append("file", iconFile);
      setUploadStatus("Uploading icon...");
      const iconRes = await uploadWithProgress(
        `${apiUrl}/api/upload/image`,
        iconFormData,
        token,
        "Uploading icon",
      );
      const iconData = iconRes;
      if (!iconData.success) throw new Error("Icon upload failed");

      // 2. Upload APK
      toast.loading("Uploading APK...", { id: toastId });
      const apkFormData = new FormData();
      apkFormData.append("file", apkFile);
      apkFormData.append("appName", appName);
      apkFormData.append("packageName", packageName);
      apkFormData.append("versionName", "1.0.0");
      setUploadStatus("Uploading APK...");
      const apkRes = await uploadWithProgress(
        `${apiUrl}/api/upload/apk`,
        apkFormData,
        token,
        "Uploading APK",
      );
      const apkData = apkRes;
      if (!apkData.success) throw new Error("APK upload failed");
      if (apkData.skippedUpload) {
        setUploadStatus("Existing APK found, continuing...");
        setUploadProgress(100);
      }

      // 3. Upload Screenshots
      toast.loading("Uploading Screenshots...", { id: toastId });
      const uploadedScreenshots = [];
      if (screenshotFiles) {
        for (let i = 0; i < screenshotFiles.length; i++) {
          const ssFormData = new FormData();
          ssFormData.append("file", screenshotFiles[i]);
          setUploadStatus(
            `Uploading screenshot ${i + 1}/${screenshotFiles.length}...`,
          );
          const ssRes = await uploadWithProgress(
            `${apiUrl}/api/upload/image`,
            ssFormData,
            token,
            `Uploading screenshot ${i + 1}/${screenshotFiles.length}`,
          );
          if (ssRes.success) uploadedScreenshots.push(ssRes.data.url);
        }
      }

      // 4. Save App to MongoDB
      toast.loading("Publishing App...", { id: toastId });
      setUploadStatus("Publishing app...");
      setUploadProgress(100);
      const appRes = await fetch(`${apiUrl}/api/apps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: appName,
          packageName,
          developer,
          description,
          iconUrl: iconData.data.url,
          apkUrl: apkData.data.url,
          apkSize: apkData.data.fileSize,
          checksum: apkData.data.checksum,
          size: appSize,
          screenshots: uploadedScreenshots,
        }),
      });

      const appResult = await appRes.json();
      if (!appResult.success)
        throw new Error(
          appResult.message || appResult.error || "Failed to publish app",
        );

      toast.success("App published successfully!", { id: toastId });
      setIsPublishingNew(false);
      fetchApps(); // Refresh the list

      // Reset form
      setAppName("");
      setPackageName("");
      setDeveloper("");
      setAppSize("");
      setDescription("");
      setIconFile(null);
      setApkFile(null);
      setScreenshotFiles(null);
    } catch (error: any) {
      toast.error(error.message || "Error publishing app", { id: toastId });
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  };

  const handleReleaseUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateVersion || !updateNotes || !updateApkFile || !selectedApp) {
      return toast.error("Please fill all fields and select the new APK file.");
    }

    setIsPublishing(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");
    const toastId = toast.loading("Uploading new APK...");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");

      // 1. Upload new APK
      const apkFormData = new FormData();
      apkFormData.append("file", updateApkFile);
      apkFormData.append("appName", selectedApp.name);
      apkFormData.append("packageName", selectedApp.packageName);
      apkFormData.append("versionName", updateVersion);
      setUploadStatus("Uploading APK...");
      const apkRes = await uploadWithProgress(
        `${apiUrl}/api/upload/apk`,
        apkFormData,
        token,
        "Uploading APK",
      );
      const apkData = apkRes;
      if (!apkData.success) throw new Error("APK upload failed");
      if (apkData.skippedUpload) {
        setUploadStatus("Existing APK found, continuing...");
        setUploadProgress(100);
      }

      // 2. Upload new Icon if provided
      let newIconUrl: string | undefined;
      if (updateIconFile) {
        toast.loading("Uploading icon...", { id: toastId });
        const iconFormData = new FormData();
        iconFormData.append("file", updateIconFile);
        setUploadStatus("Uploading icon...");
        const iconRes = await uploadWithProgress(
          `${apiUrl}/api/upload/image`,
          iconFormData,
          token,
          "Uploading icon",
        );
        const iconData = iconRes;
        if (iconData.success) newIconUrl = iconData.data.url;
      }

      // 3. Upload new Screenshots if provided
      const newScreenshots: string[] = [];
      if (updateScreenshotFiles && updateScreenshotFiles.length > 0) {
        toast.loading("Uploading screenshots...", { id: toastId });
        for (let i = 0; i < updateScreenshotFiles.length; i++) {
          const ssFormData = new FormData();
          ssFormData.append("file", updateScreenshotFiles[i]);
          setUploadStatus(
            `Uploading screenshot ${i + 1}/${updateScreenshotFiles.length}...`,
          );
          const ssRes = await uploadWithProgress(
            `${apiUrl}/api/upload/image`,
            ssFormData,
            token,
            `Uploading screenshot ${i + 1}/${updateScreenshotFiles.length}`,
          );
          if (ssRes.success) newScreenshots.push(ssRes.data.url);
        }
      }

      // 4. Publish the update
      toast.loading("Publishing Update...", { id: toastId });
      setUploadStatus("Publishing update...");
      setUploadProgress(100);
      const updateRes = await fetch(
        `${apiUrl}/api/apps/${selectedApp.packageName}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            versionName: updateVersion,
            releaseNotes: updateNotes,
            apkUrl: apkData.data.url,
            apkSize: apkData.data.fileSize,
            checksum: apkData.data.checksum,
            ...(updateDescription && { description: updateDescription }),
            ...(newIconUrl && { iconUrl: newIconUrl }),
            ...(newScreenshots.length > 0 && { screenshots: newScreenshots }),
          }),
        },
      );

      const updateResult = await updateRes.json();
      if (!updateResult.success) throw new Error("Failed to publish update");

      toast.success("Update released successfully!", { id: toastId });
      fetchApps();
      fetchStats();
      // Refresh selected app data
      const updatedAppRes = await fetch(
        `${apiUrl}/api/apps/${selectedApp.packageName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const updatedApp = await updatedAppRes.json();
      if (updatedApp.success) setSelectedApp(updatedApp.data.app);

      setUpdateVersion("");
      setUpdateNotes("");
      setUpdateApkFile(null);
      setUpdateIconFile(null);
      setUpdateScreenshotFiles(null);
      setUpdateDescription("");
    } catch (error: any) {
      toast.error(error.message || "Error releasing update", { id: toastId });
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  };

  const handleToggleDownload = async () => {
    if (!selectedApp) return;
    setIsTogglingDownload(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${apiUrl}/api/apps/${selectedApp.packageName}/toggle-download`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error("Toggle failed");
      const newState = data.data.downloadEnabled;
      // Update selectedApp view
      setSelectedApp((prev: any) => ({ ...prev, downloadEnabled: newState }));
      // Also sync the apps list so the badge updates on the card
      setApps((prev: any[]) =>
        prev.map((a) =>
          a.packageName === selectedApp.packageName
            ? { ...a, downloadEnabled: newState }
            : a,
        ),
      );
      toast.success(
        `Downloads ${newState ? "enabled ✓" : "disabled ✗"} for ${selectedApp.name}`,
      );
    } catch {
      toast.error("Failed to toggle download status");
    } finally {
      setIsTogglingDownload(false);
    }
  };

  const handleSelectApp = async (app: any) => {
    // Optimistically set it so UI transitions immediately
    setSelectedApp(app);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/api/apps/${app.packageName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.app) {
        // Update with full details including version history
        setSelectedApp(data.data.app);
      }
    } catch (e) {
      console.error("Failed to fetch full app details", e);
    }
  };

  const handleDeleteApp = async () => {
    if (!selectedApp) return;

    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${selectedApp.name}"? This will wipe the app, all versions, reviews, and uploaded files completely. This action CANNOT be undone.`,
      )
    ) {
      return;
    }

    setIsDeletingApp(true);
    const toastId = toast.loading("Deleting app and wiping files...");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${apiUrl}/api/apps/${selectedApp.packageName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.message || "Failed to delete app");

      toast.success("App deleted completely!", { id: toastId });
      setSelectedApp(null);
      fetchApps();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Error deleting app", { id: toastId });
    } finally {
      setIsDeletingApp(false);
    }
  };

  // --- SUB COMPONENTS ---

  const renderOverview = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface-dark p-6 rounded-2xl shadow-xl border border-gray-100/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
          <h3 className="text-text-muted text-sm font-medium mb-2 relative z-10">
            Total Apps
          </h3>
          <p className="text-4xl font-bold text-text relative z-10">
            {stats.totalApps}
          </p>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl shadow-xl border border-gray-100/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
          <h3 className="text-text-muted text-sm font-medium mb-2 relative z-10">
            Total Downloads
          </h3>
          <p className="text-4xl font-bold text-text relative z-10">
            {stats.totalDownloads > 1000
              ? (stats.totalDownloads / 1000).toFixed(1) + "K"
              : stats.totalDownloads}
          </p>
        </div>
        <div className="bg-surface-dark p-6 rounded-2xl shadow-xl border border-gray-100/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all"></div>
          <h3 className="text-text-muted text-sm font-medium mb-2 relative z-10">
            Pending Reviews
          </h3>
          <p className="text-4xl font-bold text-text relative z-10">
            {stats.pendingReviews}
          </p>
        </div>
      </div>

      <div className="bg-surface-dark rounded-3xl p-8 border border-gray-100/5 shadow-xl text-center py-16">
        <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text mb-2">
          More Analytics Coming Soon
        </h3>
        <p className="text-text-muted max-w-sm mx-auto">
          Detailed charts and geographic data will be displayed here in a future
          update.
        </p>
      </div>
    </div>
  );

  const renderAppList = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search published apps..."
            className="w-full bg-surface-dark border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => setIsPublishingNew(true)}
          className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-primary/30 w-full sm:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" />
          Publish New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            No apps published yet.
          </div>
        ) : (
          apps.map((app) => (
            <div
              key={app._id || app.id}
              onClick={() => handleSelectApp(app)}
              className="bg-surface-dark rounded-2xl p-5 border border-gray-100/5 shadow-lg hover:shadow-xl hover:border-gray-700/50 transition-all cursor-pointer group relative"
            >
              {/* Downloads disabled badge */}
              {app.downloadEnabled === false && (
                <span className="absolute top-3 right-3 bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Downloads Off
                </span>
              )}
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-tr from-primary/80 to-accent/80 rounded-xl shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden ${app.downloadEnabled === false ? "opacity-50 grayscale" : ""}`}
                >
                  {app.iconUrl ? (
                    <img
                      src={app.iconUrl}
                      alt="icon"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <LayoutGrid className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-text truncate group-hover:text-primary transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-sm text-text-muted truncate mb-2">
                    {app.developer}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />{" "}
                      {app.rating || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> {app.downloads || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPublishNew = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => setIsPublishingNew(false)}
        className="mb-6 p-2 rounded-full hover:bg-surface-dark transition-colors flex items-center gap-2 text-text-muted hover:text-text w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Apps
      </button>

      <div className="bg-surface-dark p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100/5 mb-10">
        <h2 className="text-2xl font-bold text-text mb-8">Publish New App</h2>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                App Name
              </label>
              <input
                type="text"
                placeholder="e.g., Chatly App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                Package Name
              </label>
              <input
                type="text"
                placeholder="e.g., com.chatly.app"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                Developer Name
              </label>
              <input
                type="text"
                placeholder="e.g., Amani Kibet"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                App Size
              </label>
              <input
                type="text"
                placeholder="e.g., 24 MB"
                value={appSize}
                onChange={(e) => setAppSize(e.target.value)}
                className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe the app's features and functionality..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                App Icon (Image)
              </label>
              <div
                onClick={() => iconInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-background-darker/50"
              >
                <Upload className="w-6 h-6 mb-2" />
                <p className="text-xs font-medium">
                  {iconFile ? iconFile.name : "Upload Icon (PNG/JPG)"}
                </p>
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                ref={iconInputRef}
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                App Package (APK)
              </label>
              <div
                onClick={() => apkInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-background-darker/50"
              >
                <Upload className="w-6 h-6 mb-2" />
                <p className="text-xs font-medium">
                  {apkFile ? apkFile.name : "Upload APK File"}
                </p>
              </div>
              <input
                type="file"
                accept=".apk"
                className="hidden"
                ref={apkInputRef}
                onChange={(e) => setApkFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">
              Preview Screenshots
            </label>
            <div
              onClick={() => screenshotsInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-background-darker/50"
            >
              <Upload className="w-8 h-8 mb-3" />
              <p className="text-sm font-medium">
                {screenshotFiles && screenshotFiles.length > 0
                  ? `${screenshotFiles.length} files selected`
                  : "Select Preview Images"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Upload multiple screenshots (PNG/JPG)
              </p>
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              multiple
              className="hidden"
              ref={screenshotsInputRef}
              onChange={(e) => setScreenshotFiles(e.target.files)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-end gap-3 pt-4">
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-primary/30"
            >
              {isPublishing ? "Publishing..." : "Publish App"}
            </button>
            {isPublishing && (
              <div className="w-full sm:w-72 rounded-xl border border-primary/20 bg-primary/10 p-3">
                <div className="flex items-center justify-between text-sm text-text-muted mb-2">
                  <span>{uploadStatus || "Uploading files..."}</span>
                  <span className="font-semibold text-primary">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-background-darker">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  const renderAppManagement = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => setSelectedApp(null)}
        className="mb-6 p-2 rounded-full hover:bg-surface-dark transition-colors flex items-center gap-2 text-text-muted hover:text-text w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Apps
      </button>

      {/* App Header */}
      <div className="bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5 mb-8 flex items-center gap-5">
        <div className="w-20 h-20 bg-gradient-to-tr from-primary/80 to-accent/80 rounded-2xl shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
          {selectedApp?.iconUrl ? (
            <img
              src={selectedApp.iconUrl}
              alt="App Icon"
              className="w-full h-full object-cover"
            />
          ) : (
            <LayoutGrid className="w-10 h-10 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-text">{selectedApp?.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-text-muted">{selectedApp?.developer}</p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/app/${selectedApp?.packageName}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                toast.success("App link copied!");
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex items-center gap-1.5 px-2 py-1 bg-surface-dark border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-text rounded-md transition-all text-xs cursor-pointer"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-sm mb-3">
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md font-semibold">
              Published
            </span>
            <span className="text-gray-400">
              {selectedApp?.downloads} Downloads
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Release Update Section */}
        <div className="space-y-8">
          <div className="bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" /> Release Update
              </h3>
              <div className="flex items-center gap-2">
                {/* Download Enable/Disable Toggle */}
                <button
                  onClick={handleToggleDownload}
                  disabled={isTogglingDownload}
                  title={
                    selectedApp?.downloadEnabled !== false
                      ? "Disable downloads"
                      : "Enable downloads"
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all disabled:opacity-50 ${
                    selectedApp?.downloadEnabled !== false
                      ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                      : "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {selectedApp?.downloadEnabled !== false ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {isTogglingDownload
                    ? "Updating..."
                    : selectedApp?.downloadEnabled !== false
                      ? "Downloads On"
                      : "Downloads Off"}
                </button>
                <button
                  onClick={handleDeleteApp}
                  disabled={isDeletingApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingApp ? "Deleting..." : "Delete App"}
                </button>
              </div>
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Version & Release Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">
                    Version Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2.1.0"
                    value={updateVersion}
                    onChange={(e) => setUpdateVersion(e.target.value)}
                    className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">
                    Updated APK <span className="text-red-400">*</span>
                  </label>
                  <div
                    onClick={() => updateApkInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-600 rounded-lg px-4 py-2.5 flex items-center gap-2 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {updateApkFile ? updateApkFile.name : "Select APK file"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".apk"
                    className="hidden"
                    ref={updateApkInputRef}
                    onChange={(e) =>
                      setUpdateApkFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">
                  Release Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="What's new in this update?"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              {/* Optional metadata updates */}
              <div className="border-t border-gray-700/50 pt-4">
                <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">
                  Optional — Update App Info
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-muted mb-1 block">
                      Updated Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder={`Current: ${selectedApp?.description?.substring(0, 80) || "No description"}...`}
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      className="w-full bg-background-darker border border-gray-700 rounded-lg px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-muted mb-1 block">
                        New App Icon
                      </label>
                      <div
                        onClick={() => updateIconInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        {updateIconFile ? (
                          <img
                            src={URL.createObjectURL(updateIconFile)}
                            alt="preview"
                            className="w-16 h-16 object-cover rounded-xl mb-1"
                          />
                        ) : (
                          <Upload className="w-6 h-6 mb-2" />
                        )}
                        <p className="text-xs font-medium truncate max-w-full px-2">
                          {updateIconFile
                            ? updateIconFile.name
                            : "Upload New Icon"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        ref={updateIconInputRef}
                        onChange={(e) =>
                          setUpdateIconFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-muted mb-1 block">
                        New Screenshots
                      </label>
                      <div
                        onClick={() =>
                          updateScreenshotsInputRef.current?.click()
                        }
                        className="w-full border-2 border-dashed border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <Upload className="w-6 h-6 mb-2" />
                        <p className="text-xs font-medium">
                          {updateScreenshotFiles &&
                          updateScreenshotFiles.length > 0
                            ? `${updateScreenshotFiles.length} file(s) selected`
                            : "Upload Screenshots"}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Replaces all existing screenshots
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        multiple
                        className="hidden"
                        ref={updateScreenshotsInputRef}
                        onChange={(e) =>
                          setUpdateScreenshotFiles(e.target.files)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <button
                  onClick={handleReleaseUpdate}
                  disabled={isPublishing}
                  className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-md"
                >
                  {isPublishing ? "Publishing..." : "Publish Update"}
                </button>
                {isPublishing && (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                    <div className="flex items-center justify-between text-sm text-text-muted mb-2">
                      <span>{uploadStatus || "Uploading files..."}</span>
                      <span className="font-semibold text-primary">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background-darker">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Version History */}
        <div className="bg-surface-dark p-6 rounded-3xl shadow-xl border border-gray-100/5 h-fit">
          <h3 className="text-lg font-bold text-text flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-accent" /> Version History
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
            {selectedApp?.versions && selectedApp.versions.length > 0 ? (
              selectedApp.versions.map((ver: any, i: number) => (
                <div
                  key={i}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-surface-dark bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-gray-800 bg-background-darker shadow">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-text">
                        Version {ver.version || ver.versionName}
                      </h4>
                      <span className="text-xs text-text-muted">
                        {ver.date ||
                          new Date(ver.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {ver.notes || ver.releaseNotes}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">
                No version history available from database yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-text">Activity Logs</h3>
            <p className="text-text-muted mt-1">
              Track user interactions across the store
            </p>
          </div>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Eraser className="w-4 h-4" /> Clear Logs
          </button>
        </div>

        <div className="bg-surface-dark border border-gray-100/5 rounded-3xl overflow-hidden shadow-xl">
          {isFetchingLogs ? (
            <div className="p-12 text-center text-text-muted">
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              No activity logs found.
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-5 flex items-start gap-4 hover:bg-gray-800/20 transition-colors"
                >
                  <div className="mt-1 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-text font-medium">
                        {log.action === "entered_store" && (
                          <span>Entered the Storefront</span>
                        )}
                        {log.action === "view_app" && (
                          <span>
                            Viewed{" "}
                            <span className="text-primary">
                              {log.packageName}
                            </span>
                          </span>
                        )}
                        {log.action === "install_app" && (
                          <span>
                            Clicked Install on{" "}
                            <span className="text-primary">
                              {log.packageName}
                            </span>
                          </span>
                        )}
                        {log.action === "copy_link" && (
                          <span>
                            Copied link for{" "}
                            <span className="text-primary">
                              {log.packageName}
                            </span>
                          </span>
                        )}
                        {log.action === "submit_review" && (
                          <span>
                            Submitted a {log.metadata?.rating}-star review for{" "}
                            <span className="text-primary">
                              {log.packageName}
                            </span>
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      {log.metadata?.country && (
                        <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
                          <Globe2 className="w-3.5 h-3.5" />
                          {log.metadata.city ? `${log.metadata.city}, ` : ""}
                          {log.metadata.country}
                        </span>
                      )}
                      {log.metadata?.referrer &&
                        log.metadata.referrer !== "Direct" && (
                          <span className="bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
                            Ref: {log.metadata.referrer}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-text">Admin Dashboard</h2>

        {/* Tabs */}
        {!selectedApp && !isPublishingNew && (
          <div className="flex bg-surface-dark p-1 rounded-xl shadow-inner border border-gray-800 w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-white shadow"
                  : "text-text-muted hover:text-text hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("apps")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                activeTab === "apps"
                  ? "bg-primary text-white shadow"
                  : "text-text-muted hover:text-text hover:bg-gray-800"
              }`}
            >
              <AppWindow className="w-4 h-4" /> Published Apps
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-primary text-white shadow"
                  : "text-text-muted hover:text-text hover:bg-gray-800"
              }`}
            >
              <Activity className="w-4 h-4" /> Logs
            </button>
          </div>
        )}
      </div>

      {isPublishingNew
        ? renderPublishNew()
        : selectedApp
          ? renderAppManagement()
          : activeTab === "overview"
            ? renderOverview()
            : activeTab === "apps"
              ? renderAppList()
              : renderLogs()}
    </div>
  );
}
