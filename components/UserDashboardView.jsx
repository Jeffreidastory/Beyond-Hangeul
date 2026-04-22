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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Compass,
  FileText,
  Flag,
  Home,
  Landmark,
  Lock,
  Library,
  Menu,
  Moon,
  Search,
  Sun,
  X,
  ChevronUp,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { PAYMENT_STATUS } from "@/types/dashboardModels";
import {
  createResourceFile,
  createResourceNote,
  deleteResourceFile,
  deleteResourceNote,
  getUserLearningDataShared,
  getUserResourcesData,
  listModuleFileProgressShared,
  renameResourceFile,
  syncUsers,
  submitPaymentProofShared,
  toggleResourceBookmark,
  upsertModuleFileProgressShared,
  upsertModuleProgressShared,
  upsertWorksheetProgressShared,
  updateResourceNote,
  listNotificationsShared,
  markAllNotificationsReadShared,
  listPaymentSettingsShared,
  migrateLocalPaymentSettingsToRemote,
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
import { useRealtimeTables } from "@/services/realtime/useRealtimeTables";
import bhSlide from "@/app/images/BH-slide.png";
import bhSlide1 from "@/app/images/BH-slide1.png";
import bhSlide2 from "@/app/images/BH-slide2.png";
import bhSlide3 from "@/app/images/BH-slide3.png";

const menuItems = [
  { key: "home", label: "Home", href: "/dashboard?tab=home", icon: Home },
  {
    key: "modules",
    label: "Modules",
    href: "/dashboard?tab=modules",
    icon: BookOpen,
  },
  {
    key: "worksheets",
    label: "Worksheets",
    href: "/dashboard?tab=worksheets",
    icon: CheckSquare,
  },
  { key: "path", label: "Path", href: "/dashboard?tab=path", icon: Compass },
  { key: "goal", label: "Goal", href: "/dashboard?tab=goal", icon: Flag },
  {
    key: "payment",
    label: "Payment",
    href: "/dashboard?tab=payment",
    icon: Landmark,
  },
  {
    key: "resources",
    label: "Resources",
    href: "/dashboard?tab=resources",
    icon: Library,
  },
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

function formatRelativeTime(createdAt) {
  const createdDate = new Date(createdAt);
  const diffMs = Date.now() - createdDate.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function UserDashboardView({
  userId,
  userName,
  userEmail,
  stats,
  recentActivity,
  initialLearningData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "home",
  );
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [moduleFileProgress, setModuleFileProgress] = useState({});

  const setTab = useCallback((tabKey) => {
    setActiveTab(tabKey);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabKey);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);
  const { isLight, toggleTheme } = useTheme();
  const isWorksheetsTab = activeTab === "worksheets";
  const isSidebarCollapsed = !isSidebarHovered;
  const [learningData, setLearningData] = useState(
    initialLearningData || {
      modules: [],
      pathItems: [],
      activeLearningPath: null,
      worksheets: [],
      payments: [],
      containers: [],
    },
  );
  const [resourcesData, setResourcesData] = useState({
    files: [],
    notes: [],
    bookmarks: [],
    references: [],
  });
  const [resourcesNotice, setResourcesNotice] = useState("");
  const [goalText, setGoalText] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("lifetime");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [isSubmittingPaymentProof, setIsSubmittingPaymentProof] = useState(false);
  const [worksheetNotice, setWorksheetNotice] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedWorksheetId, setSelectedWorksheetId] = useState("");
  const [worksheetMode, setWorksheetMode] = useState("writing");
  const [moduleProgress, setModuleProgress] = useState(
    initialLearningData?.moduleProgress || {},
  );
  const [worksheetScores, setWorksheetScores] = useState(
    initialLearningData?.worksheetScores || {},
  );
  const [openModulePreviews, setOpenModulePreviews] = useState({});
  const [expandedModuleTopics, setExpandedModuleTopics] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [modulePreviewUrls, setModulePreviewUrls] = useState({});
  const [modulePreviewLoading, setModulePreviewLoading] = useState({});
  const [calendarMatrix, setCalendarMatrix] = useState(null);
  const realtimeReloadTimerRef = useRef(null);

  const goalItems = useMemo(
    () => (goalText ? [{ title: "Current Goal", description: goalText }] : []),
    [goalText],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const getModuleFileIdentifier = (moduleId, index = 0) => {
    return `${moduleId}:section-${index}`;
  };

  const handleToggleNotifications = async () => {
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);
    if (willOpen) {
      await loadNotifications(true);
      setNotifications((prevNotifications) => prevNotifications.map((item) => ({ ...item, isRead: true })));
      void markAllNotificationsReadShared(userId);
    }
  };

  const handleToggleAccountDrawer = async () => {
    const willOpen = !accountDrawerOpen;
    setAccountDrawerOpen(willOpen);
    if (willOpen) {
      await loadNotifications(true);
      setNotifications((prevNotifications) => prevNotifications.map((item) => ({ ...item, isRead: true })));
      void markAllNotificationsReadShared(userId);
      setNotificationsOpen(false);
    }
  };

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
          setTab("modules");
          break;
        case "Worksheet":
          setSelectedWorksheetId(result.data.id);
          setTab("worksheets");
          break;
        case "Resource":
          if (result.data.fileUrl) {
            window.open(result.data.fileUrl, "_blank", "noopener,noreferrer");
          } else {
            setTab("resources");
          }
          break;
        case "Path":
          setTab("path");
          break;
        case "Goal":
          setTab("goal");
          break;
        case "Announcement":
          setTab("home");
          break;
        default:
          break;
      }
    },
    [setTab, setIsSearchOpen, setQuery],
  );

  useEffect(() => {
    if (query.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [query, setIsSearchOpen]);

  const searchResultsLength = searchResults?.length ?? 0;

  useEffect(() => {
    setSearchHighlighted(0);
  }, [searchResultsLength, setSearchHighlighted]);

  const highlightMatches = useCallback(
    (text, query) => {
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
        ),
      );
    },
    [],
  );

  const isActiveSubscription = useCallback((subscription) => {
    if (!subscription) return false;
    const status = subscription.status;
    const isActiveOrApproved = status === "active" || status === PAYMENT_STATUS.APPROVED;
    if (!isActiveOrApproved) return false;
    if (!subscription.expiryDate) return true;
    return new Date(subscription.expiryDate) > new Date();
  }, []);

  const renderModuleTopic = useCallback(
    (topicTitle, moduleId) => {
      if (!topicTitle) return null;
      const lines = String(topicTitle)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) return null;

      const isExpanded = Boolean(expandedModuleTopics[moduleId]);
      const visibleLines = isExpanded ? lines : lines.slice(0, 2);
      const hasMoreLines = lines.length > 2;

      const renderLines = (items) => (
        <div className="space-y-1 text-sm leading-5 italic">
          {items.map((line, index) => {
            const cleanedLine = line
              .replace(/^\u2022\s*/u, "")
              .replace(/^[-*]\s*/u, "");
            return (
              <div
                key={index}
                className={`flex min-w-0 items-start gap-2 ${isLight ? "text-slate-900" : "text-slate-300"}`}
              >
                <span className="mt-0.5 shrink-0 text-xs text-amber-300">•</span>
                <span className="min-w-0 wrap-break-word whitespace-pre-wrap">{cleanedLine}</span>
              </div>
            );
          })}
        </div>
      );

      return (
        <div className="mt-1">
          <div className="hidden lg:block">{renderLines(lines)}</div>
          <div className="block lg:hidden">
            {renderLines(visibleLines)}
            {hasMoreLines ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedModuleTopics((prev) => ({
                    ...prev,
                    [moduleId]: !prev[moduleId],
                  }))
                }
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-amber-300 focus:outline-none"
              >
                {isExpanded ? "Show less topics" : `View all ${lines.length} topics`}
              </button>
            ) : null}
          </div>
        </div>
      );
    },
    [expandedModuleTopics, isLight],
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset;
      const nextVisible = currentY > 300 && activeTab === "modules";
      setShowScrollTop(nextVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);

  const refreshLearningData = useCallback(async () => {
    syncUsers([{ id: userId, email: userEmail }]);

    try {
      const nextLearningData = await getUserLearningDataShared(userId);
      if (!nextLearningData) return null;

      setLearningData(nextLearningData);
      setModuleProgress(nextLearningData?.moduleProgress || {});
      setWorksheetScores(nextLearningData?.worksheetScores || {});
      setResourcesData(getUserResourcesData(userId));
      const savedGoal = window.localStorage.getItem(`bh-goal-${userId}`) || "";
      setGoalText(savedGoal);
      return nextLearningData;
    } catch (error) {
      console.warn("Unable to refresh shared dashboard data:", error);
      return null;
    }
  }, [userEmail, userId]);

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setNotificationsLoading(true);
    }
    try {
      const nextNotifications = await listNotificationsShared(userId);
      setNotifications(nextNotifications);
    } catch (error) {
      console.warn("Unable to load notifications:", error);
    } finally {
      if (showLoading) {
        setNotificationsLoading(false);
      }
    }
  }, [userId]);

  const loadModuleFileProgress = useCallback(async () => {
    try {
      const rows = await listModuleFileProgressShared(userId);
      const progressMap = rows.reduce((acc, row) => {
        const moduleProgress = acc[row.moduleId] || {};
        moduleProgress[row.fileIdentifier] = {
          isOpened: row.isOpened,
          openedAt: row.openedAt,
        };
        acc[row.moduleId] = moduleProgress;
        return acc;
      }, {});
      setModuleFileProgress(progressMap);
    } catch (error) {
      console.warn("Unable to load module file progress:", error);
      setModuleFileProgress({});
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setResourcesData(getUserResourcesData(userId));
      setGoalText(window.localStorage.getItem(`bh-goal-${userId}`) || "");
    }
  }, [userId]);

  const loadPaymentStoreState = useCallback(async () => {
    try {
      const settings = await listPaymentSettingsShared();
      const plans = settings.plans || [];
      const methods = settings.methods || [];
      setPaymentPlans(plans);
      setPaymentMethods(methods);
      setSelectedPlanId((current) => current || plans[0]?.id || "lifetime");
      setPaymentMethod((current) =>
        current || methods.find((method) => method.id === "gcash")?.id || methods[0]?.id || "gcash"
      );
    } catch (error) {
      console.warn("Unable to load payment settings:", error);
      setPaymentPlans([]);
      setPaymentMethods([]);
      setSelectedPlanId((current) => current || "lifetime");
      setPaymentMethod((current) => current || "gcash");
    }

    const activeRequests = initialLearningData?.payments || [];
    setPaymentRequests(activeRequests);

    const latestApprovedPayment = (activeRequests || [])
      .filter((request) => request.status === PAYMENT_STATUS.APPROVED)
      .sort(
        (left, right) =>
          new Date(right.approvedAt || right.submittedAt || 0).getTime() -
          new Date(left.approvedAt || left.submittedAt || 0).getTime(),
      )[0] || null;

    if (latestApprovedPayment) {
      setSubscription({
        status: PAYMENT_STATUS.APPROVED,
        planId: "lifetime",
        planLabel: "Lifetime Access",
        amount: Number(latestApprovedPayment.amount || 0),
        reference: latestApprovedPayment.id,
        submittedAt: latestApprovedPayment.submittedAt || null,
        approvedAt: latestApprovedPayment.approvedAt || null,
      });
    } else {
      setSubscription(null);
    }
  }, [initialLearningData?.payments]);

  const loadDashboardData = useCallback(async () => {
    await refreshLearningData();
  }, [refreshLearningData]);

  const loadRemotePaymentState = useCallback(async () => {
    if (!userId) return;

    try {
      const userLearningData = await getUserLearningDataShared(userId);
      const remotePayments = userLearningData.payments || [];
      setPaymentRequests(remotePayments);

      const latestApprovedPayment = remotePayments
        .filter((request) => request.status === PAYMENT_STATUS.APPROVED)
        .sort(
          (left, right) =>
            new Date(right.approvedAt || right.submittedAt || 0).getTime() -
            new Date(left.approvedAt || left.submittedAt || 0).getTime(),
        )[0] || null;

      if (latestApprovedPayment) {
        setSubscription({
          status: PAYMENT_STATUS.APPROVED,
          planId: "lifetime",
          planLabel: "Lifetime Access",
          amount: Number(latestApprovedPayment.amount || 0),
          reference: latestApprovedPayment.id,
          submittedAt: latestApprovedPayment.submittedAt || null,
          approvedAt: latestApprovedPayment.approvedAt || null,
        });
      }
    } catch (error) {
      console.warn("Unable to load remote payment state:", error);
    }
  }, [userId]);

  useEffect(() => {
    const startup = async () => {
      if (userId) {
        try {
          await migrateLocalPaymentSettingsToRemote();
        } catch (error) {
          console.warn("Unable to migrate local payment settings:", error);
        }
      }

      await loadPaymentStoreState();
      void loadRemotePaymentState();
      void loadDashboardData();
      void loadNotifications();
      void loadModuleFileProgress();
    };

    void startup();
  }, [userId, loadDashboardData, loadNotifications, loadModuleFileProgress, loadPaymentStoreState, loadRemotePaymentState]);


  const handleRealtimeEvent = useCallback(
    (payload) => {
      if (!payload || !payload.table || !payload.eventType) return;
      const table = payload.table;
      const eventType = payload.eventType;
      const record = payload.record || payload.new || {};

      if (table === "payment_records" && record.user_id === userId) {
        const normalized = {
          id: record.id,
          userId: record.user_id,
          userEmail: record.user_email || "",
          userName: record.user_name || "Learner",
          moduleId: record.module_id || "",
          amount: Number(record.amount || 0),
          method: record.method || "",
          proofImage: record.proof_image || "",
          receiptImage: record.proof_image || "",
          reference: record.reference || "",
          status: record.status || PAYMENT_STATUS.PENDING,
          submittedAt: record.submitted_at,
          approvedAt: record.approved_at || "",
        };

        setPaymentRequests((prev) => {
          const filtered = prev.filter((item) => item.id !== normalized.id);
          if (eventType === "DELETE") {
            return filtered;
          }
          return [normalized, ...filtered];
        });

        if (normalized.status === PAYMENT_STATUS.APPROVED) {
          setSubscription({
            status: PAYMENT_STATUS.APPROVED,
            planId: "lifetime",
            planLabel: "Lifetime Access",
            amount: Number(normalized.amount || 0),
            reference: normalized.id,
            submittedAt: normalized.submittedAt || null,
            approvedAt: normalized.approvedAt || null,
          });
        }
      }

      if (table === "user_module_access" && record.user_id === userId) {
        void loadDashboardData();
      }

      if (table === "profiles" && record.id === userId) {
        void loadDashboardData();
      }

      if (realtimeReloadTimerRef.current) {
        clearTimeout(realtimeReloadTimerRef.current);
      }

      realtimeReloadTimerRef.current = setTimeout(() => {
        realtimeReloadTimerRef.current = null;
        void loadDashboardData();
        void loadRemotePaymentState();
        void loadModuleFileProgress();
        void loadNotifications(false);
      }, 120);
    },
    [loadDashboardData, loadModuleFileProgress, loadNotifications, loadRemotePaymentState, userId],
  );

  useRealtimeTables({
    tables: [
      "learning_modules",
      "learning_worksheets",
      "learning_paths",
      "learning_path_steps",
      "learning_containers",
      "payment_records",
      "user_module_access",
      "profiles",
      "worksheet_progress",
      "module_progress",
      "module_file_progress",
      "notifications",
    ],
    filters: {
      payment_records: [`user_id=eq.${userId}`],
      user_module_access: [`user_id=eq.${userId}`],
      profiles: [`id=eq.${userId}`],
      notifications: [`user_id=eq.${userId}`],
    },
    channelName: `user-dashboard-${userId}`,
    onChange: handleRealtimeEvent,
  });

  useEffect(() => {
    const handleAppVisible = () => {
      if (document.visibilityState === "visible") {
        void loadDashboardData();
        void loadRemotePaymentState();
        void loadNotifications(false);
      }
    };

    window.addEventListener("visibilitychange", handleAppVisible);
    window.addEventListener("focus", handleAppVisible);

    return () => {
      window.removeEventListener("visibilitychange", handleAppVisible);
      window.removeEventListener("focus", handleAppVisible);
    };
  }, [loadDashboardData, loadRemotePaymentState, loadNotifications]);

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
    return new Set(
      (resourcesData.bookmarks || []).map(
        (bookmark) => `${bookmark.type}:${bookmark.itemId}`,
      ),
    );
  }, [resourcesData.bookmarks]);

  const toggleBookmark = (type, itemId) => {
    const result = toggleResourceBookmark({
      userId,
      type,
      itemId,
    });

    refreshResourcesData();
    setResourcesNotice(
      result.bookmarked ? "Saved to Bookmarks." : "Removed from Bookmarks.",
    );
  };

  const openBookmarkItem = (bookmark) => {
    if (bookmark.type === "module") {
      setSelectedModuleId(bookmark.itemId);
      setTab("modules");
      return;
    }

    const targetWorksheet = learningData.worksheets.find(
      (sheet) => sheet.id === bookmark.itemId,
    );
    const hasActiveSubscription = isActiveSubscription(subscription);
    const hasUnlockedPremiumModule = learningData.modules.some(
      (module) => module.type === "paid" && !module.isLocked,
    );
    const hasPremiumWorksheetAccess =
      hasActiveSubscription || hasUnlockedPremiumModule;
    const isWorksheetLocked =
      targetWorksheet?.accessType === "paid" && !hasPremiumWorksheetAccess;

    if (isWorksheetLocked) {
      setWorksheetNotice(
        "This worksheet is Premium. Unlock premium access first.",
      );
      setTab("payment");
      return;
    }

    setSelectedWorksheetId(bookmark.itemId);
    setTab("worksheets");
  };

  const removeUserBookmark = (bookmark) => {
    removeResourceBookmark(bookmark.id, userId);
    refreshResourcesData();
    setResourcesNotice("Bookmark removed.");
  };

  const allModules = useMemo(
    () =>
      [...learningData.modules].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      ),
    [learningData.modules],
  );
  const selectedModule = useMemo(
    () => allModules.find((module) => module.id === selectedModuleId) || null,
    [allModules, selectedModuleId],
  );
  const selectedWorksheet = useMemo(
    () =>
      learningData.worksheets.find(
        (worksheet) => worksheet.id === selectedWorksheetId,
      ) || null,
    [learningData.worksheets, selectedWorksheetId],
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
    if (activeTab === "worksheets") return;
    setSelectedWorksheetId("");
  }, [activeTab]);

  useEffect(() => {
    if (!selectedWorksheetId) return;
    const exists = learningData.worksheets.some(
      (worksheet) => worksheet.id === selectedWorksheetId,
    );
    if (!exists) setSelectedWorksheetId("");
  }, [learningData.worksheets, selectedWorksheetId]);

  const hasPendingPremiumPayment = useMemo(
    () => subscription?.status === PAYMENT_STATUS.PENDING,
    [subscription],
  );

  const hasPremiumWorksheetAccess = useMemo(() => {
    const hasActiveSubscription = isActiveSubscription(subscription);
    const hasUnlockedPremiumModule = learningData.modules.some(
      (module) => module.type === "paid" && !module.isLocked,
    );
    return hasActiveSubscription || hasUnlockedPremiumModule;
  }, [learningData.modules, subscription]);

  const isWorksheetLocked = useCallback(
    (worksheet) =>
      worksheet?.accessType === "paid" && !hasPremiumWorksheetAccess,
    [hasPremiumWorksheetAccess],
  );

  const activePath = learningData.activeLearningPath;
  const pathSteps = activePath?.steps || [];
  const completedPathSteps = useMemo(
    () => Math.min(stats.completedLessons || 0, pathSteps.length),
    [pathSteps.length, stats.completedLessons],
  );
  const currentStepIndex =
    pathSteps.length > 0
      ? Math.min(completedPathSteps, pathSteps.length - 1)
      : 0;
  const currentStep = pathSteps[currentStepIndex] || null;
  const nextRecommendedStep = pathSteps[completedPathSteps] || currentStep;

  const moduleMap = useMemo(
    () => new Map(learningData.modules.map((module) => [module.id, module])),
    [learningData.modules],
  );
  const worksheetMap = useMemo(
    () => new Map(learningData.worksheets.map((sheet) => [sheet.id, sheet])),
    [learningData.worksheets],
  );

  const sortedWorksheets = useMemo(
    () =>
      [...learningData.worksheets].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [learningData.worksheets],
  );

  const moduleGroups = useMemo(() => {
    const moduleGroupsMap = new Map();

    (learningData.containers || []).forEach((container) => {
      moduleGroupsMap.set(container.id, {
        id: container.id,
        title: container.title,
        subtitle: container.subtitle || "",
        modules: [],
        createdAt: container.createdAt || "",
      });
    });

    allModules.forEach((module) => {
      if (!module.containerId) return;

      let group = moduleGroupsMap.get(module.containerId);
      if (!group) {
        group = {
          id: module.containerId,
          title: module.containerTitle || "Untitled Container",
          subtitle: module.containerSubtitle || "",
          modules: [],
          createdAt: "",
        };
        moduleGroupsMap.set(group.id, group);
      }

      group.modules.push(module);
    });

    return Array.from(moduleGroupsMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
    );
  }, [learningData.containers, allModules]);

  const homeAverageScore = useMemo(() => {
    const values = Object.values(worksheetScores || {}).filter(
      (item) =>
        item &&
        typeof item.quizPercent === "number" &&
        typeof item.writingPercent === "number",
    );

    if (!values.length) {
      return Number(stats.averageScore || 0);
    }

    const sum = values.reduce(
      (acc, item) => acc + (item.quizPercent + item.writingPercent) / 2,
      0,
    );
    return Math.round(sum / values.length);
  }, [stats.averageScore, worksheetScores]);

  const completedModulesCount = useMemo(() => {
    return learningData.modules.filter((module) => {
      const progress = moduleProgress[module.id];
      return (
        Boolean(progress?.completed) ||
        Number(progress?.progressPercent || 0) >= 100
      );
    }).length;
  }, [learningData.modules, moduleProgress]);

  const handleWorksheetScoreChange = useCallback(
    (worksheetId, scorePayload) => {
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
    },
    [userId],
  );

  const storageBucket =
    process.env.NEXT_PUBLIC_SUPABASE_MODULES_BUCKET || "module-files";
  const storagePublicPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${storageBucket}/`;

  const getStoragePathFromPublicUrl = useCallback(
    (publicUrl) => {
      if (!publicUrl || !storagePublicPrefix) return "";
      if (!publicUrl.startsWith(storagePublicPrefix)) return "";
      return decodeURIComponent(publicUrl.slice(storagePublicPrefix.length));
    },
    [storagePublicPrefix],
  );

  const getAccessibleModuleFileUrl = useCallback(
    async (resourceFileData) => {
      const storagePath = getStoragePathFromPublicUrl(resourceFileData);
      if (!storagePath) return resourceFileData;

      try {
        const response = await fetch(
          `/api/module-file-url?path=${encodeURIComponent(storagePath)}`,
        );
        const data = await response.json();
        if (!response.ok || !data?.url) {
          return resourceFileData;
        }
        return data.url;
      } catch (error) {
        console.warn("Unable to get accessible module file URL:", error);
        return resourceFileData;
      }
    },
    [getStoragePathFromPublicUrl],
  );

  const toggleModulePreview = useCallback((module) => {
    setOpenModulePreviews((prev) => ({
      ...prev,
      [module.id]: !prev[module.id],
    }));
  }, []);

  const handleOpenModuleResource = useCallback(
    async (module, attachment = null, attachmentIndex = 0) => {
      const file = attachment || {
        fileData: module.resourceFileData,
        fileType: module.resourceFileType,
        fileName: module.resourceFileName,
      };

      if (!file?.fileData) return;
      const accessibleUrl = await getAccessibleModuleFileUrl(file.fileData);
      if (!accessibleUrl) return;

      const fileIdentifier = getModuleFileIdentifier(module.id, attachmentIndex);
      setModuleFileProgress((prev) => {
        const moduleProgress = prev[module.id] || {};
        if (moduleProgress[fileIdentifier]?.isOpened) {
          return prev;
        }
        return {
          ...prev,
          [module.id]: {
            ...moduleProgress,
            [fileIdentifier]: {
              isOpened: true,
              openedAt: new Date().toISOString(),
            },
          },
        };
      });

      const openedWindow = window.open(accessibleUrl, "_blank", "noopener,noreferrer");
      if (!openedWindow) {
        console.warn("Module file popup was blocked or could not be opened.");
      }

      void upsertModuleFileProgressShared({
        userId,
        moduleId: module.id,
        fileIdentifier,
        isOpened: true,
      });

      setModuleProgress((prev) => {
        const current = prev[module.id] || {};
        if (
          Boolean(current.completed) &&
          Number(current.progressPercent || 0) >= 100
        ) {
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
    },
    [getAccessibleModuleFileUrl, userId],
  );

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
        value:
          pathSteps.length > 0 ? `Step ${currentStepIndex + 1}` : "Not Set",
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
        value: `${stats.studyStreak || 0} days`,
        hint: "Consistency builds fluency",
        icon: "🔥",
      },
    ],
    [
      completedModulesCount,
      currentStep?.title,
      currentStepIndex,
      homeAverageScore,
      learningData.modules.length,
      pathSteps.length,
      stats.studyStreak,
    ],
  );

  const recommendedNextSteps = useMemo(
    () => [
      {
        id: "finish-current",
        label:
          nextRecommendedStep?.type === "worksheet"
            ? `Finish current worksheet: ${
                worksheetMap.get(
                  (Array.isArray(nextRecommendedStep.linkedWorksheetIds) &&
                    nextRecommendedStep.linkedWorksheetIds[0]) ||
                    (Array.isArray(nextRecommendedStep.linkedItemIds) &&
                      nextRecommendedStep.linkedItemIds[0]) ||
                    nextRecommendedStep.linkedItemId,
                )?.title ||
                nextRecommendedStep.title ||
                "Worksheet"
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
                  (Array.isArray(nextRecommendedStep.linkedModuleIds) &&
                    nextRecommendedStep.linkedModuleIds[0]) ||
                    (Array.isArray(nextRecommendedStep.linkedItemIds) &&
                      nextRecommendedStep.linkedItemIds[0]) ||
                    nextRecommendedStep.linkedItemId,
                )?.moduleName ||
                nextRecommendedStep.title ||
                "Next Module"
              }`
            : "Open next module",
      },
    ],
    [moduleMap, nextRecommendedStep, worksheetMap],
  );

  const learningUpdates = useMemo(
    () => [
      { id: "update-1", label: "New pronunciation module released this week." },
      { id: "update-2", label: "Live Q&A starts Saturday at 6:00 PM." },
      {
        id: "update-3",
        label: "Worksheet deadline reminder: submit before Sunday.",
      },
    ],
    [],
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
    [],
  );

  const requestedPaymentModuleId = searchParams.get("module") || "";
  const premiumModules = useMemo(
    () => learningData.modules.filter((module) => module.type === "paid"),
    [learningData.modules],
  );
  const latestPaymentRequest = useMemo(() => {
    return (
      paymentRequests
        .filter((request) => request.userId === userId)
        .sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )[0] || null
    );
  }, [paymentRequests, userId]);
  const selectedPaymentModule = useMemo(() => {
    if (requestedPaymentModuleId) {
      return (
        premiumModules.find(
          (module) => module.id === requestedPaymentModuleId,
        ) || null
      );
    }
    return (
      premiumModules.find((module) => module.isLocked) ||
      premiumModules[0] ||
      null
    );
  }, [premiumModules, requestedPaymentModuleId]);

  const saveGoal = () => {
    window.localStorage.setItem(`bh-goal-${userId}`, goalText);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 1800);
  };

  const uploadProof = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("proof read error"));
      reader.readAsDataURL(file);
    });
    setProofFile(file);
    setProofImage(dataUrl);
  };

  const submitPayment = async () => {
    if (subscription?.status === PAYMENT_STATUS.PENDING || latestPaymentRequest?.status === PAYMENT_STATUS.PENDING) {
      setPaymentNotice("Payment already submitted and is pending review. Please wait for admin approval.");
      return;
    }

    if (!proofImage) {
      setPaymentNotice("Please upload payment proof first.");
      return;
    }

    const selectedPlan = paymentPlans.find((plan) => plan.id === selectedPlanId);
    const selectedMethod = paymentMethods.find((method) => method.id === paymentMethod) || paymentMethods[0];

    if (!selectedMethod) {
      setPaymentNotice("Please choose a payment method before uploading proof.");
      return;
    }

    setIsSubmittingPaymentProof(true);
    setPaymentNotice("Uploading payment proof...");

    try {
      const paymentResult = await submitPaymentProofShared({
        userId,
        userEmail,
        userName,
        planId: selectedPlanId,
        plan: selectedPlan,
        amount: selectedPlan?.price || 0,
        method: selectedMethod,
        reference: referenceNumber,
        proofImage,
      });

      setPaymentRequests((prev) => [paymentResult, ...prev.filter((item) => item.id !== paymentResult.id)]);

      if (paymentResult?.status === PAYMENT_STATUS.APPROVED) {
        setSubscription({
          status: PAYMENT_STATUS.APPROVED,
          planId: "lifetime",
          planLabel: "Lifetime Access",
          amount: Number(paymentResult.amount || 0),
          reference: paymentResult.id,
          submittedAt: paymentResult.submittedAt || null,
          approvedAt: paymentResult.approvedAt || null,
        });
      }

      if (paymentResult?.blocked) {
        if (paymentResult.blockReason === "already-active") {
          setPaymentNotice("Subscription is already active. No new payment proof is required.");
        } else if (paymentResult.blockReason === "pending-verification") {
          setPaymentNotice("Payment already submitted. Please wait for admin review.");
        }
        return;
      }

      setPaymentNotice("Payment proof submitted. Waiting for admin review.");
      setProofFile(null);
      setProofImage("");
      setReferenceNumber("");
      setPaymentModalOpen(false);
    } catch (error) {
      console.error("Payment proof upload failed:", error);
      setPaymentNotice(
        error?.message ||
          "Upload failed. Please try again or contact support if the problem persists."
      );
    } finally {
      setIsSubmittingPaymentProof(false);
    }
  };

  useEffect(() => {
    setCalendarMatrix(getMonthMatrix());
  }, []);

  useEffect(() => {
    if (activeTab !== "payment") return;
    setPaymentNotice("");
    setProofImage("");
    setProofFile(null);
    setReferenceNumber("");
    setPaymentModalOpen(false);
  }, [activeTab, requestedPaymentModuleId]);

  const renderModulesGrouped = () => {
    const moduleGroupsList = moduleGroups;
    const renderModuleCard = (module) => {
      const isPremium = module.type === "paid";
      const moduleScore = moduleProgress[module.id] || null;
      const moduleProgressPercent =
        moduleScore && moduleScore.completed
          ? 100
          : Math.max(
              0,
              Math.min(100, Number(moduleScore?.progressPercent || 0)),
            );
      const attachments = Array.isArray(module.resourceFiles)
        ? module.resourceFiles
        : module.resourceFileData
          ? [
              {
                fileName: module.resourceFileName || "",
                fileType: module.resourceFileType || "",
                fileData: module.resourceFileData,
              },
            ]
          : [];
      const hasAttachments = attachments.length > 0;
      const sectionLabel = `${attachments.length} section${attachments.length === 1 ? "" : "s"}`;

      return (
        <article
          key={module.id}
          className={`relative flex h-full rounded-[28px] shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition ${isLight ? "shadow-sm" : ""}`}
        >
          <div
            className={`flex w-full flex-col rounded-2xl border p-4 transition ${
              isLight
                ? "border-slate-200 bg-white"
                : "border-white/10 bg-[#0f1d32]"
            }`}
          >
            <div className="absolute right-3 top-3 z-30 flex items-center gap-2 pointer-events-auto">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isPremium
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                    : "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {isPremium ? "Premium" : "Free"}
                {isPremium && module.isLocked && !hasPremiumWorksheetAccess ? (
                  <Lock size={12} className="text-rose-400" />
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => toggleBookmark("module", module.id)}
                className={`inline-flex min-w-max items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition pointer-events-auto ${
                  bookmarkedLookup.has(`module:${module.id}`)
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                    : isLight
                      ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                      : "border-white/15 text-slate-200 hover:bg-white/10"
                }`}
              >
                {bookmarkedLookup.has(`module:${module.id}`) ? (
                  <BookmarkCheck size={12} />
                ) : (
                  <Bookmark size={12} />
                )}
              </button>
            </div>

            <div
              className={`relative z-10 flex w-full flex-col ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "opacity-60 pointer-events-none text-white" : ""}`}
            >
              <h3
                className={`pr-20 text-lg font-semibold ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "text-white" : ""}`}
              >
                {module.moduleName}
              </h3>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  {renderModuleTopic(module.topicTitle, module.id) || (
                    <p
                      className={`text-sm italic ${module.isLocked && isPremium && !hasPremiumWorksheetAccess ? "text-white" : isLight ? "text-slate-900" : "text-slate-300"}`}
                    >
                      {module.topicTitle}
                    </p>
                  )}
                </div>

                {hasAttachments && !module.isInactive && !module.isLocked ? (
                  <div className="shrink-0 min-w-0 text-left sm:text-right">
                    <button
                      type="button"
                      onClick={() => void toggleModulePreview(module)}
                      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition ${isLight ? "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200" : "border-slate-700 bg-slate-950/90 text-slate-100 hover:bg-slate-800"}`}
                    >
                      <span className="max-w-full truncate">{sectionLabel}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${openModulePreviews[module.id] ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-0">
                {module.isInactive ? (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    This module is temporarily inactive.
                  </p>
                ) : !module.isLocked ? (
                  <>
                    {hasAttachments && openModulePreviews[module.id] ? (
                      <div className={`mt-2 w-full max-w-full overflow-hidden rounded-2xl border p-0 text-sm shadow-lg ${isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/10 bg-slate-950/90 text-slate-300"}`}>
                        <div className={`flex w-full items-center gap-3 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                          <span>Section</span>
                          <span className="ml-auto">Status</span>
                        </div>
                        {attachments.map((attachment, index) => (
                          <button
                            key={`${attachment.fileName || attachment.fileUrl || attachment.id || "file"}-${index}`}
                            type="button"
                            onClick={() =>
                              void handleOpenModuleResource(module, attachment, index)
                            }
                            className={`flex w-full flex-col gap-3 px-3 py-3 text-left transition sm:flex-row sm:items-center ${isLight ? "text-slate-900 hover:bg-slate-100" : "text-slate-100 hover:bg-white/5"} ${
                              index > 0
                                ? isLight
                                  ? "border-t border-slate-200"
                                  : "border-t border-white/10"
                                : ""
                            }`}
                          >
                            <div className="flex w-full items-center gap-3 min-w-0">
                              <FileText
                                size={16}
                                className="shrink-0 text-amber-300"
                              />
                              <span className="min-w-0 wrap-break-word truncate text-sm">
                                {attachment.fileName || attachment.title || `Section ${index + 1}`}
                              </span>
                            </div>
                            <span className={`ml-0 self-start text-xs font-semibold uppercase tracking-wide text-left sm:ml-auto sm:self-center ${moduleFileProgress[module.id]?.[getModuleFileIdentifier(module.id, index)]?.isOpened ? "text-emerald-400" : "text-slate-400"}`}>
                              {moduleFileProgress[module.id]?.[getModuleFileIdentifier(module.id, index)]?.isOpened ? "Completed" : "Pending"}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      );
    };

    const hasModuleGroups = moduleGroupsList.length > 0;

    if (hasModuleGroups) {
      return (
        <div className="space-y-1">
          {moduleGroupsList.map((group) => (
            <div
              key={group.id}
              className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#0f172a]"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className={`text-lg font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>
                    {group.title}
                  </h3>
                  {group.subtitle ? (
                    <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {group.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {group.modules.length > 0 ? (
                  group.modules.map(renderModuleCard)
                ) : (
                  <div className={`rounded-2xl border border-dashed p-6 text-sm ${isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-slate-500/30 bg-slate-900/30 text-slate-300"}`}>
                    No modules have been assigned yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const renderMainSection = () => {
    if (activeTab === "modules") {
      return (
        <main
          id="user-modules-section"
          className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}
        >
          <section
            className={`relative rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Modules</h2>
                <p
                  className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
                >
                  Modules are displayed using titles and cards assigned by the
                  admin.
                </p>
              </div>
              {/* General Unlock/Purchase button for all locked modules (top right, only if any locked) */}
              {allModules.some(
                (module) => module.type === "paid" && module.isLocked,
              ) &&
                !hasPremiumWorksheetAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentNotice("");
                      setProofImage("");
                      setTab("payment");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300 shadow-lg"
                    style={{ minWidth: 170 }}
                  >
                    Unlock / Purchase
                  </button>
                )}
            </div>

            <div className="mt-4">{renderModulesGrouped()}</div>
          </section>
        </main>
      );
    }

    if (activeTab === "path") {
      return (
        <main
          className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}
        >
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
        <main
          className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}
        >
          <section
            className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                {selectedWorksheet ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorksheetId("");
                        setTab("worksheets");
                      }}
                      aria-label="Back to worksheets"
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-lg transition ${isLight ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100" : "border-white/15 bg-[#0f1d32] hover:bg-white/10 text-slate-200"}`}
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedWorksheet.title}
                      </h2>
                      <p className="text-sm uppercase tracking-[0.35em] text-amber-300">
                        Writing Practice
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">Worksheets</h2>
                    <p
                      className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
                    >
                      Select a worksheet card to start Writing and Quiz mode.
                    </p>
                  </>
                )}
              </div>

              {selectedWorksheet ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className={`inline-flex flex-wrap items-center gap-2 rounded-3xl border px-3 py-2 text-sm transition ${isLight ? "border-slate-200 bg-slate-100 text-slate-700" : "border-white/10 bg-[#0f1d32] text-slate-200"}`}>
                    <button
                      type="button"
                      onClick={() => setWorksheetMode("writing")}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${worksheetMode === "writing" ? "bg-amber-400 text-[#0b1728]" : isLight ? "text-slate-700 hover:bg-slate-200" : "text-slate-200 hover:bg-white/5"}`}
                    >
                      Writing
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorksheetMode("quiz")}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${worksheetMode === "quiz" ? "bg-amber-400 text-[#0b1728]" : isLight ? "text-slate-700 hover:bg-slate-200" : "text-slate-200 hover:bg-white/5"}`}
                    >
                      Quiz
                    </button>
                    {selectedWorksheet.resourceFileData ? (
                      <a
                        href={selectedWorksheet.resourceFileData}
                        target="_blank"
                        rel="noreferrer"
                        title="Download Worksheet"
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${isLight ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200" : "border-white/10 bg-[#0f1d32] text-slate-200 hover:bg-white/5"}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {selectedWorksheet ? (
              <div className="mt-4">
                {isWorksheetLocked(selectedWorksheet) ? (
                  <div
                    className={`rounded-xl border p-4 text-sm ${isLight ? "border-amber-300 bg-amber-50 text-amber-800" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}
                  >
                    This worksheet requires premium access.
                  </div>
                ) : (
                  <WorksheetPracticePanel
                    key={selectedWorksheetId}
                    worksheet={selectedWorksheet}
                    isLight={isLight}
                    onScoreChange={handleWorksheetScoreChange}
                    mode={worksheetMode}
                    onModeChange={setWorksheetMode}
                  />
                )}
              </div>
            ) : (
              <>
                {worksheetNotice ? (
                  <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {worksheetNotice}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sortedWorksheets.map((sheet) => {
                    const sheetScore = worksheetScores[sheet.id] || null;
                    const sheetLocked = isWorksheetLocked(sheet);
                    const progressPercent = sheetScore
                      ? Math.round(
                          (Number(sheetScore.quizPercent || 0) +
                            Number(sheetScore.writingPercent || 0)) /
                            2,
                        )
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
                          isLight
                            ? "border-slate-200 bg-white"
                            : "border-white/10 bg-[#0f1d32]"
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
                        <p
                          className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {sheet.entries?.length || 0} rows • Writing + Quiz
                        </p>
                        <p
                          className={`mt-1 text-[11px] font-semibold ${sheetLocked ? "text-amber-300" : isLight ? "text-emerald-700" : "text-emerald-300"}`}
                        >
                          {sheet.accessType === "paid"
                            ? "Premium Worksheet"
                            : "Free Worksheet"}
                        </p>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span
                              className={
                                isLight ? "text-slate-600" : "text-slate-300"
                              }
                            >
                              Progress
                            </span>
                            <span className="font-semibold">
                              {progressPercent}%
                            </span>
                          </div>
                          <div
                            className={`h-2 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all"
                              style={{
                                width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                              }}
                            />
                          </div>
                          <p
                            className={`mt-1 text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {hasStarted
                              ? "Saved from your worksheet practice"
                              : "No worksheet progress yet"}
                          </p>
                        </div>

                        {isWorksheetPerfect ? (
                          <div
                            className={`mt-3 inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/10 text-emerald-200"}`}
                          >
                            Completed
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (sheetLocked) {
                                setWorksheetNotice(
                                  "This worksheet is Premium. Unlock premium access first.",
                                );
                                setPaymentNotice("");
                                setProofImage("");
                                setTab("payment");
                                return;
                              }
                              setWorksheetNotice("");
                              setSelectedWorksheetId(sheet.id);
                            }}
                            className="mt-3 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-[#0b1728] hover:bg-amber-300"
                          >
                            {sheetLocked
                              ? "Unlock Premium"
                              : hasStarted
                                ? "Continue"
                                : "Open Worksheet"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>

                {learningData.worksheets.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-400">
                    No worksheets available yet.
                  </p>
                ) : null}
              </>
            )}
          </section>
        </main>
      );
    }

    if (activeTab === "goal") {
      return (
        <main
          className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}
        >
          <section
            className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}
          >
            <h2 className="text-xl font-bold">My Goal</h2>
            <p
              className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              Goal is user-only and editable by you.
            </p>
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
            {goalSaved && (
              <p className="mt-2 text-sm text-emerald-400">Goal saved.</p>
            )}
          </section>
        </main>
      );
    }

    if (activeTab === "payment") {
      return (
        <UserPaymentSection
          plans={paymentPlans}
          methods={paymentMethods}
          selectedPlanId={selectedPlanId}
          selectedMethodId={paymentMethod}
          paymentModalOpen={paymentModalOpen}
          latestRequest={latestPaymentRequest}
          subscription={subscription}
          referenceNumber={referenceNumber}
          proofImage={proofImage}
          onSelectPlan={setSelectedPlanId}
          onOpenModal={() => setPaymentModalOpen(true)}
          onCloseModal={() => setPaymentModalOpen(false)}
          onSelectMethod={setPaymentMethod}
          onReferenceChange={setReferenceNumber}
          onUploadProof={uploadProof}
          onSubmitProof={submitPayment}
          notice={paymentNotice}
          isUploading={isSubmittingPaymentProof}
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
      <main
        className={`space-y-5 rounded-2xl p-5 lg:p-6 ${isLight ? "bg-white" : "bg-[#0f1d32]"}`}
      >
        <HeroLearningCard
          userName={userName}
          isLight={isLight}
          studyStreak={stats.studyStreak || 0}
        />

        <HomeBannerCarousel slides={homeBannerSlides} isLight={isLight} />

        <LearningSummaryCards items={summaryItems} isLight={isLight} />

        <RecentLearningActivityCard
          activities={recentActivity}
          isLight={isLight}
        />
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
    const palette = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const seed = `${userName || ""}${userEmail || ""}`;
    const hash = Array.from(seed).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
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
    <section
      className={`min-h-screen w-full overflow-x-hidden pb-24 lg:pb-0 ${isLight ? "bg-[#eef3ff] text-slate-900" : "bg-[#07111f] text-slate-100"}`}
    >
      <header
        className={`sticky top-0 z-20 border-b px-4 py-3 backdrop-blur sm:px-6 lg:px-8 ${isLight ? "border-slate-200 bg-white/95" : "border-white/10 bg-[#0b1728]/95"}`}
      >
        <div className="flex w-full items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="min-w-55 text-lg font-bold [font-family:var(--font-body)]">
              <span className={isLight ? "text-slate-900" : "text-white"}>
                Beyond{" "}
              </span>
              <span className="text-amber-400">Hangeul</span>
            </div>
          </div>

          <div
            className={`mx-2 hidden w-full flex-1 rounded-full border px-4 py-2 md:flex xl:mx-6 ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5"} relative`}
          >
            <Search
              size={16}
              className={isLight ? "text-slate-500" : "text-slate-400"}
            />
            <input
              type="text"
              placeholder="Search modules, worksheets, resources..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                if (query.trim()) setIsSearchOpen(true);
              }}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
              onKeyDown={(event) =>
                handleSearchKeyDown(event, (item) =>
                  handleSearchResultSelect(item),
                )
              }
              className={`ml-2 w-full bg-transparent text-sm outline-none ${isLight ? "text-slate-800 placeholder:text-slate-500" : "text-white placeholder:text-slate-400"}`}
            />

            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-slate-300">
                    <p>No results found</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another keyword
                    </p>
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
                          index === searchHighlighted
                            ? "bg-slate-800"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className="mt-0.5 text-lg">{result.icon}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {highlightMatches(result.title, query)}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {result.type}
                            {result.subtitle ? " • " : ""}
                            {result.subtitle
                              ? highlightMatches(result.subtitle, query)
                              : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAccountDrawer}
              aria-label="Open account drawer"
              className={`rounded-lg border p-2 lg:hidden ${isLight ? "border-slate-300 text-slate-700" : "border-white/20 text-slate-200"}`}
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className={`relative inline-flex h-9 items-center rounded-full border transition ${isLight ? "border-slate-200 bg-slate-100" : "border-slate-600 bg-[#07111f]"}`}
              style={{ width: 72 }}
            >
              <span
                className={`absolute inset-y-0.5 h-7 w-1/2 rounded-full transition-all duration-300 ${
                  isLight ? "right-1 bg-white" : "left-1 bg-slate-950"
                }`}
              />
              <span className="relative z-10 grid w-full grid-cols-2 gap-1 px-1">
                <span className={`flex h-7 w-full items-center justify-center rounded-full ${isLight ? "bg-transparent text-slate-900" : "bg-transparent text-white"}`}>
                  {!isLight ? <Moon size={16} /> : null}
                </span>
                <span className={`flex h-7 w-full items-center justify-center rounded-full ${isLight ? "bg-white text-slate-950" : "bg-transparent text-white"}`}>
                  {isLight ? <Sun size={16} /> : null}
                </span>
              </span>
            </button>

            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`relative rounded-full border p-2 ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5"}`}
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0b1728]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className={`absolute right-0 z-40 mt-2 w-80 max-h-96 overflow-hidden rounded-3xl shadow-2xl ${isLight ? "border border-slate-200 bg-white" : "border border-white/10 bg-[#0f1d32]"}`}>
                  <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
                    <div>
                      <p className={`text-sm font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>Notifications</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{unreadCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await markAllNotificationsReadShared(userId);
                        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
                      }}
                      className={`text-xs transition ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className={`px-4 py-6 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className={`px-4 py-6 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>No notifications yet.</div>
                    ) : (
                      <div className="space-y-2 px-3 py-3">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={async () => {
                              if (!notification.isRead) {
                                await markAllNotificationsReadShared(userId);
                                setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
                              }
                            }}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${notification.isRead ? (isLight ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20") : (isLight ? "border-amber-200 bg-amber-50 text-slate-900 shadow-sm shadow-amber-100 hover:border-amber-300" : "border-amber-300/20 bg-white/10 text-white shadow-sm shadow-amber-500/10 hover:border-amber-300")}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{notification.title}</span>
                              {!notification.isRead && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                            </div>
                            <p className={`mt-1 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>{notification.message}</p>
                            <p className={`mt-2 text-[11px] uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>{formatRelativeTime(notification.createdAt)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{userName}</p>
              <p
                className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}
              >
                {userEmail}
              </p>
            </div>

            <div className="relative hidden sm:block">
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
                <div
                  className={`absolute right-0 z-30 mt-2 w-40 rounded-xl border p-2 shadow-2xl ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}
                >
                  <Link
                    href="/profile"
                    className={`block rounded-lg px-3 py-2 text-sm ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                  >
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

      <div className={`fixed inset-0 z-30 transition-opacity duration-300 lg:hidden ${accountDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} ${isLight ? "bg-slate-950/10" : "bg-black/40"}`} onClick={handleToggleAccountDrawer} />
      <aside className={`fixed inset-y-0 left-0 z-40 w-[min(92vw,320px)] transform overflow-y-auto border-r p-4 shadow-2xl transition duration-300 lg:hidden ${accountDrawerOpen ? "translate-x-0" : "-translate-x-full"} ${isLight ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-[#0b1728] text-slate-100"}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>Account</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Profile & notifications</p>
          </div>
          <button
            type="button"
            onClick={handleToggleAccountDrawer}
            className={`rounded-lg border p-2 ${isLight ? "border-slate-300 text-slate-700" : "border-white/20 text-slate-200"}`}
            aria-label="Close account drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`rounded-3xl border p-4 ${isLight ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-[#07111f] text-white"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{userName}</p>
              <p className="truncate text-xs text-slate-400">{userEmail}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Link
              href="/profile"
              className={`block rounded-2xl px-4 py-3 text-sm transition ${isLight ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "bg-white/5 text-white hover:bg-white/10"}`}
            >
              View Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#0b1728] transition hover:bg-amber-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-slate-400">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsReadShared(userId);
                setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
              }}
              className={`text-xs ${isLight ? "text-slate-400 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
            >
              Mark all read
            </button>
          </div>
          <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1 space-y-2">
            {notificationsLoading ? (
              <div className={`px-2 py-4 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={`px-2 py-4 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await markAllNotificationsReadShared(userId);
                      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
                    }
                  }}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${notification.isRead ? (isLight ? "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20") : (isLight ? "border-amber-200 bg-amber-50 text-slate-900 shadow-sm shadow-amber-100 hover:border-amber-300" : "border-amber-300/20 bg-white/10 text-white shadow-sm shadow-amber-500/10 hover:border-amber-300")}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{notification.title}</span>
                    {!notification.isRead && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                  </div>
                  <p className={`mt-1 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>{notification.message}</p>
                  <p className={`mt-2 text-[11px] uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>{formatRelativeTime(notification.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <div
        className={`grid w-full grid-cols-1 gap-6 py-6 pl-0 pr-4 sm:pr-6 lg:pr-8 lg:grid-cols-[auto_1fr_320px]`}
      >
        <aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`group fixed left-0 z-30 hidden border-r p-4 transition-all duration-300 lg:block ${navHeightClass} ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0b1728]"} ${
            isSidebarCollapsed ? "lg:w-20" : "lg:w-65"
          } lg:hover:w-65 lg:sticky lg:self-start lg:top-22.25 lg:h-[calc(100vh-7rem)] lg:rounded-r-2xl lg:border ${isLight ? "lg:border-slate-200 lg:bg-white" : "lg:border-white/10 lg:bg-[#0f1d32]"}`}
        >
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              const navItemClass = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isSidebarCollapsed ? "justify-center" : "justify-start"
              } ${
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
                  <button
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={navItemClass}
                  >
                    <span className="inline-flex items-center justify-center rounded-full bg-transparent p-1">
                      <Icon size={isSidebarCollapsed ? 20 : 22} />
                    </span>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                        isSidebarCollapsed
                          ? "max-w-0 opacity-0 lg:max-w-40 lg:group-hover:max-w-full lg:group-hover:opacity-100"
                          : "max-w-full opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>
        </aside>

        {renderMainSection()}

        <aside className="space-y-4">
          <section
            className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-300" />
              <h3 className="font-semibold" suppressHydrationWarning>
                {now
                  ? `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`
                  : "Calendar"}
              </h3>
            </div>
            <div
              className={`grid grid-cols-7 gap-1 text-center text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span
                  key={`${day}-${idx}`}
                  className={`py-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
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
                <span
                  className={`col-span-7 py-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Loading calendar...
                </span>
              ) : null}
            </div>
          </section>

          <RecommendedNextStepsCard
            items={recommendedNextSteps}
            isLight={isLight}
          />

          <LearningUpdatesCard updates={learningUpdates} isLight={isLight} />
        </aside>
      </div>

      <div className="lg:hidden">
        <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 shadow-[0_-12px_45px_rgba(0,0,0,0.12)] backdrop-blur ${isLight ? "border-slate-200 bg-white/95" : "border-white/10 bg-[#0b1728]/95"}`}>
          <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-1 pb-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`shrink-0 min-w-18 rounded-3xl px-3 py-2 text-[11px] font-semibold transition ${isActive ? "bg-amber-400 text-[#0b1728]" : isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-white/10"}`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Icon size={18} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {activeTab === "modules" ? (
        <button
          type="button"
          onClick={() => {
            const target = document.getElementById("user-modules-section");
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`fixed right-4 z-50 rounded-full p-3 shadow-xl transition duration-300 focus:outline-none focus:ring-2 focus:ring-amber-300 ${showScrollTop ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"} ${isLight ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"} lg:right-8 lg:bottom-8 bottom-24`}
          style={{ boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)" }}
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>
      ) : null}
    </section>
  );
}
