"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  CheckSquare,
  Compass,
  FileText,
  Flag,
  Home,
  Landmark,
  Lock,
  Library,
  Menu,
  Search,
  X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "@/types/dashboardModels";
import {
  ONE_TIME_PREMIUM_MODULE_ID,
  createResourceFile,
  createResourceNote,
  deleteResourceFile,
  deleteResourceNote,
  getUserLearningDataShared,
  getUserResourcesData,
  removeResourceBookmark,
  renameResourceFile,
  submitPaymentProofShared,
  syncUsers,
  toggleResourceBookmark,
  upsertModuleProgressShared,
  upsertWorksheetProgressShared,
  updateResourceNote,
} from "@/services/dashboardDataService";
import UserPathTimeline from "@/components/path/UserPathTimeline";
import HeroLearningCard from "@/components/user/dashboard/HeroLearningCard";
import LearningSummaryCards from "@/components/user/dashboard/LearningSummaryCards";
import RecentLearningActivityCard from "@/components/user/dashboard/RecentLearningActivityCard";
import RecommendedNextStepsCard from "@/components/user/dashboard/RecommendedNextStepsCard";
import LearningUpdatesCard from "@/components/user/dashboard/LearningUpdatesCard";
import UserPaymentSection from "@/components/user/dashboard/UserPaymentSection";
import HomeBannerCarousel from "@/components/user/dashboard/HomeBannerCarousel";
import { useTheme } from "@/components/theme/ThemeProvider";
import UserResourcesHub from "@/components/user/resources/UserResourcesHub";
import WorksheetPracticePanel from "@/components/user/worksheets/WorksheetPracticePanel";
import useGlobalSearch from "@/hooks/useGlobalSearch";
import { subscribeToTables } from "@/services/realtime/subscribeTables";
import bhSlide from "@/app/images/BH-slide.png";
import bhSlide1 from "@/app/images/BH-slide1.png";
import bhSlide2 from "@/app/images/BH-slide2.png";
import bhSlide3 from "@/app/images/BH-slide3.png";

const menuItems = [
  { key: "home", label: "Home", href: "/dashboard?tab=home", icon: Home },
  { key: "modules", label: "Modules", href: "/dashboard?tab=modules", icon: BookOpen },
  { key: "worksheets", label: "Worksheets", href: "/dashboard?tab=worksheets", icon: CheckSquare },
  { key: "path", label: "Path", href: "/dashboard?tab=path", icon: Compass },
  { key: "goal", label: "Goal", href: "/dashboard?tab=goal", icon: Flag },
  { key: "payment", label: "Payment", href: "/dashboard?tab=payment", icon: Landmark },
  { key: "resources", label: "Resources", href: "/dashboard?tab=resources", icon: Library },
];

function getMonthMatrix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return { now, cells };
}

