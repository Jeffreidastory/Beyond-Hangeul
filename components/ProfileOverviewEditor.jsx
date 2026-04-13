"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Upload, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ProfileOverviewEditor({
  displayName,
  userEmail,
  role,
  uniqueUid,
  initials,
  initialMetadata,
  profileStats,
}) {
  const router = useRouter();
  const registrationAddress = [
    initialMetadata?.address_city,
    initialMetadata?.address_province,
    initialMetadata?.address_country,
  ]
    .filter(Boolean)
    .join(", ");

  const [about, setAbout] = useState(
    initialMetadata?.about ||
      "Welcome to your Beyond Hangeul profile. Add details here so other sections can reflect your latest goals."
  );
  const [address, setAddress] = useState(initialMetadata?.address || registrationAddress || "");
  const [number, setNumber] = useState(initialMetadata?.number || initialMetadata?.phone || "");
  const [age, setAge] = useState(initialMetadata?.age || "");
  const [avatarUrl, setAvatarUrl] = useState(initialMetadata?.avatar_url || "");
  const coverUrl = initialMetadata?.cover_url || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const { toggleTheme, fontSize, setFontSize, isLight } = useTheme();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const hasAvatar = useMemo(() => Boolean(avatarUrl?.trim()), [avatarUrl]);

  const learningBadge = role === "admin" ? "Admin Mentor" : "Active Learner";
  const modulesCompleted = Number(
    profileStats?.modulesCompleted ?? initialMetadata?.modules_completed ?? 0
  );
  const worksheetsFinished = Number(
    profileStats?.worksheetsFinished ?? initialMetadata?.worksheets_finished ?? 0
  );
  const currentPathStep =
    profileStats?.currentPathStep || initialMetadata?.current_path_step || "Step 1";
  const averageScore = Number(
    profileStats?.averageScore ?? initialMetadata?.average_score ?? 0
  );
  const studyStreak = Number(
    profileStats?.studyStreak ?? initialMetadata?.study_streak ?? 0
  );
  const goalsProgress = Number(initialMetadata?.goal_progress || 35);
  const goalTargetDate = initialMetadata?.goal_target_date || "Set target date";
  const enrolledModules = Array.isArray(initialMetadata?.enrolled_modules)
    ? initialMetadata.enrolled_modules
    : [];

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });

  const handleImageFile = async (file, type) => {
    if (!file || !file.type.startsWith("image/")) {
      setSaveMessage("Please select a valid image file.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setSaveMessage("Image is too large. Please use an image below 4MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      if (type === "avatar") {
        setAvatarUrl(dataUrl);
      }
      setSaveMessage("Image added. Click Save Changes to apply.");
    } catch {
      setSaveMessage("Could not read image file.");
    }
  };

  const handleFileInput = async (event, type) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageFile(file, type);
    }
    event.target.value = "";
  };

  const saveProfileMetadata = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          ...initialMetadata,
          about,
          address,
          number,
          age,
          avatar_url: avatarUrl,
        },
      });

      if (error) {
        setSaveMessage(error.message || "Could not save profile changes.");
      } else {
        setSaveMessage("Profile updated successfully.");
        setIsModalOpen(false);
        router.refresh();
      }
    } catch {
      setSaveMessage("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordMessage("");

    if (!password || !confirmPassword) {
      setPasswordMessage("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordMessage(error.message || "Could not update password.");
      } else {
        setPassword("");
        setConfirmPassword("");
        setPasswordMessage("Password updated successfully.");
      }
    } catch {
      setPasswordMessage("Something went wrong while changing password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className={`space-y-6 ${isLight ? "text-slate-900" : "text-slate-100"}`}>
      <section
        className={`overflow-hidden rounded-3xl border shadow-sm ${
          isLight ? "border-slate-200/90 bg-white shadow-slate-200/60" : "border-white/10 bg-[#0f1d32]"
        }`}
      >
        <div
          className={`relative h-44 bg-cover bg-center ${
            isLight
              ? "bg-[linear-gradient(135deg,#eaf1ff_0%,#f7f9ff_45%,#f3f7ff_100%)]"
              : "bg-[linear-gradient(120deg,#0d5da3_0%,#0b74c4_100%)]"
          }`}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? "border border-slate-300/90 bg-white/95 text-slate-700 shadow-sm hover:bg-slate-50"
                : "bg-[#0b1728]/80 text-[#fcd34d] hover:bg-[#0b1728]"
            }`}
          >
            <Pencil size={14} />
            Edit Profile
          </button>

          <div
            className={`absolute right-6 top-5 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
              isLight
                ? "border border-slate-300 bg-white/95 text-slate-700"
                : "bg-[#3d2f0f] text-[#fcd34d]"
            }`}
          >
            {role || "user"}
          </div>

          <div
            className={`absolute right-6 top-14 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isLight
                ? "border border-emerald-300/60 bg-emerald-50 text-emerald-700"
                : "border border-emerald-300/40 bg-emerald-500/20 text-emerald-200"
            }`}
          >
            {learningBadge}
          </div>

          <div
            className={`absolute left-8 top-24 h-28 w-28 rounded-full border-4 ${
              isLight ? "border-white bg-slate-100 shadow-lg shadow-slate-200/80" : "border-[#0f1d32] bg-[#13243d]"
            }`}
          >
            {hasAvatar ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fbbf24] text-3xl font-bold text-[#1f1400]">
                {initials}
              </div>
            )}
          </div>

          <h1
            className={`absolute bottom-5 left-40 right-6 text-2xl font-bold font-headline sm:text-3xl ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {displayName}
          </h1>

        </div>

        <div className={`space-y-3 pl-40 pr-6 pb-8 pt-5 ${isLight ? "bg-white" : ""}`}>
          <p className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-[#fcd34d]"}`}>UID: {uniqueUid}</p>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{userEmail}</p>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <h2 className="text-xl font-bold">Learning Profile Summary</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Modules Completed</p>
            <p className="mt-1 text-xl font-bold">{modulesCompleted}</p>
          </div>
          <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Current Path Step</p>
            <p className="mt-1 text-xl font-bold">{currentPathStep}</p>
          </div>
          <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Worksheets Finished</p>
            <p className="mt-1 text-xl font-bold">{worksheetsFinished}</p>
          </div>
          <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Average Score</p>
            <p className="mt-1 text-xl font-bold">{averageScore}%</p>
          </div>
          <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
            <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Study Streak</p>
            <p className="mt-1 text-xl font-bold">{studyStreak} days</p>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <div className={`inline-flex rounded-full p-1 text-sm ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
          {[
            { key: "about", label: "Bio" },
            { key: "info", label: "Info" },
            { key: "enrolled", label: "Enrolled" },
            { key: "goals", label: "Goals" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 transition ${
                activeTab === tab.key
                  ? "bg-[#fbbf24] font-semibold text-[#1f1400]"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-200"
                    : "text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "about" && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold">Bio</h2>
            <p className={`mt-3 text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              {about || "No about details yet."}
            </p>
          </div>
        )}

        {activeTab === "info" && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold">Info</h2>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
                <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Address</p>
                <p className={`mt-1 ${isLight ? "text-slate-800" : "text-slate-200"}`}>{address || "Not set"}</p>
              </div>
              <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
                <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Number</p>
                <p className={`mt-1 ${isLight ? "text-slate-800" : "text-slate-200"}`}>{number || "Not set"}</p>
              </div>
              <div className={`rounded-xl p-3 ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
                <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Age</p>
                <p className={`mt-1 ${isLight ? "text-slate-800" : "text-slate-200"}`}>{age || "Not set"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "enrolled" && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold">Enrolled</h2>
            {enrolledModules.length === 0 ? (
              <p className={`mt-3 rounded-xl border border-dashed p-3 text-sm ${isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-white/5 text-slate-300"}`}>
                No enrolled modules yet. Start learning by exploring free modules.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {enrolledModules.map((item, index) => (
                  <article key={`${item}-${index}`} className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`}>
                    <p className="font-semibold">{item}</p>
                    <p className={`mt-1 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>In progress</p>
                    <div className={`mt-2 h-2 overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                      <div className="h-full rounded-full bg-[#fbbf24]" style={{ width: `${Math.min(90, 35 + index * 15)}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "goals" && (
          <div className="mt-5">
            <h2 className="text-2xl font-bold">Goals</h2>
            <div className={`mt-3 rounded-xl border p-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`}>
              <p className="text-sm font-semibold">Current Goal</p>
              <p className={`mt-1 text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {initialMetadata?.goal_text || "Set your first learning goal."}
              </p>
              <p className={`mt-2 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>Target completion date: {goalTargetDate}</p>
              <div className={`mt-2 h-2 overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                <div className="h-full rounded-full bg-[#fbbf24]" style={{ width: `${Math.max(0, Math.min(100, goalsProgress))}%` }} />
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-3 rounded-lg border border-[#fbbf24]/40 bg-[#fbbf24]/15 px-3 py-1.5 text-xs font-semibold text-[#fbbf24] hover:bg-[#fbbf24]/25"
              >
                Edit Goal
              </button>
            </div>
          </div>
        )}

        {saveMessage && <p className={`mt-4 text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>{saveMessage}</p>}
      </section>

      <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className={`rounded-xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`}>
            <h3 className="text-lg font-semibold">Account Settings</h3>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Change password and account security details</p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                    : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                }`}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                    : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                }`}
              />
              <button
                type="button"
                onClick={changePassword}
                disabled={passwordSaving}
                className="rounded-lg bg-[#fbbf24] px-4 py-2 text-sm font-semibold text-[#1f1400] transition hover:bg-[#fcd34d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
              {passwordMessage && (
                <p className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>{passwordMessage}</p>
              )}
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`}>
            <h3 className="text-lg font-semibold">Preferences</h3>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Theme, reading size, and learning preferences</p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isLight ? "bg-slate-200 text-slate-800" : "bg-[#13243d] text-[#fcd34d]"
                  }`}
                >
                  {isLight ? "Light Mode" : "Dark Mode"}
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Reading mode</label>
                <select
                  defaultValue="guided"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                      : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                  }`}
                >
                  <option value="guided">Guided</option>
                  <option value="focus">Focus</option>
                  <option value="review">Review</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Font size</label>
                <select
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                      : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                  }`}
                >
                  <option value={90}>Small (90%)</option>
                  <option value={100}>Default (100%)</option>
                  <option value={110}>Large (110%)</option>
                  <option value={120}>Extra Large (120%)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Preferred study time</label>
                <select
                  defaultValue="evening"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                      : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                  }`}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Daily study target</label>
                <select
                  defaultValue="30"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-900 focus:border-[#fbbf24]"
                      : "border-white/15 bg-[#13243d] text-slate-100 focus:border-[#fbbf24]"
                  }`}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/30" />
                Enable learning reminders
              </label>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/15 p-2 text-slate-300 hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex flex-col items-center">
                  <div className="relative w-fit">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#fbbf24]/40 bg-[#13243d]">
                      {hasAvatar ? (
                        <img src={avatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#fbbf24] text-3xl font-bold text-[#1f1400]">
                          {initials}
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#13243d] text-slate-200 shadow-lg hover:bg-[#0b1728]"
                      title="Upload profile image"
                    >
                      <Upload size={14} />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileInput(event, "avatar")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-100">{displayName}</p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Bio</label>
                <textarea
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-white/15 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Address</label>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Number</label>
                <input
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Age</label>
                <input
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-[#fbbf24]"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfileMetadata}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#fbbf24] px-4 py-2 text-sm font-semibold text-[#1f1400] transition hover:bg-[#fcd34d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