export default function UserDashboardView({ userId, userName, userEmail, stats, recentActivity }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const { isLight } = useTheme();
  const [learningData, setLearningData] = useState({
    modules: [],
    pathItems: [],
    activeLearningPath: null,
    worksheets: [],
    payments: [],
  });
  const [resourcesData, setResourcesData] = useState({
    files: [],
    notes: [],
    bookmarks: [],
    references: [],
  });
  const [resourcesNotice, setResourcesNotice] = useState("");
  const [goalText, setGoalText] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [receiptImage, setReceiptImage] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [worksheetNotice, setWorksheetNotice] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedWorksheetId, setSelectedWorksheetId] = useState("");
  const [moduleProgress, setModuleProgress] = useState({});
  const [worksheetScores, setWorksheetScores] = useState({});
  const [calendarMatrix, setCalendarMatrix] = useState(null);
  const realtimeReloadTimerRef = useRef(null);

  const goalItems = useMemo(
    () => (goalText ? [{ title: "Current Goal", description: goalText }] : []),
    [goalText]
  );

  const {
    query,
    setQuery,
    results: searchResults,
    isOpen: isSearchOpen,
    setIsOpen: setIsSearchOpen,
    highlighted: searchHighlighted,
    setHighlighted: setSearchHighlighted,
    handleKeyDown: handleSearchKeyDown,
  } = useGlobalSearch({
    modules: learningData.modules,
    worksheets: learningData.worksheets,
    path: learningData.activeLearningPath,
    resources: resourcesData.files,
    goals: goalItems,
    announcements: [],
    payments: learningData.payments,
  });

  const handleSearchResultSelect = useCallback(
    (result) => {
      if (!result) return;
      setIsSearchOpen(false);
      setQuery("");
      switch (result.type) {
        case "Module":
          setSelectedModuleId(result.data.id);
          router.push("/dashboard?tab=modules");
          break;
        case "Worksheet":
          setSelectedWorksheetId(result.data.id);
          router.push(`/dashboard?tab=worksheets&worksheet=${result.data.id}`);
          break;
        case "Resource":
          if (result.data.fileUrl) {
            window.open(result.data.fileUrl, "_blank", "noopener,noreferrer");
          } else {
            router.push("/dashboard?tab=resources");
          }
          break;
        case "Path":
          router.push("/dashboard?tab=path");
          break;
        case "Goal":
          router.push("/dashboard?tab=goal");
          break;
        case "Announcement":
          router.push("/dashboard?tab=home");
          break;
        default:
          break;
      }
    },
    [router]
  );

  useEffect(() => {
    if (query.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [query, setIsSearchOpen]);

  useEffect(() => {
    setSearchHighlighted(0);
  }, [searchResults]);

  const highlightMatches = useCallback((text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-semibold text-amber-300">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  }, [query]);

  const loadDashboardData = useCallback(async () => {
    syncUsers([{ id: userId, email: userEmail }]);
    const nextLearningData = await getUserLearningDataShared(userId);
    setLearningData(nextLearningData);
    setModuleProgress(nextLearningData?.moduleProgress || {});
    setWorksheetScores(nextLearningData?.worksheetScores || {});
    setResourcesData(getUserResourcesData(userId));
    const savedGoal = window.localStorage.getItem(`bh-goal-${userId}`) || "";
    setGoalText(savedGoal);
  }, [userEmail, userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount((count) => Math.min(count + 1, 9));
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadDashboardData();
    const onStorage = () => {
      void loadDashboardData();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [loadDashboardData]);

  useEffect(() => {
    // Realtime sync for admin/user actions across modules, worksheets, path, payments, and access.
    const scheduleReload = () => {
      if (realtimeReloadTimerRef.current) {
        clearTimeout(realtimeReloadTimerRef.current);
      }
      realtimeReloadTimerRef.current = setTimeout(() => {
        realtimeReloadTimerRef.current = null;
        void loadDashboardData();
      }, 120);
    };

    const unsubscribe = subscribeToTables({
      tables: [
        "learning_modules",
        "learning_worksheets",
        "learning_paths",
        "learning_path_steps",
        "payment_records",
        "user_module_access",
        "worksheet_progress",
        "module_progress",
      ],
      channelName: `user-dashboard-${userId}`,
      onChange: scheduleReload,
    });

    return () => {
      if (realtimeReloadTimerRef.current) {
        clearTimeout(realtimeReloadTimerRef.current);
        realtimeReloadTimerRef.current = null;
      }
      unsubscribe();
    };
  }, [loadDashboardData, userId]);

  const refreshResourcesData = () => {
    setResourcesData(getUserResourcesData(userId));
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });

  const uploadResourceFile = async (file) => {
    if (!file) return { error: "No file selected." };

    try {
      const dataUrl = await fileToDataUrl(file);
      const result = createResourceFile({
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: dataUrl,
      });

      if (result?.error) {
        setResourcesNotice(result.error);
        return { error: result.error };
      }

      refreshResourcesData();
      setResourcesNotice("File uploaded to your personal resource locker.");
      return { error: null };
    } catch {
      setResourcesNotice("Unable to process selected file.");
      return { error: "Unable to process selected file." };
    }
  };

  const previewResourceFile = (file) => {
    if (!file?.fileUrl) return;
    window.open(file.fileUrl, "_blank", "noopener,noreferrer");
  };

  const downloadResourceFile = (file) => {
    if (!file?.fileUrl) return;
    const link = document.createElement("a");
    link.href = file.fileUrl;
    link.download = file.fileName || "resource-file";
    link.click();
  };

  const renameUserResourceFile = (file) => {
    const nextName = window.prompt("Rename file", file.fileName || "");
    if (!nextName || !nextName.trim()) return;
    renameResourceFile(file.id, userId, nextName.trim());
    refreshResourcesData();
    setResourcesNotice("File renamed.");
  };

  const deleteUserResourceFile = (file) => {
    const confirmed = window.confirm(`Delete ${file.fileName}?`);
    if (!confirmed) return;
    deleteResourceFile(file.id, userId);
    refreshResourcesData();
    setResourcesNotice("File deleted.");
  };

  const createUserResourceNote = (payload) => {
    createResourceNote({
      userId,
      title: payload.title,
      content: payload.content,
    });
    refreshResourcesData();
    setResourcesNotice("Note created.");
  };

  const updateUserResourceNote = (note, payload) => {
    updateResourceNote(note.id, userId, {
      title: payload.title,
      content: payload.content,
    });
    refreshResourcesData();
    setResourcesNotice("Note updated.");
  };

  const deleteUserResourceNote = (note) => {
    const confirmed = window.confirm(`Delete note \"${note.title}\"?`);
    if (!confirmed) return;
    deleteResourceNote(note.id, userId);
    refreshResourcesData();
    setResourcesNotice("Note deleted.");
  };

  const bookmarkedLookup = useMemo(() => {
    return new Set((resourcesData.bookmarks || []).map((bookmark) => `${bookmark.type}:${bookmark.itemId}`));
  }, [resourcesData.bookmarks]);

  const toggleBookmark = (type, itemId) => {
    const result = toggleResourceBookmark({
      userId,
      type,
      itemId,
    });

    refreshResourcesData();
    setResourcesNotice(result.bookmarked ? "Saved to Bookmarks." : "Removed from Bookmarks.");
  };

  const openBookmarkItem = (bookmark) => {
    if (bookmark.type === "module") {
      setSelectedModuleId(bookmark.itemId);
      router.push("/dashboard?tab=modules");
      return;
    }

    const targetWorksheet = learningData.worksheets.find((sheet) => sheet.id === bookmark.itemId);
    const hasApprovedPremium = learningData.payments.some((payment) => payment.status === PAYMENT_STATUS.APPROVED);
    const hasUnlockedPremiumModule = learningData.modules.some(
      (module) => module.type === "paid" && !module.isLocked
    );
    const hasPremiumWorksheetAccess = hasApprovedPremium || hasUnlockedPremiumModule;
    const isWorksheetLocked =
      targetWorksheet?.accessType === "paid" && !hasPremiumWorksheetAccess;

    if (isWorksheetLocked) {
      setWorksheetNotice("This worksheet is Premium. Unlock premium access first.");
      router.push(`/dashboard?tab=payment&module=${ONE_TIME_PREMIUM_MODULE_ID}`);
      return;
    }

    setSelectedWorksheetId(bookmark.itemId);
    router.push("/dashboard?tab=worksheets");
  };

  const removeUserBookmark = (bookmark) => {
    removeResourceBookmark(bookmark.id, userId);
    refreshResourcesData();
    setResourcesNotice("Bookmark removed.");
  };

  const allModules = useMemo(
    () =>
      [...learningData.modules].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      ),
    [learningData.modules]
  );
  const selectedModule = useMemo(
    () => allModules.find((module) => module.id === selectedModuleId) || null,
    [allModules, selectedModuleId]
  );
  const selectedWorksheet = useMemo(
    () => learningData.worksheets.find((worksheet) => worksheet.id === selectedWorksheetId) || null,
    [learningData.worksheets, selectedWorksheetId]
  );

  useEffect(() => {
    const requestedModuleId = searchParams.get("module") || "";
    if (activeTab !== "modules" || !requestedModuleId) return;
    setSelectedModuleId(requestedModuleId);
  }, [activeTab, searchParams]);

  useEffect(() => {
    const requestedWorksheetId = searchParams.get("worksheet") || "";
    if (activeTab !== "worksheets" || !requestedWorksheetId) return;
    setSelectedWorksheetId(requestedWorksheetId);
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (activeTab !== "worksheets") return;
    setSelectedWorksheetId("");
  }, [activeTab]);

  useEffect(() => {
    if (!selectedWorksheetId) return;
    const exists = learningData.worksheets.some((worksheet) => worksheet.id === selectedWorksheetId);
    if (!exists) setSelectedWorksheetId("");
  }, [learningData.worksheets, selectedWorksheetId]);

  const hasPendingPremiumPayment = useMemo(
    () => learningData.payments.some((payment) => payment.status === PAYMENT_STATUS.PENDING),
    [learningData.payments]
  );

  const hasPremiumWorksheetAccess = useMemo(() => {
    const hasApprovedPremium = learningData.payments.some((payment) => payment.status === PAYMENT_STATUS.APPROVED);
    const hasUnlockedPremiumModule = learningData.modules.some(
      (module) => module.type === "paid" && !module.isLocked
    );
    return hasApprovedPremium || hasUnlockedPremiumModule;
  }, [learningData.modules, learningData.payments]);

  const isWorksheetLocked = useCallback(
    (worksheet) => worksheet?.accessType === "paid" && !hasPremiumWorksheetAccess,
    [hasPremiumWorksheetAccess]
  );

  const activePath = learningData.activeLearningPath;
  const pathSteps = activePath?.steps || [];
  const completedPathSteps = useMemo(
    () => Math.min(stats.completedLessons || 0, pathSteps.length),
    [pathSteps.length, stats.completedLessons]
  );
  const currentStepIndex = pathSteps.length > 0 ? Math.min(completedPathSteps, pathSteps.length - 1) : 0;
  const currentStep = pathSteps[currentStepIndex] || null;
  const nextRecommendedStep = pathSteps[completedPathSteps] || currentStep;

  const moduleMap = useMemo(
    () => new Map(learningData.modules.map((module) => [module.id, module])),
    [learningData.modules]
  );
  const worksheetMap = useMemo(
    () => new Map(learningData.worksheets.map((sheet) => [sheet.id, sheet])),
    [learningData.worksheets]
  );

  const homeAverageScore = useMemo(() => {
    const values = Object.values(worksheetScores || {}).filter(
      (item) => item && typeof item.quizPercent === "number" && typeof item.writingPercent === "number"
    );

    if (!values.length) {
      return Number(stats.averageScore || 0);
    }

    const sum = values.reduce((acc, item) => acc + ((item.quizPercent + item.writingPercent) / 2), 0);
    return Math.round(sum / values.length);
  }, [stats.averageScore, worksheetScores]);

  const completedModulesCount = useMemo(() => {
    return learningData.modules.filter((module) => {
      const progress = moduleProgress[module.id];
      return Boolean(progress?.completed) || Number(progress?.progressPercent || 0) >= 100;
    }).length;
  }, [learningData.modules, moduleProgress]);

  const handleWorksheetScoreChange = useCallback((worksheetId, scorePayload) => {
    if (!worksheetId || !scorePayload) return;

    setWorksheetScores((prev) => {
      const current = prev[worksheetId] || {};
      const nextEntry = {
        quizPercent: Number(scorePayload.quizPercent || 0),
        writingPercent: Number(scorePayload.writingPercent || 0),
        quizComplete: Boolean(scorePayload.quizComplete),
      };

      const unchanged =
        Number(current.quizPercent || 0) === nextEntry.quizPercent &&
        Number(current.writingPercent || 0) === nextEntry.writingPercent &&
        Boolean(current.quizComplete) === nextEntry.quizComplete;

      if (unchanged) {
        return prev;
      }

      const next = {
        ...prev,
        [worksheetId]: nextEntry,
      };

      void upsertWorksheetProgressShared({
        userId,
        worksheetId,
        quizPercent: nextEntry.quizPercent,
        writingPercent: nextEntry.writingPercent,
        quizComplete: nextEntry.quizComplete,
      });

      return next;
    });
  }, [userId]);

  const handleOpenModuleResource = useCallback((module) => {
    if (!module?.resourceFileData) return;
    const isPdf = module.resourceFileType === "application/pdf" || /\.pdf$/i.test(module.resourceFileName || "");

    window.open(module.resourceFileData, "_blank", "noopener,noreferrer");

    if (!isPdf) return;

    setModuleProgress((prev) => {
      const current = prev[module.id] || {};
      if (Boolean(current.completed) && Number(current.progressPercent || 0) >= 100) {
        return prev;
      }

      const next = {
        ...prev,
        [module.id]: {
          progressPercent: 100,
          completed: true,
          updatedAt: new Date().toISOString(),
        },
      };

      void upsertModuleProgressShared({
        userId,
        moduleId: module.id,
        progressPercent: 100,
        completed: true,
      });

      return next;
    });
  }, [userId]);

  const summaryItems = useMemo(
    () => [
      {
        label: "Modules Completed",
        value: completedModulesCount,
        hint: `${Math.max(0, learningData.modules.length - completedModulesCount)} remaining`,
        icon: "📘",
      },
      {
        label: "Current Path Step",
        value: pathSteps.length > 0 ? `Step ${currentStepIndex + 1}` : "Not Set",
        hint: currentStep?.title || "Set your first active path",
        icon: "🧭",
      },
      {
        label: "Average Quiz / Worksheet Score",
        value: `${homeAverageScore}%`,
        hint: homeAverageScore >= 80 ? "Excellent pace" : "Keep practicing",
        icon: "🎯",
      },
      {
        label: "Study Streak",
        value: `${stats.completedLessons > 0 ? Math.min(14, stats.completedLessons + 1) : 0} days`,
        hint: "Consistency builds fluency",
        icon: "🔥",
      },
    ],
    [completedModulesCount, currentStep?.title, currentStepIndex, homeAverageScore, learningData.modules.length, pathSteps.length, stats.completedLessons]
  );

  const recommendedNextSteps = useMemo(
    () => [
      {
        id: "finish-current",
        label:
          nextRecommendedStep?.type === "worksheet"
            ? `Finish current worksheet: ${
                worksheetMap.get(
                  (Array.isArray(nextRecommendedStep.linkedWorksheetIds) && nextRecommendedStep.linkedWorksheetIds[0]) ||
                    (Array.isArray(nextRecommendedStep.linkedItemIds) && nextRecommendedStep.linkedItemIds[0]) ||
                    nextRecommendedStep.linkedItemId
                )?.title || nextRecommendedStep.title || "Worksheet"
              }`
            : "Finish current worksheet",
      },
      { id: "review-previous", label: "Review previous lesson notes" },
      { id: "take-quiz", label: "Take your weekly quiz" },
      {
        id: "open-next",
        label:
          nextRecommendedStep?.type === "module"
            ? `Open next module: ${
                moduleMap.get(
                  (Array.isArray(nextRecommendedStep.linkedModuleIds) && nextRecommendedStep.linkedModuleIds[0]) ||
                    (Array.isArray(nextRecommendedStep.linkedItemIds) && nextRecommendedStep.linkedItemIds[0]) ||
                    nextRecommendedStep.linkedItemId
                )?.moduleName || nextRecommendedStep.title || "Next Module"
              }`
            : "Open next module",
      },
    ],
    [moduleMap, nextRecommendedStep, worksheetMap]
  );

  const learningUpdates = useMemo(
    () => [
      { id: "update-1", label: "New pronunciation module released this week." },
      { id: "update-2", label: "Live Q&A starts Saturday at 6:00 PM." },
      { id: "update-3", label: "Worksheet deadline reminder: submit before Sunday." },
    ],
    []
  );

  const homeBannerSlides = useMemo(
    () => [
      {
        id: "welcome-banner",
        image: bhSlide,
        alt: "Beyond Hangeul banner one",
      },
      {
        id: "worksheet-update",
        image: bhSlide1,
        alt: "Beyond Hangeul banner two",
      },
      {
        id: "premium-access",
        image: bhSlide2,
        alt: "Beyond Hangeul banner three",
      },
      {
        id: "featured-banner-four",
        image: bhSlide3,
        alt: "Beyond Hangeul banner four",
      },
    ],
    []
  );

  const requestedPaymentModuleId = searchParams.get("module") || "";
  const premiumModules = useMemo(
    () => learningData.modules.filter((module) => module.type === "paid"),
    [learningData.modules]
  );
  const selectedPaymentModule = useMemo(() => {
    if (requestedPaymentModuleId) {
      return premiumModules.find((module) => module.id === requestedPaymentModuleId) || null;
    }
    return premiumModules.find((module) => module.isLocked) || premiumModules[0] || null;
  }, [premiumModules, requestedPaymentModuleId]);

  const latestPremiumPaymentRecord = useMemo(() => {
    return learningData.payments
      .filter(
        (payment) =>
          payment.moduleId === ONE_TIME_PREMIUM_MODULE_ID ||
          payment.moduleId === selectedPaymentModule?.id ||
          !payment.moduleId
      )
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())[0] || null;
  }, [learningData.payments, selectedPaymentModule?.id]);

  const paymentStatusLabel = latestPremiumPaymentRecord?.status || "not_submitted";

  const saveGoal = () => {
    window.localStorage.setItem(`bh-goal-${userId}`, goalText);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 1800);
  };

  const uploadReceipt = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("receipt read error"));
      reader.readAsDataURL(file);
    });
    setReceiptImage(dataUrl);
  };

  const submitPayment = async () => {
    if (paymentStatusLabel === "pending") {
      setPaymentNotice("Payment already submitted. Please wait for admin verification.");
      return;
    }

    if (paymentStatusLabel === "approved") {
      setPaymentNotice("Premium access already approved. New payment proof cannot be submitted unless admin resets your payment status.");
      return;
    }

    if (!receiptImage) {
      setPaymentNotice("Please upload payment proof first.");
      return;
    }

    const paymentResult = await submitPaymentProofShared({
      userId,
      userName,
      userEmail,
      moduleId: ONE_TIME_PREMIUM_MODULE_ID,
      amount: 150,
      method: paymentMethod,
      proofImage: receiptImage,
      receiptImage,
    });

    if (paymentResult?.blocked && paymentResult?.blockReason === "already-approved") {
      setPaymentNotice("Premium access already approved. New payment proof cannot be submitted unless admin resets your payment status.");
      setLearningData(await getUserLearningDataShared(userId));
      return;
    }

    if (paymentResult?.blocked && paymentResult?.blockReason === "pending-verification") {
      setPaymentNotice("Payment already submitted. Please wait for admin verification.");
      setLearningData(await getUserLearningDataShared(userId));
      return;
    }

    setLearningData(await getUserLearningDataShared(userId));
    setPaymentNotice("Payment submitted. Waiting for admin verification for one-time premium access.");
    setReceiptImage("");
  };

  useEffect(() => {
    setCalendarMatrix(getMonthMatrix());
  }, []);

  useEffect(() => {
    if (activeTab !== "payment") return;
    setPaymentNotice("");
    setReceiptImage("");
  }, [activeTab, requestedPaymentModuleId]);

  const renderMainSection = () => {
    if (activeTab === "modules") {
      return (
        <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
          <section className={`relative rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Modules</h2>
                <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Browse all modules here. Free and Premium badges are shown on each card.</p>
              </div>
              {/* General Unlock/Purchase button for all locked modules (top right, only if any locked) */}
              {allModules.some((module) => module.isLocked) && !hasPremiumWorksheetAccess && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentNotice("");
                    setReceiptImage("");
                    router.push(`/dashboard?tab=payment`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300 shadow-lg"
                  style={{ minWidth: 170 }}
                >
                  {hasPendingPremiumPayment ? "Pending Verification" : "Unlock / Purchase Premium"}
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allModules.map((module) => {
                const isPremium = module.type === "paid";
                const moduleScore = moduleProgress[module.id] || null;
                const moduleProgressPercent = moduleScore && moduleScore.completed
                  ? 100
                  : Math.max(0, Math.min(100, Number(moduleScore?.progressPercent || 0)));
                const isPdfResource = module.resourceFileType === "application/pdf" || /\.pdf$/i.test(module.resourceFileName || "");
                const truncatedFileName = (module.resourceFileName || "").length > 34
                  ? `${String(module.resourceFileName).slice(0, 31)}...`
                  : module.resourceFileName;

                return (
                  <article
                    key={module.id}
                    className={`relative flex h-full rounded-xl border p-4 transition ${
                      isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"
                    }`}
                  >


                    {/* Only show badge for premium/free, no locked badge for non-premium users */}

                    <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-1 pointer-events-auto">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isPremium
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                            : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {isPremium ? "Premium" : "Free"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmark("module", module.id)}
                        className={`mt-1 inline-flex min-w-max items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition pointer-events-auto ${
                          bookmarkedLookup.has(`module:${module.id}`)
                            ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                            : isLight
                              ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                              : "border-white/15 text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        {bookmarkedLookup.has(`module:${module.id}`) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                        Save
                      </button>
                    </div>




                    <div className={`relative z-10 flex w-full flex-col ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "opacity-60 pointer-events-none text-white" : ""}`}>
                      <h3 className={`pr-20 text-lg font-semibold ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "text-white" : ""}`}>{module.moduleName}</h3>
                      <p className={`mt-2 text-sm italic ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "text-white" : isLight ? "text-slate-600" : "text-slate-300"}`}>{module.topicTitle}</p>

                      <div className="mt-auto pt-4">

                        {module.isInactive ? (
                          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            This module is temporarily inactive.
                          </p>
                        ) : !module.isLocked ? (
                          <>
                            {module.resourceFileName && module.resourceFileData ? (
                              <div className="flex min-h-5 items-center gap-2">
                                {isPdfResource ? (
                                  moduleProgressPercent >= 100 ? (
                                    <CheckCircle2 size={16} className="text-emerald-400" aria-label="PDF completed" />
                                  ) : (
                                    <Circle size={16} className={isLight ? "text-slate-500" : "text-slate-300"} aria-label="PDF not completed" />
                                  )
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handleOpenModuleResource(module)}
                                  title={module.resourceFileName}
                                  className="max-w-full truncate text-left text-xs font-semibold text-emerald-300 underline decoration-emerald-400/60 underline-offset-2 hover:text-emerald-200"
                                >
                                  {truncatedFileName}
                                </button>
                              </div>
                            ) : module.resourceFileName ? (
                              <p className="min-h-5 truncate text-xs text-amber-300" title={module.resourceFileName}>
                                {truncatedFileName} (file unavailable)
                              </p>
                            ) : (
                              <div className="min-h-5" />
                            )}

                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className={isLight ? "text-slate-600" : "text-slate-300"}>Module Progress</span>
                                <span className="font-semibold">{moduleProgressPercent}%</span>
                              </div>
                              <div className={`h-2 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                                <div
                                  className="h-full rounded-full bg-emerald-400 transition-all"
                                  style={{ width: `${moduleProgressPercent}%` }}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="min-h-5" />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

            {/* Button now moved to container header above */}
            </div>

            {allModules.length === 0 ? (
              <div className={`mt-4 rounded-xl border p-4 text-sm ${isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/10 bg-[#0f1d32] text-slate-300"}`}>
                No modules available yet.
              </div>
            ) : null}
          </section>
        </main>
      );
    }

    if (activeTab === "path") {
      return (
        <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
          <UserPathTimeline
            path={learningData.activeLearningPath}
            modules={learningData.modules}
            worksheets={learningData.worksheets}
            moduleProgress={moduleProgress}
            worksheetScores={worksheetScores}
          />
        </main>
      );
    }

    if (activeTab === "worksheets") {
      return (
        <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
          <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
            <h2 className="text-xl font-bold">Worksheets</h2>
            {!selectedWorksheet ? (
              <>
                <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Select a worksheet card to start Writing and Quiz mode.
                </p>
                {worksheetNotice ? (
                  <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {worksheetNotice}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {learningData.worksheets.map((sheet) => {
                    const sheetScore = worksheetScores[sheet.id] || null;
                    const sheetLocked = isWorksheetLocked(sheet);
                    const progressPercent = sheetScore
                      ? Math.round((Number(sheetScore.quizPercent || 0) + Number(sheetScore.writingPercent || 0)) / 2)
                      : 0;
                    const hasStarted =
                      !!sheetScore &&
                      (Boolean(sheetScore.quizComplete) || progressPercent > 0);
                    const isWorksheetPerfect =
                      !!sheetScore &&
                      Number(sheetScore.quizPercent || 0) === 100 &&
                      Number(sheetScore.writingPercent || 0) === 100 &&
                      Boolean(sheetScore.quizComplete);

                    return (
                      <article
                        key={sheet.id}
                        className={`relative rounded-xl border p-4 ${
                          isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"
                        }`}
                      >
                        <span
                          className={`absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            sheet.accessType === "paid"
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                              : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {sheet.accessType === "paid" ? "Premium" : "Free"}
                        </span>

                        <h3 className="font-semibold">{sheet.title}</h3>
                        <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                          {sheet.entries?.length || 0} rows • Writing + Quiz
                        </p>
                        <p className={`mt-1 text-[11px] font-semibold ${sheetLocked ? "text-amber-300" : isLight ? "text-emerald-700" : "text-emerald-300"}`}>
                          {sheet.accessType === "paid" ? "Premium Worksheet" : "Free Worksheet"}
                        </p>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className={isLight ? "text-slate-600" : "text-slate-300"}>Progress</span>
                            <span className="font-semibold">{progressPercent}%</span>
                          </div>
                          <div className={`h-2 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                            />
                          </div>
                          <p className={`mt-1 text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                            {hasStarted ? "Saved from your worksheet practice" : "No worksheet progress yet"}
                          </p>
                        </div>

                        {isWorksheetPerfect ? (
                          <div className={`mt-3 inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/10 text-emerald-200"}`}>
                            Completed
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (sheetLocked) {
                                setWorksheetNotice("This worksheet is Premium. Unlock premium access first.");
                                setPaymentNotice("");
                                setReceiptImage("");
                                router.push(`/dashboard?tab=payment&module=${ONE_TIME_PREMIUM_MODULE_ID}`);
                                return;
                              }
                              setWorksheetNotice("");
                              setSelectedWorksheetId(sheet.id);
                            }}
                            className="mt-3 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
                          >
                            {sheetLocked ? "Unlock Premium" : hasStarted ? "Try Again" : "Open Worksheet"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>

                {learningData.worksheets.length === 0 ? <p className="mt-4 text-sm text-slate-400">No worksheets available yet.</p> : null}
              </>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorksheetId("");
                    router.push("/dashboard?tab=worksheets");
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    isLight ? "border-slate-300 bg-white text-slate-700" : "border-white/15 bg-[#0f1d32] text-slate-200"
                  }`}
                >
                  Back to Worksheets
                </button>
                {isWorksheetLocked(selectedWorksheet) ? (
                  <div className={`rounded-xl border p-4 text-sm ${isLight ? "border-amber-300 bg-amber-50 text-amber-800" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>
                    This worksheet requires premium access.
                  </div>
                ) : (
                  <WorksheetPracticePanel
                    key={selectedWorksheetId}
                    worksheet={selectedWorksheet}
                    isLight={isLight}
                    onScoreChange={handleWorksheetScoreChange}
                  />
                )}
              </div>
            )}
          </section>
        </main>
      );
    }

    if (activeTab === "goal") {
      return (
        <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
          <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
            <h2 className="text-xl font-bold">My Goal</h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Goal is user-only and editable by you.</p>
            <textarea
              value={goalText}
              onChange={(event) => setGoalText(event.target.value)}
              rows={6}
              placeholder="Write your weekly or monthly Korean learning goal..."
              className={`mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                isLight
                  ? "border-slate-300 bg-white text-slate-900 focus:border-amber-500"
                  : "border-white/15 bg-[#0f1d32] text-slate-100 focus:border-amber-400"
              }`}
            />
            <button
              type="button"
              onClick={saveGoal}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728] hover:bg-amber-300"
            >
              <FileText size={14} /> Save Goal
            </button>
            {goalSaved && <p className="mt-2 text-sm text-emerald-400">Goal saved.</p>}
          </section>
        </main>
      );
    }

    if (activeTab === "payment") {
      return (
        <UserPaymentSection
          selectedModule={selectedPaymentModule}
          paymentStatus={paymentStatusLabel}
          paymentMethod={paymentMethod}
          onChangeMethod={setPaymentMethod}
          receiptImage={receiptImage}
          onUploadProof={uploadReceipt}
          onSubmit={submitPayment}
          notice={paymentNotice}
          isLight={isLight}
        />
      );
    }

    if (activeTab === "resources") {
      return (
        <UserResourcesHub
          isLight={isLight}
          resources={resourcesData}
          notice={resourcesNotice}
          onUploadFile={uploadResourceFile}
          onPreviewFile={previewResourceFile}
          onDownloadFile={downloadResourceFile}
          onRenameFile={renameUserResourceFile}
          onDeleteFile={deleteUserResourceFile}
          onCreateNote={createUserResourceNote}
          onUpdateNote={updateUserResourceNote}
          onDeleteNote={deleteUserResourceNote}
          onOpenBookmark={openBookmarkItem}
          onRemoveBookmark={removeUserBookmark}
        />
      );
    }

    return (
      <main className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}>
        <HeroLearningCard userName={userName} isLight={isLight} />

        <HomeBannerCarousel slides={homeBannerSlides} isLight={isLight} />

        <LearningSummaryCards items={summaryItems} isLight={isLight} />

        <RecentLearningActivityCard activities={recentActivity} isLight={isLight} />
      </main>
    );
  };

  const now = calendarMatrix?.now || null;
  const cells = calendarMatrix?.cells || [];

  const initials = useMemo(() => {
    const source = (userName || userEmail || "User").trim();
    if (!source) return "U";

    const words = source.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [userEmail, userName]);

  const avatarColor = useMemo(() => {
    const palette = ["#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
    const seed = `${userName || ""}${userEmail || ""}`;
    const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  }, [userEmail, userName]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navHeightClass = "top-[73px] h-[calc(100vh-73px)]";

  return (
    <section className={`min-h-screen w-full ${isLight ? "bg-[#eef3ff] text-slate-900" : "bg-[#07111f] text-slate-100"}`}>
      <header className={`sticky top-0 z-20 border-b px-4 py-3 backdrop-blur sm:px-6 lg:px-8 ${isLight ? "border-slate-200 bg-white/95" : "border-white/10 bg-[#0b1728]/95"}`}>
        <div className="flex w-full items-center gap-3">
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className={`rounded-lg border p-2 lg:hidden ${isLight ? "border-slate-300 text-slate-700" : "border-white/20 text-slate-200"}`}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="min-w-55 text-lg font-bold [font-family:var(--font-body)]">
            <span className={isLight ? "text-slate-900" : "text-white"}>Beyond </span>
            <span className="text-amber-400">Hangeul</span>
          </div>
          </div>

          <div className={`mx-2 hidden w-full flex-1 rounded-full border px-4 py-2 md:flex xl:mx-6 ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5"} relative`}>
            <Search size={16} className={isLight ? "text-slate-500" : "text-slate-400"} />
            <input
              type="text"
              placeholder="Search modules, worksheets, resources..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => { if (query.trim()) setIsSearchOpen(true); }}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
              onKeyDown={(event) => handleSearchKeyDown(event, (item) => handleSearchResultSelect(item))}
              className={`ml-2 w-full bg-transparent text-sm outline-none ${isLight ? "text-slate-800 placeholder:text-slate-500" : "text-white placeholder:text-slate-400"}`}
            />

            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-slate-300">
                    <p>No results found</p>
                    <p className="mt-1 text-xs text-slate-500">Try another keyword</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.title}-${index}`}
                        type="button"
                        onMouseDown={() => handleSearchResultSelect(result)}
                        onMouseEnter={() => setSearchHighlighted(index)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                          index === searchHighlighted ? "bg-slate-800" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="mt-0.5 text-lg">{result.icon}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {highlightMatches(result.title, query)}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {result.type}{result.subtitle ? " • " : ""}
                            {result.subtitle ? highlightMatches(result.subtitle, query) : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button type="button" className={`relative rounded-full border p-2 ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5"}`}>
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0b1728]">
                  {notificationCount}
                </span>
              )}
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{userName}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{userEmail}</p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className={`rounded-full border p-1 ${isLight ? "border-slate-300 bg-slate-100" : "border-white/20 bg-white/10"}`}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                  aria-label="User avatar"
                >
                  {initials}
                </div>
              </button>

              {dropdownOpen && (
                <div className={`absolute right-0 z-30 mt-2 w-40 rounded-xl border p-2 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
                  <Link href="/profile" className={`block rounded-lg px-3 py-2 text-sm ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}>
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid w-full grid-cols-1 gap-6 py-6 pl-0 pr-4 sm:pr-6 lg:grid-cols-[260px_1fr_320px] lg:pr-8">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100"
          } fixed left-0 z-30 w-65 border-r p-4 transition ${navHeightClass} ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0b1728]"} lg:sticky lg:self-start lg:rounded-r-2xl lg:border ${isLight ? "lg:border-slate-200 lg:bg-white" : "lg:border-white/10 lg:bg-[#0f1d32]"} lg:top-22.25 lg:h-[calc(100vh-7rem)]`}
        >
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              const navItemClass = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? isLight
                    ? "bg-amber-100 text-amber-800"
                    : "bg-amber-400/20 text-amber-300"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-slate-300 hover:bg-white/10"
              }`;

              return (
                <div key={item.key} className="relative">
                  <Link href={item.href} className={navItemClass}>
                    <Icon size={16} />
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </nav>
        </aside>

        {renderMainSection()}

        <aside className="space-y-4">
          <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-300" />
              <h3 className="font-semibold" suppressHydrationWarning>
                {now ? `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}` : "Calendar"}
              </h3>
            </div>
            <div className={`grid grid-cols-7 gap-1 text-center text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span key={`${day}-${idx}`} className={`py-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {day}
                </span>
              ))}
              {cells.map((day, idx) => (
                <span
                  key={`${day || "x"}-${idx}`}
                  className={`rounded py-1 ${now && day === now.getDate() ? "bg-amber-400 text-[#0b1728] font-bold" : ""}`}
                >
                  {day || ""}
                </span>
              ))}
              {!cells.length ? (
                <span className={`col-span-7 py-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Loading calendar...</span>
              ) : null}
            </div>
          </section>

          <RecommendedNextStepsCard items={recommendedNextSteps} isLight={isLight} />

          <LearningUpdatesCard updates={learningUpdates} isLight={isLight} />
        </aside>
      </div>


    </section>
  );
}
