"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Upload } from "lucide-react";
import {
  ADMIN_SECTIONS,
  MODULE_STATUS,
  MODULE_TYPE,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from "@/types/dashboardModels";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  createContainerShared,
  createModuleShared,
  createWorksheetShared,
  deleteContainerShared,
  deleteModuleShared,
  deleteWorksheetShared,
  getAdminCacheSnapshot,
  invalidateAdminCache,
  listContainersShared,
  listModulesShared,
  listWorksheetsShared,
  listUsersWithStatusShared,
  syncUsers,
  updateContainerShared,
  updateModuleShared,
  updateWorksheetShared,
} from "@/services/dashboardDataService";
import { getPaymentRequests, updatePaymentRequestStatus } from "@/services/paymentStore";
import SummaryCard from "@/components/admin/cards/SummaryCard";
import PendingPaymentsTable from "@/components/admin/payments/PendingPaymentsTable";
import RecentActivityPanel from "@/components/admin/activity/RecentActivityPanel";
import QuickActionsCard from "@/components/admin/dashboard/QuickActionsCard";
import SalesOverviewCard from "@/components/admin/dashboard/SalesOverviewCard";
import ModuleOverviewCard from "@/components/admin/dashboard/ModuleOverviewCard";
import PaymentProofModal from "@/components/admin/payments/PaymentProofModal";
import PaymentManagementPanel from "@/components/admin/payments/PaymentManagementPanel";
import AdminPathManagement from "@/components/path/AdminPathManagement";
import { useRealtimeTables } from "@/services/realtime/useRealtimeTables";

const defaultModule = {
  moduleName: "",
  topicTitle: "",
  topicTitles: [""],
  resourceFileName: "",
  resourceFileData: "",
  resourceFileType: "",
  resourceFiles: [],
  type: MODULE_TYPE.FREE,
  status: MODULE_STATUS.ACTIVE,
};

const splitTopicTitles = (topicTitle = "") => {
  const entries = String(topicTitle)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : [""];
};

const createWorksheetRows = (count = 5) =>
  Array.from({ length: count }, () => ({ number: "", korean: "" }));

const defaultWorksheet = {
  title: "",
  accessType: MODULE_TYPE.FREE,
  resourceFileName: "",
  resourceFileData: "",
  resourceFileType: "",
  entries: createWorksheetRows(5),
};

const SECTION_ROUTES = {
  dashboard: "/admin/dashboard",
  modules: "/admin/modules",
  path: "/admin/path",
  worksheets: "/admin/worksheets",
  users: "/admin/users",
  payments: "/admin/payments",
  "sales-report": "/admin/sales-report",
};

function StatusBadge({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-600 bg-slate-800 text-slate-200",
    green: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    amber: "border-amber-500/50 bg-amber-500/15 text-amber-300",
    blue: "border-sky-500/50 bg-sky-500/15 text-sky-300",
    rose: "border-rose-500/50 bg-rose-500/15 text-rose-300",
  };

  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

import { useTheme } from "@/components/theme/ThemeProvider";

function SectionCard({ title, subtitle, children, action }) {
  const { isLight } = useTheme();
  return (
    <section className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{title}</h2>
          {subtitle && <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminWorkspace({
  initialUsers = [],
  initialSection = "dashboard",
  adminProfile = {
    displayName: "Administrator",
    email: "admin@beyond-hangeul.local",
    role: "admin",
    initials: "AD",
  },
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [modules, setModules] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState(() => getPaymentRequests());

  const [moduleForm, setModuleForm] = useState(defaultModule);
  const [worksheetForm, setWorksheetForm] = useState(defaultWorksheet);
  const [editingModule, setEditingModule] = useState(null);
  const [editingModuleLoadingId, setEditingModuleLoadingId] = useState(null);
  const [editingWorksheetId, setEditingWorksheetId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedUserAccount, setSelectedUserAccount] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [isSavingWorksheet, setIsSavingWorksheet] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);
  const [moduleFilterTab, setModuleFilterTab] = useState("all");
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true);
  const [isSavingContainer, setIsSavingContainer] = useState(false);
  const [isSavingEditedModule, setIsSavingEditedModule] = useState(false);
  const [containers, setContainers] = useState([]);
  const canCreateModule = containers.length > 0;
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleSort, setModuleSort] = useState("newest");
  const [modulePage, setModulePage] = useState(1);
  const MODULES_PER_PAGE = 20;
  const [worksheetFilterTab, setWorksheetFilterTab] = useState("all");
  const [worksheetSort, setWorksheetSort] = useState("newest");
  const [moduleActionTarget, setModuleActionTarget] = useState(null);
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  const [moduleFieldErrors, setModuleFieldErrors] = useState({
    moduleName: false,
    topicTitle: false,
    resourceFile: false,
  });
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [containerForm, setContainerForm] = useState({ id: "", title: "", subtitle: "", moduleIds: [] });
  const [editingContainer, setEditingContainer] = useState(null);

  const [moduleValidationAttempt, setModuleValidationAttempt] = useState(0);
  const [autoReactivateAfterEdit, setAutoReactivateAfterEdit] = useState(true);
  const [isCreateFileUploading, setIsCreateFileUploading] = useState(false);
  const [isEditFileUploading, setIsEditFileUploading] = useState(false);
  const [isWorksheetFileUploading, setIsWorksheetFileUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userFilterTab, setUserFilterTab] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const hasAutoMigratedRef = useRef(false);
  const realtimeReloadTimerRef = useRef(null);

  const handleAdminLogout = async () => {
    setLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const refreshAll = useCallback(async (forceReload = false) => {
    syncUsers(initialUsers);

    let fetchPromises = [];
    let sectionKeys = [];

    switch (activeSection) {
      case "modules":
        fetchPromises = [listModulesShared({ forceReload }), listContainersShared({ forceReload })];
        sectionKeys = ["modules", "containers"];
        break;
      case "path":
        fetchPromises = [listModulesShared({ forceReload }), listWorksheetsShared({ forceReload })];
        sectionKeys = ["modules", "worksheets"];
        break;
      case "worksheets":
        fetchPromises = [listWorksheetsShared({ forceReload })];
        sectionKeys = ["worksheets"];
        break;
      case "users":
        fetchPromises = [listUsersWithStatusShared(initialUsers, { forceReload })];
        sectionKeys = ["users"];
        break;
      case "payments":
        fetchPromises = [];
        sectionKeys = [];
        break;
      case "sales-report":
        fetchPromises = [listUsersWithStatusShared(initialUsers, { forceReload })];
        sectionKeys = ["users"];
        break;
      default:
        fetchPromises = [
          listModulesShared({ forceReload }),
          listUsersWithStatusShared(initialUsers, { forceReload }),
          listWorksheetsShared({ forceReload }),
          listContainersShared({ forceReload }),
        ];
        sectionKeys = ["modules", "users", "worksheets", "containers"];
        break;
    }

    const results = await Promise.allSettled(fetchPromises);
    const sectionResults = Object.fromEntries(
      sectionKeys.map((key, index) => [key, results[index]])
    );
    let refreshError = false;

    const applyRefresh = (key, setter, defaultValue = [], warnOnly = false) => {
      const result = sectionResults[key];
      if (!result) return;

      if (result.status === "fulfilled") {
        setter(result.value);
      } else {
        const logMessage = `Unable to refresh ${key}:`;
        if (warnOnly) {
          console.warn(logMessage, result.reason);
        } else {
          console.error(logMessage, result.reason);
          refreshError = true;
        }
        setter(defaultValue);
      }
    };

    applyRefresh("modules", setModules);
    applyRefresh("users", setUsers);
    applyRefresh("worksheets", setWorksheets);
    applyRefresh("containers", setContainers);
    setPaymentRequests(getPaymentRequests());

    if (refreshError) {
      setStatusMessage("Some shared admin data could not be loaded. Check backend connectivity.");
    }

    if (refreshError) {
      setStatusMessage("Some shared admin data could not be loaded. Check backend connectivity.");
    }
  }, [activeSection, initialUsers]);

  const openCreateContainerModal = () => {
    setEditingContainer(null);
    setContainerForm({ id: "", title: "", subtitle: "", moduleIds: [] });
    setIsContainerModalOpen(true);
  };

  const beginContainerEdit = (container) => {
    setEditingContainer(container);
    setContainerForm({
      id: container.id,
      title: container.title,
      subtitle: container.subtitle,
      moduleIds: container.modules.map((module) => module.id),
    });
    setIsContainerModalOpen(true);
  };

  const saveContainer = async () => {
    const trimmedTitle = containerForm.title.trim();
    const selectedModuleIds = Array.isArray(containerForm.moduleIds) ? containerForm.moduleIds : [];

    if (!trimmedTitle) {
      setStatusMessage("Container title is required.");
      return;
    }

    setIsSavingContainer(true);
    const editingContainerId = editingContainer ? containerForm.id : undefined;
    let actualContainerId = editingContainerId;

    try {
      if (editingContainer) {
        await updateContainerShared(editingContainerId, {
          title: trimmedTitle,
          subtitle: containerForm.subtitle.trim(),
        });
      } else {
        const createdContainer = await createContainerShared({
          title: trimmedTitle,
          subtitle: containerForm.subtitle.trim(),
          createdAt: new Date().toISOString(),
        });
        actualContainerId = createdContainer.id;
      }

      const moduleUpdates = modules.map((module) => {
        if (selectedModuleIds.includes(module.id)) {
          return updateModuleShared(module.id, {
            containerId: actualContainerId,
            containerTitle: trimmedTitle,
            containerSubtitle: containerForm.subtitle.trim(),
          });
        }

        if (editingContainer && module.containerId === actualContainerId) {
          return updateModuleShared(module.id, {
            containerId: null,
            containerTitle: "",
            containerSubtitle: "",
          });
        }

        return null;
      }).filter(Boolean);

      await Promise.all(moduleUpdates);
      invalidateAdminCache(["modules", "containers"]);
      await refreshAll(true);
      setStatusMessage(editingContainer ? "Container updated." : "Container created.");
      setIsContainerModalOpen(false);
      setEditingContainer(null);
    } catch (error) {
      console.error("Container save failed:", error);
      const errorText =
        error?.message ||
        error?.details ||
        error?.hint ||
        (typeof error === "object" ? JSON.stringify(error) : String(error));
      setStatusMessage(errorText || "Unable to save container.");
    } finally {
      setIsSavingContainer(false);
    }
  };

  const removeContainer = async (container) => {
    const moduleUpdates = modules
      .filter((module) => module.containerId === container.id)
      .map((module) =>
        updateModuleShared(module.id, {
          containerId: null,
          containerTitle: "",
          containerSubtitle: "",
        })
      );

    await Promise.all(moduleUpdates);
    await deleteContainerShared(container.id);
    invalidateAdminCache(["modules", "containers"]);
    setStatusMessage(`Container '${container.title}' removed.`);
    await refreshAll(true);
  };


  useEffect(() => {
    const cached = getAdminCacheSnapshot();
    if (cached.modules || cached.containers || cached.worksheets || cached.payments || cached.users) {
      if (cached.modules) setModules(cached.modules);
      if (cached.containers) setContainers(cached.containers);
      if (cached.worksheets) setWorksheets(cached.worksheets);
      if (cached.payments) setPayments(cached.payments);
      if (cached.users) setUsers(cached.users);
      setIsLoadingAdminData(false);
    }

    void refreshAll(true).finally(() => {
      setIsLoadingAdminData(false);
    });
  }, [refreshAll]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (!event.key) return;
      if (event.key.startsWith("payment:") || event.key.startsWith("users:")) {
        setPaymentRequests(getPaymentRequests());
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
    return undefined;
  }, []);

  const handleAdminRealtimeUpdate = useCallback(() => {
    if (realtimeReloadTimerRef.current) {
      clearTimeout(realtimeReloadTimerRef.current);
    }

    realtimeReloadTimerRef.current = window.setTimeout(() => {
      realtimeReloadTimerRef.current = null;
      void refreshAll();
    }, 120);
  }, [refreshAll]);

  useRealtimeTables({
    tables: [
      "learning_modules",
      "learning_worksheets",
      "learning_paths",
      "learning_path_steps",
      "payment_records",
      "user_module_access",
      "profiles",
      "learning_containers",
    ],
    channelName: "admin-workspace",
    onChange: handleAdminRealtimeUpdate,
  });

  const moduleMap = useMemo(() => new Map(modules.map((item) => [item.id, item])), [modules]);
  const moduleContainers = useMemo(() => {
    const groups = new Map();

    containers.forEach((container) => {
      groups.set(container.id, {
        id: container.id,
        title: container.title,
        subtitle: container.subtitle || "",
        modules: [],
        createdAt: container.createdAt || "",
      });
    });

    modules.forEach((module) => {
      if (!module.containerId || !module.containerTitle) return;
      const existing = groups.get(module.containerId) || {
        id: module.containerId,
        title: module.containerTitle,
        subtitle: module.containerSubtitle || "",
        modules: [],
      };
      existing.modules.push(module);
      groups.set(module.containerId, existing);
    });

    return Array.from(groups.values()).sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [modules, containers]);
  const moduleShakeClass = "motion-safe:animate-[field-shake_280ms_ease-in-out]";

  const filteredModules = useMemo(() => {
    const normalizedSearch = moduleSearch.trim().toLowerCase();
    return modules
      .filter((item) => (moduleFilterTab === "all" ? true : item.type === moduleFilterTab))
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.moduleName, item.topicTitle, item.resourceFileName].some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt || 0).getTime();
        const rightDate = new Date(right.createdAt || 0).getTime();
        return moduleSort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
      });
  }, [modules, moduleFilterTab, moduleSearch, moduleSort]);

  const modulePageCount = Math.max(1, Math.ceil(filteredModules.length / MODULES_PER_PAGE));
  const pagedModules = useMemo(
    () => filteredModules.slice((modulePage - 1) * MODULES_PER_PAGE, modulePage * MODULES_PER_PAGE),
    [filteredModules, modulePage]
  );

  useEffect(() => {
    setModulePage(1);
  }, [moduleFilterTab, moduleSearch, moduleSort]);

  const metrics = useMemo(() => {
    const paidModules = modules.filter((item) => item.type === MODULE_TYPE.PAID);
    const pendingPayments = paymentRequests.filter((item) => item.status === PAYMENT_STATUS.PENDING);
    const approvedPayments = paymentRequests.filter((item) => item.status === PAYMENT_STATUS.APPROVED);
    const premiumUsers = users.filter((user) => {
      const role = String(user.role || "user").toLowerCase();
      return role !== "admin" && (Array.isArray(user.unlockedModules) ? user.unlockedModules.length > 0 : false);
    }).length;

    return {
      moduleCount: modules.length,
      paidModuleCount: paidModules.length,
      userCount: users.length,
      premiumUsers,
      pendingPayments: pendingPayments.length,
      approvedPayments: approvedPayments.length,
    };
  }, [modules, paymentRequests, users]);

  const userAccountRows = useMemo(() => {
    return users.map((user) => {
      const role = String(user.role || "user").toLowerCase() === "admin" ? "admin" : "user";
      const isAdmin = role === "admin";
      const subscription = user.subscription || {};
      const hasActiveSubscription = !isAdmin && subscription.status === "active" && subscription.expiryDate && new Date(subscription.expiryDate) > new Date();
      const latestRequest = user.latestSubscriptionRequest || null;
      const paymentStatus = isAdmin ? "na" : hasActiveSubscription ? "active" : latestRequest?.status || "na";

      return {
        ...user,
        role,
        isAdmin,
        hasActiveSubscription,
        latestSubscriptionRequest: latestRequest,
        learningAccess: isAdmin ? "not-applicable" : hasActiveSubscription ? "premium" : "free",
        paymentStatus,
        premiumEntitlement: isAdmin ? "na" : hasActiveSubscription ? "all-premium" : "none",
      };
    });
  }, [users]);

  const usersSummary = useMemo(() => {
    const totalAccounts = userAccountRows.length;
    const adminAccounts = userAccountRows.filter((user) => user.isAdmin).length;
    const totalUsers = userAccountRows.filter((user) => !user.isAdmin).length;
    const premiumUsers = userAccountRows.filter((user) => user.learningAccess === "premium").length;

    return {
      totalAccounts,
      totalUsers,
      premiumUsers,
      adminAccounts,
    };
  }, [userAccountRows]);

  const filteredUserRows = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();

    return userAccountRows.filter((user) => {
      const matchesFilter =
        userFilterTab === "all"
          ? true
          : userFilterTab === "users"
            ? !user.isAdmin
            : userFilterTab === "admins"
              ? user.isAdmin
              : user.learningAccess === "premium";

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      return [user.name, user.email].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [userAccountRows, userFilterTab, userSearch]);

  const dashboardInsights = useMemo(() => {
    const userMap = new Map(users.map((item) => [item.id, item.name || item.email || "Learner"]));
    const resolveUserName = (payment) =>
      userMap.get(payment.userId) || payment.userEmail?.split("@")[0] || "Learner";

    const approvedPayments = paymentRequests.filter((item) => item.status === PAYMENT_STATUS.APPROVED);
    const pendingPayments = paymentRequests
      .filter((item) => item.status === PAYMENT_STATUS.PENDING)
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

    const getPaymentModuleLabel = () => "Subscription Payment";
    const amountForPayment = (payment) => Number(payment.amount || 0);
    const totalRevenue = approvedPayments.reduce((sum, payment) => sum + amountForPayment(payment), 0);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const approvedWithTime = approvedPayments.map((payment) => ({
      payment,
      timestamp: new Date(payment.approvedAt || payment.submittedAt || 0).getTime(),
      amount: amountForPayment(payment),
    }));

    const todayRevenue = approvedWithTime
      .filter((item) => item.timestamp >= startOfToday)
      .reduce((sum, item) => sum + item.amount, 0);
    const weekRevenue = approvedWithTime
      .filter((item) => item.timestamp >= sevenDaysAgo)
      .reduce((sum, item) => sum + item.amount, 0);
    const monthRevenue = approvedWithTime
      .filter((item) => item.timestamp >= monthStart)
      .reduce((sum, item) => sum + item.amount, 0);

    const modulePurchases = approvedPayments.reduce((map, payment) => {
      map.set(payment.moduleId, (map.get(payment.moduleId) || 0) + 1);
      return map;
    }, new Map());
    const mostPurchasedModuleId = [...modulePurchases.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const mostPurchasedModuleName = mostPurchasedModuleId
      ? moduleMap.get(mostPurchasedModuleId)?.moduleName || "Unknown Module"
      : "No purchases yet";

    const pendingRows = pendingPayments.map((payment) => ({
      id: payment.id,
      userName: resolveUserName(payment),
      moduleName: getPaymentModuleLabel(payment),
      dateLabel: new Date(payment.submittedAt || Date.now()).toLocaleDateString(),
      payment,
    }));

    const activities = [
      ...approvedPayments.map((payment) => ({
        id: `approved-${payment.id}`,
        timestamp: new Date(payment.approvedAt || payment.submittedAt || 0).getTime(),
        text: `${resolveUserName(payment)} payment proof approved`,
      })),
      ...pendingPayments.map((payment) => ({
        id: `pending-${payment.id}`,
        timestamp: new Date(payment.submittedAt || 0).getTime(),
        text: `${resolveUserName(payment)} submitted payment proof`,
      })),
      ...modules.map((module) => ({
        id: `module-${module.id}`,
        timestamp: new Date(module.createdAt || 0).getTime(),
        text: `Admin added new module: ${module.moduleName}`,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 14)
      .map((item) => ({
        ...item,
        timeLabel: item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now",
      }));

    return {
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingRows,
      activities,
      premiumModuleCount: modules.filter((item) => item.type === MODULE_TYPE.PAID).length,
      freeModuleCount: modules.filter((item) => item.type === MODULE_TYPE.FREE).length,
      mostPurchasedModuleName,
    };
  }, [moduleMap, modules, paymentRequests, users]);

  const formatPeso = (value) =>
    `P${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const quickActions = [
    {
      key: "create-module",
      icon: "➕",
      label: "Create Module",
      onClick: () => {
        setActiveSection("modules");
        setModuleForm(defaultModule);
        setModuleFieldErrors({ moduleName: false, topicTitle: false, resourceFile: false });
        setModuleValidationAttempt(0);
        setIsCreateModuleModalOpen(true);
        router.push("/admin/modules");
      },
    },
    {
      key: "view-users",
      icon: "👥",
      label: "View Users",
      onClick: () => {
        setActiveSection("users");
        router.push("/admin/users");
      },
    },
    {
      key: "add-worksheet",
      icon: "📝",
      label: "Add Worksheet",
      onClick: () => {
        setActiveSection("worksheets");
        setEditingWorksheetId("");
        setWorksheetForm(defaultWorksheet);
        setIsWorksheetModalOpen(true);
        router.push("/admin/worksheets");
      },
    },
    {
      key: "manage-path",
      icon: "🧭",
      label: "Manage Path",
      onClick: () => {
        setActiveSection("path");
        router.push("/admin/path");
      },
    },
  ];

  const uploadModuleFileToStorage = async (file) => {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/admin/upload-module-file", {
      method: "POST",
      body,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiError = payload?.error;
      const errorMessage = typeof apiError === "string"
        ? apiError
        : apiError?.message || "Failed to upload module file.";
      throw new Error(errorMessage);
    }

    const publicUrl = payload?.publicUrl || "";

    if (!publicUrl) {
      throw new Error("Failed to resolve uploaded module file URL.");
    }

    return publicUrl;
  };

  const getStoragePathFromPublicUrl = (publicUrl) => {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_MODULES_BUCKET || "module-files";
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!publicUrl || !url) return "";

    const prefix = `${url}/storage/v1/object/public/${bucket}/`;
    if (!publicUrl.startsWith(prefix)) return "";

    const rawPath = publicUrl.slice(prefix.length);
    return decodeURIComponent(rawPath);
  };

  const deleteModuleFileFromStorage = async (publicUrl) => {
    const storagePath = getStoragePathFromPublicUrl(publicUrl);
    if (!storagePath) return;

    const supabase = getSupabaseBrowserClient();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_MODULES_BUCKET || "module-files";
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);
    if (error) {
      throw new Error(error.message || "Failed to remove old module file from storage.");
    }
  };

  const handleModuleFileUpload = async (file, isEdit = false, replaceIndex = null) => {
    if (!file) return;
    if (isEdit) {
      setIsEditFileUploading(true);
    } else {
      setIsCreateFileUploading(true);
    }

    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedMime.includes(file.type)) {
      setStatusMessage("Only PDF, DOC, and DOCX files are supported.");
      if (!isEdit) {
        setModuleFieldErrors((prev) => ({ ...prev, resourceFile: true }));
      }
      if (isEdit) {
        setIsEditFileUploading(false);
      } else {
        setIsCreateFileUploading(false);
      }
      return;
    }

    let uploadedFileUrl = "";
    try {
      uploadedFileUrl = await uploadModuleFileToStorage(file);
    } catch (error) {
      setStatusMessage(error.message || "File upload failed. Check storage bucket and permissions.");
      if (!isEdit) {
        setModuleFieldErrors((prev) => ({ ...prev, resourceFile: true }));
      }
      if (isEdit) {
        setIsEditFileUploading(false);
      } else {
        setIsCreateFileUploading(false);
      }
      return;
    }

    const nextFile = {
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileData: uploadedFileUrl,
    };

    if (isEdit) {
      setEditingModule((prev) => {
        const existingFiles = Array.isArray(prev.resourceFiles) ? [...prev.resourceFiles] : [];

        if (replaceIndex !== null && replaceIndex >= 0 && replaceIndex < existingFiles.length) {
          existingFiles[replaceIndex] = nextFile;
        } else {
          existingFiles.push(nextFile);
        }

        return {
          ...prev,
          resourceFiles: existingFiles,
        };
      });
      setStatusMessage("Module file uploaded to storage.");
      setIsEditFileUploading(false);
      return;
    }

    setModuleForm((prev) => ({
      ...prev,
      resourceFileName: file.name,
      resourceFileType: file.type,
      resourceFileData: uploadedFileUrl,
      resourceFiles: [
        ...(Array.isArray(prev.resourceFiles) ? prev.resourceFiles : []),
        nextFile,
      ],
    }));
    setModuleFieldErrors((prev) => ({ ...prev, resourceFile: false }));
    setStatusMessage("Module file uploaded to storage.");
    setIsCreateFileUploading(false);
  };

  const beginModuleEdit = async (module) => {
    if (!module) return;
    setEditingModuleLoadingId(module.id);

    const isCurrentlyActive = (module.status || MODULE_STATUS.ACTIVE) !== MODULE_STATUS.DRAFT;
    if (isCurrentlyActive) {
      setModules((prevModules) =>
        prevModules.map((item) =>
          item.id === module.id ? { ...item, status: MODULE_STATUS.DRAFT } : item
        )
      );
    }

    try {
      if (isCurrentlyActive) {
        await updateModuleShared(module.id, { status: MODULE_STATUS.DRAFT });
      }

      const resourceFiles = Array.isArray(module.resourceFiles)
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

      const topicTitles = (module.topicTitle || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      setAutoReactivateAfterEdit(true);
      setEditingModule({
        ...module,
        status: MODULE_STATUS.DRAFT,
        resourceFiles,
        topicTitles: topicTitles.length > 0 ? topicTitles : [""],
      });
    } finally {
      setEditingModuleLoadingId(null);
    }
  };

  const saveNewModule = async (event) => {
    event.preventDefault();
    const moduleName = moduleForm.moduleName.trim();
    const topicTitles = (moduleForm.topicTitles || []).map((title) => title.trim()).filter(Boolean);
    const topicTitle = topicTitles.join("\n");
    const hasValidFile = Boolean(
      Array.isArray(moduleForm.resourceFiles) && moduleForm.resourceFiles.length > 0
    );

    const nextErrors = {
      moduleName: !moduleName,
      topicTitle: topicTitles.length === 0,
      resourceFile: !hasValidFile,
    };

    if (nextErrors.moduleName || nextErrors.topicTitle || nextErrors.resourceFile) {
      setModuleFieldErrors(nextErrors);
      setModuleValidationAttempt((prev) => prev + 1);
    }

    if (!canCreateModule) {
      setStatusMessage("Create at least one container before adding a module.");
      return;
    }

    if (!moduleName || topicTitles.length === 0 || !hasValidFile) {
      setStatusMessage("Please complete all required fields: Module Name, Title/Topic, and upload a PDF/DOC/DOCX file.");
      return;
    }

    try {
      await createModuleShared({
        ...moduleForm,
        moduleName,
        topicTitle,
        price: null,
      });
      setModuleFieldErrors({ moduleName: false, topicTitle: false, resourceFile: false });
      setModuleValidationAttempt(0);
      setModuleForm(defaultModule);
      setIsCreateModuleModalOpen(false);
      setStatusMessage("Module created.");
      await refreshAll(true);
    } catch (error) {
      setStatusMessage(error?.message || "Unable to create module. Please try again.");
    }
  };

  const saveEditedModule = async () => {
    if (!editingModule) return;
    setIsSavingEditedModule(true);

    const moduleName = editingModule.moduleName.trim();
    const topicTitles = (editingModule.topicTitles || []).map((title) => title.trim()).filter(Boolean);
    const topicTitle = topicTitles.join("\n");
    const resourceFiles = Array.isArray(editingModule.resourceFiles)
      ? editingModule.resourceFiles
      : [];

    if (!moduleName || topicTitles.length === 0 || resourceFiles.length === 0) {
      setStatusMessage("Edit requires Module Name, Title/Topic, and at least one attached file.");
      setIsSavingEditedModule(false);
      return;
    }

    try {
      await updateModuleShared(editingModule.id, {
        moduleName,
        topicTitle,
        resourceFiles,
        type: editingModule.type,
        price: null,
        status: autoReactivateAfterEdit ? MODULE_STATUS.ACTIVE : editingModule.status || MODULE_STATUS.DRAFT,
      });

      await refreshAll(true);
      setEditingModule(null);
      setStatusMessage(
        autoReactivateAfterEdit
          ? "Module updated and automatically reactivated."
          : "Module updated and kept inactive."
      );
    } catch (error) {
      setStatusMessage(error?.message || "Unable to update module. Please try again.");
    } finally {
      setIsSavingEditedModule(false);
    }
  };

  const deleteModuleWithStorage = async (module) => {
    setDeletingModuleId(module.id);
    try {
      const oldStoragePath = getStoragePathFromPublicUrl(module.resourceFileData || "");
      const otherUses = modules.some((item) => {
        if (item.id === module.id) return false;
        const modulePath = getStoragePathFromPublicUrl(item.resourceFileData || "");
        return modulePath && modulePath === oldStoragePath;
      });
      if (!otherUses) {
        await deleteModuleFileFromStorage(module.resourceFileData || "");
      }
    } catch (error) {
      setStatusMessage(error.message || "Unable to remove module file from storage.");
      setDeletingModuleId(null);
      return;
    }

    await deleteModuleShared(module.id);
    setStatusMessage("Module deleted.");
    await refreshAll();
    setDeletingModuleId(null);
  };

  const openCreateWorksheetModal = () => {
    setEditingWorksheetId("");
    setWorksheetForm(defaultWorksheet);
    setIsWorksheetModalOpen(true);
  };

  const beginWorksheetEdit = (worksheet) => {
    setEditingWorksheetId(worksheet.id);
    setWorksheetForm({
      title: worksheet.title,
      accessType: worksheet.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
      resourceFileName: String(worksheet.resourceFileName || ""),
      resourceFileData: String(worksheet.resourceFileData || ""),
      resourceFileType: String(worksheet.resourceFileType || ""),
      entries: (worksheet.entries || []).length
        ? worksheet.entries.map((entry) => ({
            number: String(entry.number || ""),
            korean: String(entry.korean || ""),
          }))
        : createWorksheetRows(5),
    });
    setIsWorksheetModalOpen(true);
  };

  const handleWorksheetFileUpload = async (file) => {
    if (!file) return;
    setIsWorksheetFileUploading(true);
    try {
      const uploadedFileUrl = await uploadModuleFileToStorage(file);
      setWorksheetForm((prev) => ({
        ...prev,
        resourceFileName: file.name,
        resourceFileType: file.type || "application/octet-stream",
        resourceFileData: String(uploadedFileUrl || ""),
      }));
      setStatusMessage("Worksheet file uploaded to storage.");
    } catch (error) {
      setStatusMessage(error?.message || "Unable to upload worksheet file.");
    } finally {
      setIsWorksheetFileUploading(false);
    }
  };

  const saveWorksheetFromModal = async (event) => {
    event.preventDefault();
    const normalizedEntries = (worksheetForm.entries || [])
      .map((row) => ({
        number: String(row.number || "").trim(),
        korean: String(row.korean || "").trim(),
      }))
      .filter((row) => row.number && row.korean);

    if (!worksheetForm.title.trim()) {
      setStatusMessage("Worksheet title is required.");
      return;
    }

    if (!normalizedEntries.length) {
      setStatusMessage("Add at least one valid English/Korean row.");
      return;
    }


    setIsSavingWorksheet(true);
    try {
      if (editingWorksheetId) {
        await updateWorksheetShared(editingWorksheetId, {
          title: worksheetForm.title.trim(),
          accessType: worksheetForm.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
          resourceFileName: worksheetForm.resourceFileName || "",
          resourceFileType: worksheetForm.resourceFileType || "",
          resourceFileData: worksheetForm.resourceFileData || "",
          entries: normalizedEntries,
        });
        setStatusMessage("Worksheet updated.");
      } else {
        await createWorksheetShared({
          title: worksheetForm.title.trim(),
          accessType: worksheetForm.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
          resourceFileName: worksheetForm.resourceFileName || "",
          resourceFileType: worksheetForm.resourceFileType || "",
          resourceFileData: worksheetForm.resourceFileData || "",
          entries: normalizedEntries,
        });
        setStatusMessage("Worksheet created.");
      }

      invalidateAdminCache(["worksheets"]);
      await refreshAll(true);
      setEditingWorksheetId("");
      setWorksheetForm(defaultWorksheet);
      setIsWorksheetModalOpen(false);
    } catch (error) {
      console.error("Worksheet save failed:", error);
      const errorText =
        error?.message ||
        error?.details ||
        error?.hint ||
        (typeof error === "object" ? JSON.stringify(error) : String(error));
      setStatusMessage(errorText || "Unable to save worksheet.");
    } finally {
      setIsSavingWorksheet(false);
    }
    void refreshAll();
  };

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon="👥" label="Total Users" value={metrics.userCount} tone="sky" isLoading={isLoadingAdminData} />
        <SummaryCard icon="�" label="Total Premium Users" value={metrics.premiumUsers} tone="emerald" isLoading={isLoadingAdminData} />
        <SummaryCard icon="�📚" label="Total Modules" value={metrics.moduleCount} tone="slate" isLoading={isLoadingAdminData} />
        <SummaryCard icon="⏳" label="Pending Payments" value={metrics.pendingPayments} tone="amber" isLoading={isLoadingAdminData} />
        <SummaryCard icon="💰" label="Total Revenue" value={formatPeso(dashboardInsights.totalRevenue)} tone="emerald" isLoading={isLoadingAdminData} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <PendingPaymentsTable
          pendingRows={dashboardInsights.pendingRows}
          onViewProof={(payment) => {
            const row = dashboardInsights.pendingRows.find((item) => item.payment.id === payment.id);
            setSelectedPayment({ ...payment, userName: row?.userName || payment.userEmail });
          }}
          onApprove={async (payment) => {
            await updatePaymentRequestStatus(payment.id, PAYMENT_STATUS.APPROVED);
            setPaymentRequests(getPaymentRequests());
            setStatusMessage("Payment confirmed and subscription activated.");
            await refreshAll();
          }}
        />
        <RecentActivityPanel activities={dashboardInsights.activities} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <QuickActionsCard actions={quickActions} isLoading={isLoadingAdminData} />
        <SalesOverviewCard
          todayRevenue={dashboardInsights.todayRevenue}
          weekRevenue={dashboardInsights.weekRevenue}
          monthRevenue={dashboardInsights.monthRevenue}
          totalRevenue={dashboardInsights.totalRevenue}
          isLoading={isLoadingAdminData}
        />
        <ModuleOverviewCard
          freeCount={dashboardInsights.freeModuleCount}
          premiumCount={dashboardInsights.premiumModuleCount}
          mostPurchased={dashboardInsights.mostPurchasedModuleName}
          isLoading={isLoadingAdminData}
        />
      </div>
    </div>
  );

  const renderModules = () => {
    const normalizedSearch = moduleSearch.trim().toLowerCase();
    const filteredModules = modules
      .filter((item) => (moduleFilterTab === "all" ? true : item.type === moduleFilterTab))
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.moduleName, item.topicTitle, item.resourceFileName].some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt || 0).getTime();
        const rightDate = new Date(right.createdAt || 0).getTime();
        return moduleSort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
      });

    const tabClasses = (tabKey) =>
      `rounded-lg border px-3 py-1.5 text-sm transition ${
        moduleFilterTab === tabKey ? "border-amber-400/80 bg-amber-500/15 text-amber-200" : "border-white/20 text-slate-300 hover:bg-white/10"
      }`;

    return (
      <div className="space-y-5">
        <SectionCard title="Modules" subtitle="Professional module management with filters, sorting, and quick actions.">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModuleForm(defaultModule);
                setModuleFieldErrors({ moduleName: false, topicTitle: false, resourceFile: false });
                setModuleValidationAttempt(0);
                setIsCreateModuleModalOpen(true);
              }}
              disabled={!canCreateModule}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-[#0b1728] ${
                canCreateModule ? "bg-amber-400 hover:bg-amber-300" : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              + Create Module
            </button>
            <button
              type="button"
              onClick={openCreateContainerModal}
              className="rounded-xl border border-white/20 bg-[#13243d] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              + Add Container
            </button>

            <input
              value={moduleSearch}
              onChange={(event) => setModuleSearch(event.target.value)}
              placeholder="Search modules..."
              className="min-w-60 flex-1 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-amber-400"
            />

            <select
              value={moduleSort}
              onChange={(event) => setModuleSort(event.target.value)}
              className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-amber-400"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setModuleFilterTab("all")} className={tabClasses("all")}>
              All
            </button>
            <button type="button" onClick={() => setModuleFilterTab(MODULE_TYPE.FREE)} className={tabClasses(MODULE_TYPE.FREE)}>
              Free
            </button>
            <button type="button" onClick={() => setModuleFilterTab(MODULE_TYPE.PAID)} className={tabClasses(MODULE_TYPE.PAID)}>
              Premium
            </button>
          </div>

          {moduleContainers.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {moduleContainers.map((container) => (
                <div key={container.id} className="rounded-2xl border border-white/10 bg-[#13243d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{container.title}</h3>
                      {container.subtitle ? <p className="mt-1 text-sm text-slate-400">{container.subtitle}</p> : null}
                      <p className="mt-2 text-xs text-slate-400">{container.modules.length} module{container.modules.length === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => beginContainerEdit(container)}
                        className="rounded-lg border border-white/20 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeContainer(container)}
                        className="rounded-lg border border-rose-500/50 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {container.modules.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      {container.modules.map((module) => (
                        <span key={module.id} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {module.moduleName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-260 text-sm">
              <thead className="bg-[#13243d] text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Module Name</th>
                  <th className="px-3 py-2 text-left">Topic / Title</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">File</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModules.length === 0 ? (
                  <tr className="border-t border-white/10 bg-[#0f1d32]">
                    <td className="px-3 py-6 text-center text-slate-400" colSpan={7}>
                      No modules found for the current filters.
                    </td>
                  </tr>
                ) : (
                  pagedModules.map((module) => {
                    const isPaid = module.type === MODULE_TYPE.PAID;
                    const rowStatus = module.status || MODULE_STATUS.ACTIVE;

                    return (
                      <tr key={module.id} className="border-t border-white/10 bg-[#0f1d32] align-top">
                        <td className="px-3 py-3 font-semibold text-white">{module.moduleName}</td>
                        <td className="px-3 py-3 text-slate-300">{module.topicTitle}</td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={isPaid ? "amber" : "green"}>{isPaid ? "Premium" : "Free"}</StatusBadge>
                        </td>
                        <td className="max-w-44 truncate px-3 py-3 text-emerald-300">{module.resourceFileName || "-"}</td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={rowStatus === MODULE_STATUS.ACTIVE ? "green" : "slate"}>
                            {rowStatus === MODULE_STATUS.ACTIVE ? "Active" : "Draft"}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="relative px-3 py-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => beginModuleEdit(module)}
                            disabled={editingModuleLoadingId === module.id}
                            className={`inline-flex items-center justify-center rounded-lg border border-white/20 p-2 text-slate-200 transition ${editingModuleLoadingId === module.id ? "cursor-wait bg-white/10" : "hover:bg-white/10"}`}
                            aria-label={`Edit module ${module.moduleName}`}
                            title="Edit module"
                          >
                            {editingModuleLoadingId === module.id ? (
                              <svg className="animate-spin h-4 w-4 text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                            ) : (
                              <Pencil size={14} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteModuleWithStorage(module)}
                            className={`inline-flex items-center justify-center rounded-lg border border-rose-500/50 p-2 text-rose-300 hover:bg-rose-500/10 ${deletingModuleId === module.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={deletingModuleId === module.id}
                            aria-label={`Delete module ${module.moduleName}`}
                            title="Delete module"
                          >
                            {deletingModuleId === module.id ? (
                              <span className="flex items-center gap-1"><svg className="animate-spin h-4 w-4 mr-1 text-rose-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Deleting...</span>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              Showing {Math.min(pagedModules.length, filteredModules.length)} of {filteredModules.length} modules
            </div>
            {modulePageCount > 1 ? (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setModulePage((page) => Math.max(1, page - 1))}
                  disabled={modulePage === 1}
                  className="rounded-lg border border-white/10 bg-[#13243d] px-3 py-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {modulePage} of {modulePageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setModulePage((page) => Math.min(modulePageCount, page + 1))}
                  disabled={modulePage === modulePageCount}
                  className="rounded-lg border border-white/10 bg-[#13243d] px-3 py-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderPath = () => (
    <AdminPathManagement modules={modules} worksheets={worksheets} onSaved={refreshAll} />
  );

  const renderWorksheets = () => (
    <SectionCard
      title="Worksheet Management"
      subtitle="Manage worksheet records and create new worksheets from a modal form."
      action={
        <button
          type="button"
          onClick={openCreateWorksheetModal}
          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0b1728] hover:bg-amber-300"
        >
          + Create Worksheet
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={worksheetSort}
          onChange={(event) => setWorksheetSort(event.target.value)}
          className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-amber-400"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
        </select>

        <div className="ml-auto flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: MODULE_TYPE.FREE, label: "Free" },
            { key: MODULE_TYPE.PAID, label: "Premium" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setWorksheetFilterTab(tab.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                worksheetFilterTab === tab.key
                  ? "border-amber-400/80 bg-amber-500/15 text-amber-200"
                  : "border-white/20 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-240 text-sm">
          <thead className="bg-[#13243d] text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Worksheet Title</th>
              <th className="px-3 py-2 text-left">Access</th>
              <th className="px-3 py-2 text-left">Rows</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {worksheets
              .filter((worksheet) =>
                worksheetFilterTab === "all"
                  ? true
                  : (worksheet.accessType || MODULE_TYPE.FREE) === worksheetFilterTab
              )
              .sort((left, right) => {
                const leftDate = new Date(left.createdAt || 0).getTime();
                const rightDate = new Date(right.createdAt || 0).getTime();
                return worksheetSort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
              }).length === 0 ? (
              <tr className="border-t border-white/10 bg-[#0f1d32]">
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  No worksheets found for the current filter.
                </td>
              </tr>
            ) : (
              worksheets
                .filter((worksheet) =>
                  worksheetFilterTab === "all"
                    ? true
                    : (worksheet.accessType || MODULE_TYPE.FREE) === worksheetFilterTab
                )
                .sort((left, right) => {
                  const leftDate = new Date(left.createdAt || 0).getTime();
                  const rightDate = new Date(right.createdAt || 0).getTime();
                  return worksheetSort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
                })
                .map((worksheet) => (
                <tr key={worksheet.id} className="border-t border-white/10 bg-[#0f1d32] align-top">
                  <td className="px-3 py-3 font-semibold text-white">{worksheet.title}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={worksheet.accessType === MODULE_TYPE.PAID ? "amber" : "green"}>
                      {worksheet.accessType === MODULE_TYPE.PAID ? "Premium" : "Free"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{(worksheet.entries || []).length}</td>
                  <td className="px-3 py-3 text-slate-300">{worksheet.createdAt ? new Date(worksheet.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => beginWorksheetEdit(worksheet)}
                        className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs hover:border-amber-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteWorksheetShared(worksheet.id);
                          setStatusMessage("Worksheet deleted.");
                          void refreshAll();
                        }}
                        className="rounded-lg border border-rose-500/50 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  const renderUsers = () => (
    <SectionCard title="Users" subtitle="Manage account roles, learning access, and premium entitlement clearly.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon="👤" label="Total Accounts" value={usersSummary.totalAccounts} tone="slate" />
        <SummaryCard icon="🧑‍🎓" label="Total Users" value={usersSummary.totalUsers} tone="sky" />
        <SummaryCard icon="💎" label="Premium Users" value={usersSummary.premiumUsers} tone="emerald" />
        <SummaryCard icon="🛡️" label="Admin Accounts" value={usersSummary.adminAccounts} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All Accounts" },
          { key: "users", label: "Users" },
          { key: "admins", label: "Admins" },
          { key: "premium", label: "Premium Users" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setUserFilterTab(tab.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              userFilterTab === tab.key
                ? "border-amber-400/80 bg-amber-500/15 text-amber-200"
                : "border-white/20 text-slate-300 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <input
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
          placeholder="Search by name or email..."
          className="ml-auto min-w-60 flex-1 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-260 text-sm">
          <thead className="bg-[#13243d] text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Learning Access</th>
              <th className="px-3 py-2 text-left">Payment Status</th>
              <th className="px-3 py-2 text-left">Premium Entitlement</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUserRows.length === 0 ? (
              <tr className="border-t border-white/10 bg-[#0f1d32]">
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  No user accounts found for the current filters.
                </td>
              </tr>
            ) : (
              filteredUserRows.map((user) => (
                <tr key={user.id} className="border-t border-white/10 bg-[#0f1d32] align-top">
                  <td className="px-3 py-3 font-semibold text-white">{user.name || "Learner"}</td>
                  <td className="px-3 py-3 text-slate-300">{user.email}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={user.isAdmin ? "amber" : "blue"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    {user.learningAccess === "premium" ? (
                      <StatusBadge tone="green">Premium Access</StatusBadge>
                    ) : user.learningAccess === "free" ? (
                      <StatusBadge tone="slate">Free Plan</StatusBadge>
                    ) : (
                      <StatusBadge tone="slate">Not Applicable</StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {user.paymentStatus === "na" ? (
                      <span className="text-slate-500">—</span>
                    ) : user.paymentStatus === "active" ? (
                      <StatusBadge tone="green">Subscribed</StatusBadge>
                    ) : user.paymentStatus === PAYMENT_STATUS.APPROVED ? (
                      <StatusBadge tone="green">Approved</StatusBadge>
                    ) : user.paymentStatus === PAYMENT_STATUS.PENDING ? (
                      <StatusBadge tone="amber">Pending</StatusBadge>
                    ) : user.paymentStatus === PAYMENT_STATUS.REJECTED ? (
                      <StatusBadge tone="rose">Rejected</StatusBadge>
                    ) : (
                      <StatusBadge tone="slate">No Record</StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {user.premiumEntitlement === "na" ? (
                      <span className="text-slate-500">—</span>
                    ) : user.premiumEntitlement === "all-premium" ? (
                      <StatusBadge tone="blue">All Premium Modules</StatusBadge>
                    ) : (
                      <StatusBadge tone="slate">None</StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUserAccount(user)}
                          className="rounded-lg border border-slate-500/70 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                        >
                          Manage
                        </button>
                      ) : user.latestSubscriptionRequest ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedPayment({ ...user.latestSubscriptionRequest, userName: user.name })}
                            className="rounded-lg border border-amber-400 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20"
                          >
                            View Request
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUserAccount(user)}
                            className="rounded-lg border border-slate-500/70 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                          >
                            View Details
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUserAccount(user)}
                          className="rounded-lg border border-slate-500/70 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  const renderPaymentManagement = () => (
    <PaymentManagementPanel />
  );

  const renderSalesReport = () => (
    <SectionCard title="Sales Report" subtitle="UI-only summary prepared for backend integration.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-white/10 bg-[#13243d] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Sales</p>
          <p className="mt-2 text-2xl font-bold">PHP 0.00</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-[#13243d] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Users</p>
          <p className="mt-2 text-2xl font-bold">{metrics.userCount}</p>
        </article>
      </div>
    </SectionCard>
  );

  const sectionRenderer = {
    dashboard: renderDashboard,
    modules: renderModules,
    path: renderPath,
    worksheets: renderWorksheets,
    users: renderUsers,
    payments: renderPaymentManagement,
    "sales-report": renderSalesReport,
  };

  const renderActiveSection = sectionRenderer[activeSection] || renderDashboard;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] min-h-dvh w-screen bg-[#07111f] text-slate-100">
      <div className="grid min-h-dvh w-full grid-cols-1 lg:h-dvh lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#0f1d32] p-4 lg:h-dvh lg:overflow-y-auto lg:p-5">
          <h1 className="px-2 text-lg font-bold text-white">Admin Panel</h1>
          <p className="px-2 pt-1 text-xs text-slate-400">Manage platform-wide content</p>

          <nav className="mt-4 space-y-1">
            {ADMIN_SECTIONS.map((item) => (
              <Link
                key={item.key}
                href={SECTION_ROUTES[item.key]}
                onClick={() => setActiveSection(item.key)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeSection === item.key ? "bg-amber-400/20 text-amber-300" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

        </aside>

        <main className="space-y-5 bg-[#0f1d32] p-4 sm:p-5 lg:h-dvh lg:overflow-y-auto lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Admin Workspace</h2>
              <p className="text-xs text-slate-400">Platform management console</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{adminProfile.displayName}</p>
              <p className="text-xs text-slate-400">{adminProfile.email}</p>
              <div className="mt-2 flex items-center justify-end gap-2">
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  {adminProfile.role}
                </span>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  disabled={loggingOut}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? "Signing Out..." : "Log Out"}
                </button>
              </div>
            </div>
          </div>

          {renderActiveSection()}
        </main>
      </div>

      {(isCreateModuleModalOpen || editingModule) && (
        <style>{`@keyframes field-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
      )}

      {isCreateModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={saveNewModule} noValidate className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
            <h3 className="text-lg font-semibold">Create Module</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div
                key={`create-module-name-${moduleFieldErrors.moduleName ? moduleValidationAttempt : 0}`}
                className={`relative ${moduleFieldErrors.moduleName ? moduleShakeClass : ""}`}
              >
                <span className="pointer-events-none absolute right-3 top-2 text-sm font-semibold text-rose-400">*</span>
                <input
                  required
                  placeholder="Module Name"
                  value={moduleForm.moduleName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setModuleForm((prev) => ({ ...prev, moduleName: value }));
                    if (value.trim()) {
                      setModuleFieldErrors((prev) => ({ ...prev, moduleName: false }));
                    }
                  }}
                  className={`w-full rounded-xl border bg-[#13243d] px-3 py-2 pr-7 outline-none focus:border-amber-400 ${
                    moduleFieldErrors.moduleName ? "border-rose-400" : "border-white/20"
                  }`}
                />
              </div>

              <div className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2">
                <p className="mb-2 text-xs text-slate-400">Type</p>
                <div className="flex gap-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="module-type"
                      checked={moduleForm.type === MODULE_TYPE.FREE}
                      onChange={() => {
                        setModuleForm((prev) => ({ ...prev, type: MODULE_TYPE.FREE }));
                      }}
                    />
                    Free
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="module-type"
                      checked={moduleForm.type === MODULE_TYPE.PAID}
                      onChange={() => setModuleForm((prev) => ({ ...prev, type: MODULE_TYPE.PAID }))}
                    />
                    Premium
                  </label>
                </div>
              </div>

              <div
                key={`create-topic-title-${moduleFieldErrors.topicTitle ? moduleValidationAttempt : 0}`}
                className={`relative md:col-span-2 ${moduleFieldErrors.topicTitle ? moduleShakeClass : ""}`}
              >
                <span className="pointer-events-none absolute right-3 top-2 text-sm font-semibold text-rose-400">*</span>
                <div className="space-y-2">
                  {(moduleForm.topicTitles || [""]).map((topic, index, allTopics) => {
                    const isLast = index === allTopics.length - 1;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          required={index === 0}
                          value={topic}
                          onChange={(event) => {
                            const nextTopicTitles = [...(moduleForm.topicTitles || [])];
                            nextTopicTitles[index] = event.target.value;
                            setModuleForm((prev) => ({ ...prev, topicTitles: nextTopicTitles }));
                            if (event.target.value.trim()) {
                              setModuleFieldErrors((prev) => ({ ...prev, topicTitle: false }));
                            }
                          }}
                          placeholder={`Topic ${index + 1}`}
                          className={`w-full rounded-xl border bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400 ${
                            moduleFieldErrors.topicTitle ? "border-rose-400" : "border-white/20"
                          }`}
                        />
                        {(moduleForm.topicTitles || []).length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextTopicTitles = [...(moduleForm.topicTitles || [])];
                              nextTopicTitles.splice(index, 1);
                              setModuleForm((prev) => ({
                                ...prev,
                                topicTitles: nextTopicTitles.length > 0 ? nextTopicTitles : [""],
                              }));
                            }}
                            className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/20"
                          >
                            −
                          </button>
                        ) : null}
                        {isLast ? (
                          <button
                            type="button"
                            onClick={() => setModuleForm((prev) => ({
                              ...prev,
                              topicTitles: [...(prev.topicTitles || []), ""],
                            }))}
                            className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-[#0b1728] hover:bg-amber-400"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Add separate topic entries to describe each section or lesson point.
                </p>
              </div>

              <select
                value={moduleForm.status || MODULE_STATUS.ACTIVE}
                onChange={(event) => setModuleForm((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
              >
                <option value={MODULE_STATUS.ACTIVE}>Active</option>
                <option value={MODULE_STATUS.DRAFT}>Draft</option>
              </select>

              <label
                key={`create-file-${moduleFieldErrors.resourceFile ? moduleValidationAttempt : 0}`}
                className={`relative md:col-span-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-[#13243d] px-3 py-3 text-sm text-slate-300 hover:border-amber-400 ${
                  moduleFieldErrors.resourceFile ? `border-rose-400 ${moduleShakeClass}` : "border-white/30"
                }`}
              >
                <div className="text-center font-semibold">Upload Module Files</div>
                <div className="mt-1 text-xs text-slate-400">
                  Select one or more PDF, DOC, or DOCX files.
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={isCreateFileUploading}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    files.forEach((file) => handleModuleFileUpload(file));
                  }}
                />
              </label>
              {isCreateFileUploading ? (
                <p className="md:col-span-2 text-xs text-amber-300">Uploading files, please wait...</p>
              ) : null}
              {Array.isArray(moduleForm.resourceFiles) && moduleForm.resourceFiles.length > 0 ? (
                <div className="md:col-span-2 rounded-lg border border-white/10 bg-[#0f1d32] px-3 py-2 text-xs text-emerald-300">
                  <div className="font-semibold">Attached files</div>
                  <div className="mt-2 space-y-1">
                    {moduleForm.resourceFiles.map((file, idx) => (
                      <div key={`${file.fileName || "file"}-${idx}`} className="truncate">
                        {file.fileName || `File ${idx + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {statusMessage ? (
                <p className="md:col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {statusMessage}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModuleModalOpen(false);
                  setModuleFieldErrors({ moduleName: false, topicTitle: false, resourceFile: false });
                }}
                disabled={isCreateFileUploading}
                className="rounded-lg border border-slate-500 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreateFileUploading}
                className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728]"
              >
                {isCreateFileUploading ? "Uploading..." : "Create Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isContainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveContainer();
            }}
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5"
          >
            <h3 className="text-lg font-semibold">{editingContainer ? "Edit Container" : "Add Container"}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                required
                placeholder="Container Title"
                value={containerForm.title}
                onChange={(event) => setContainerForm((prev) => ({ ...prev, title: event.target.value }))}
                className="md:col-span-2 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
              />
              <input
                placeholder="Container Subtitle (e.g. Week 1-2)"
                value={containerForm.subtitle}
                onChange={(event) => setContainerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="md:col-span-2 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
              />
              <div className="md:col-span-2 rounded-xl border border-white/20 bg-[#13243d] p-4">
                <p className="mb-2 text-sm text-slate-400">Select Modules</p>
                <div className="grid gap-2">
                  {modules.map((module) => (
                    <label
                      key={module.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f1d32] px-3 py-2 text-sm text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={containerForm.moduleIds.includes(module.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setContainerForm((prev) => {
                            const nextModuleIds = checked
                              ? [...prev.moduleIds, module.id]
                              : prev.moduleIds.filter((id) => id !== module.id);
                            return { ...prev, moduleIds: nextModuleIds };
                          });
                        }}
                      />
                      <span>{module.moduleName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsContainerModalOpen(false);
                  setEditingContainer(null);
                }}
                disabled={isSavingContainer}
                className="rounded-lg border border-slate-500 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingContainer}
                className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728]"
              >
                {isSavingContainer ? "Saving..." : editingContainer ? "Save Container" : "Create Container"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isWorksheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={saveWorksheetFromModal} className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
            <h3 className="text-lg font-semibold">{editingWorksheetId ? "Edit Worksheet" : "Create Worksheet"}</h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                required
                placeholder="Worksheet title"
                value={worksheetForm.title}
                onChange={(event) => setWorksheetForm((prev) => ({ ...prev, title: event.target.value }))}
                className="md:col-span-2 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
              />

              <div className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 md:col-span-2">
                <p className="mb-2 text-xs text-slate-400">Worksheet Access</p>
                <div className="flex gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="worksheet-access-type"
                      checked={worksheetForm.accessType === MODULE_TYPE.FREE}
                      onChange={() => setWorksheetForm((prev) => ({ ...prev, accessType: MODULE_TYPE.FREE }))}
                    />
                    Free
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="worksheet-access-type"
                      checked={worksheetForm.accessType === MODULE_TYPE.PAID}
                      onChange={() => setWorksheetForm((prev) => ({ ...prev, accessType: MODULE_TYPE.PAID }))}
                    />
                    Premium
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-white/20 bg-[#13243d] p-3">
                <p className="mb-2 text-xs text-slate-400">Worksheet File (optional)</p>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/30 bg-[#0f1d32] px-3 py-2 text-sm text-slate-300 hover:border-amber-400">
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    disabled={isWorksheetFileUploading}
                    onChange={(event) => handleWorksheetFileUpload(event.target.files?.[0])}
                  />
                </label>
                {isWorksheetFileUploading ? <p className="mt-2 text-xs text-amber-300">Attaching file...</p> : null}
                {worksheetForm.resourceFileName ? (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0f1d32] px-2 py-1.5 text-xs">
                    <span className="truncate text-emerald-300">{worksheetForm.resourceFileName}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWorksheetForm((prev) => ({
                          ...prev,
                          resourceFileName: "",
                          resourceFileType: "",
                          resourceFileData: "",
                        }))
                      }
                      className="rounded border border-rose-500/50 px-2 py-0.5 text-rose-300 hover:bg-rose-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-xl border border-white/10 bg-[#13243d] p-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">English / Korean Rows</p>
                  <button
                    type="button"
                    onClick={() =>
                      setWorksheetForm((prev) => ({
                        ...prev,
                        entries: [...(prev.entries || []), { number: "", korean: "" }],
                      }))
                    }
                    className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    Add Row
                  </button>
                </div>

                <div className="h-64 space-y-2 overflow-y-auto pr-1">
                  {(worksheetForm.entries || []).map((entry, index) => (
                    <div key={`worksheet-modal-row-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <input
                        placeholder="English (e.g. g, 1, A)"
                        value={entry.number}
                        onChange={(event) =>
                          setWorksheetForm((prev) => ({
                            ...prev,
                            entries: (prev.entries || []).map((row, rowIndex) =>
                              rowIndex === index ? { ...row, number: event.target.value } : row
                            ),
                          }))
                        }
                        className="rounded-lg border border-white/20 bg-[#0f1d32] px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                      <input
                        placeholder="Korean (e.g. 일, 십, 영/공)"
                        value={entry.korean}
                        onChange={(event) =>
                          setWorksheetForm((prev) => ({
                            ...prev,
                            entries: (prev.entries || []).map((row, rowIndex) =>
                              rowIndex === index ? { ...row, korean: event.target.value } : row
                            ),
                          }))
                        }
                        className="rounded-lg border border-white/20 bg-[#0f1d32] px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setWorksheetForm((prev) => {
                            const currentEntries = prev.entries || [];
                            if (currentEntries.length <= 5) {
                              const resetRow = currentEntries.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, number: "", korean: "" } : row
                              );
                              return { ...prev, entries: resetRow };
                            }

                            const nextEntries = currentEntries.filter((_, rowIndex) => rowIndex !== index);
                            return {
                              ...prev,
                              entries: nextEntries.length >= 5 ? nextEntries : [...nextEntries, ...createWorksheetRows(5 - nextEntries.length)],
                            };
                          })
                        }
                        className="rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsWorksheetModalOpen(false);
                  setEditingWorksheetId("");
                  setWorksheetForm(defaultWorksheet);
                }}
                className="rounded-lg border border-slate-500 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingWorksheet}
                className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingWorksheet
                  ? editingWorksheetId
                    ? "Saving..."
                    : "Creating..."
                  : editingWorksheetId
                  ? "Save Worksheet"
                  : "Create Worksheet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
            <h3 className="text-lg font-semibold">Edit Module</h3>
            <p className="mt-1 text-xs text-amber-300">Module is currently inactive for safe editing.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={editingModule.moduleName}
                onChange={(event) => setEditingModule((prev) => ({ ...prev, moduleName: event.target.value }))}
                className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
              />
              <div className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2">
                <p className="mb-2 text-xs text-slate-400">Type</p>
                <div className="flex gap-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="edit-module-type"
                      checked={editingModule.type === MODULE_TYPE.FREE}
                      onChange={() => setEditingModule((prev) => ({ ...prev, type: MODULE_TYPE.FREE }))}
                    />
                    Free
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="edit-module-type"
                      checked={editingModule.type === MODULE_TYPE.PAID}
                      onChange={() => setEditingModule((prev) => ({ ...prev, type: MODULE_TYPE.PAID }))}
                    />
                    Premium
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="space-y-2">
                  {(editingModule.topicTitles || [""]).map((topic, index, allTopics) => {
                    const isLast = index === allTopics.length - 1;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          required={index === 0}
                          value={topic}
                          onChange={(event) => {
                            const nextTopicTitles = [...(editingModule.topicTitles || [])];
                            nextTopicTitles[index] = event.target.value;
                            setEditingModule((prev) => ({ ...prev, topicTitles: nextTopicTitles }));
                          }}
                          placeholder={`Topic ${index + 1}`}
                          className="w-full rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
                        />
                        {allTopics.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextTopicTitles = [...(editingModule.topicTitles || [])];
                              nextTopicTitles.splice(index, 1);
                              setEditingModule((prev) => ({
                                ...prev,
                                topicTitles: nextTopicTitles.length > 0 ? nextTopicTitles : [""],
                              }));
                            }}
                            className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/20"
                          >
                            −
                          </button>
                        ) : null}
                        {isLast ? (
                          <button
                            type="button"
                            onClick={() => setEditingModule((prev) => ({
                              ...prev,
                              topicTitles: [...(prev.topicTitles || []), ""],
                            }))}
                            className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-[#0b1728] hover:bg-amber-400"
                          >
                            +
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Add separate topic entries to describe each section or lesson point.
                </p>
              </div>

              <div className="md:col-span-2 grid gap-3 md:grid-cols-3 md:items-center">
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/30 bg-[#13243d] px-4 py-3 text-sm text-slate-200 hover:border-amber-400">
                  <Upload className="mr-2 h-5 w-5 text-amber-400" />
                  <span className="font-semibold">Drop files here</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    disabled={isEditFileUploading}
                    onChange={(event) => handleModuleFileUpload(event.target.files?.[0], true)}
                  />
                </label>

                <select
                  value={editingModule.status || MODULE_STATUS.ACTIVE}
                  onChange={(event) => setEditingModule((prev) => ({ ...prev, status: event.target.value }))}
                  className="rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 outline-none focus:border-amber-400"
                >
                  <option value={MODULE_STATUS.ACTIVE}>Active</option>
                  <option value={MODULE_STATUS.DRAFT}>Draft</option>
                </select>

                <label className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#13243d] px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={autoReactivateAfterEdit}
                    onChange={(event) => setAutoReactivateAfterEdit(event.target.checked)}
                  />
                  Auto activate after save
                </label>
              </div>
              {isEditFileUploading ? (
                <p className="md:col-span-2 text-xs text-amber-300">Uploading additional file, please wait...</p>
              ) : null}
              {Array.isArray(editingModule.resourceFiles) && editingModule.resourceFiles.length > 0 ? (
                <div className="md:col-span-2 mt-1 rounded-lg border border-white/10 bg-[#0f1d32] px-3 py-2 text-xs text-emerald-300">
                  <span className="block font-semibold">Attached files</span>
                  <div className="mt-2 space-y-2">
                    {editingModule.resourceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 rounded-md bg-[#081826] px-3 py-2">
                        <span className="truncate">{file.fileName || `File ${index + 1}`}</span>
                        <label className="inline-flex cursor-pointer items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-white/10">
                          Replace
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            disabled={isEditFileUploading}
                            onChange={(event) => handleModuleFileUpload(event.target.files?.[0], true, index)}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingModule(null);
                  setAutoReactivateAfterEdit(true);
                }}
                disabled={isEditFileUploading || isSavingEditedModule}
                className="rounded-lg border border-slate-500 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedModule}
                disabled={isEditFileUploading || isSavingEditedModule}
                className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-[#0b1728]"
              >
                {isSavingEditedModule ? "Saving..." : isEditFileUploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
            <h3 className="text-lg font-semibold">Module Preview</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Name: {previewModule.moduleName}</p>
              <p>Topic: {previewModule.topicTitle}</p>
              <p>Type: {previewModule.type === MODULE_TYPE.PAID ? "Premium" : "Free"}</p>
              <p>Status: {previewModule.status || MODULE_STATUS.ACTIVE}</p>
              <p>File: {previewModule.resourceFileName || "-"}</p>
            </div>

            {previewModule.resourceFileData ? (
              <a
                href={previewModule.resourceFileData}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-lg border border-emerald-400/50 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
              >
                Open Attached File
              </a>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModule(null)}
                className="rounded-lg border border-slate-500 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Removed Module Actions modal: now edit opens directly, no preview or duplicate delete */}

      {selectedUserAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">User Details</h3>
                <p className="mt-1 text-xs text-slate-400">Account management summary</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserAccount(null)}
                className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedUserAccount.name || "Learner"}</p>
              </article>
              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-1 break-all text-sm text-slate-200">{selectedUserAccount.email}</p>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
                <div className="mt-2">
                  <StatusBadge tone={selectedUserAccount.isAdmin ? "amber" : "blue"}>
                    {selectedUserAccount.isAdmin ? "Admin" : "User"}
                  </StatusBadge>
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Learning Access</p>
                <div className="mt-2">
                  {selectedUserAccount.learningAccess === "premium" ? (
                    <StatusBadge tone="green">Premium Access</StatusBadge>
                  ) : selectedUserAccount.learningAccess === "free" ? (
                    <StatusBadge tone="slate">Free Plan</StatusBadge>
                  ) : (
                    <StatusBadge tone="slate">Not Applicable</StatusBadge>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Subscription Plan</p>
                <div className="mt-2 text-slate-200">
                  {selectedUserAccount.subscription?.planLabel || "No Plan"}
                </div>
                {selectedUserAccount.subscription?.amount != null ? (
                  <div className="mt-1 text-sm text-slate-400">₱{selectedUserAccount.subscription.amount.toFixed(2)}</div>
                ) : null}
              </article>

              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payment Status</p>
                <div className="mt-2">
                  {selectedUserAccount.paymentStatus === "na" ? (
                    <span className="text-slate-500">—</span>
                  ) : selectedUserAccount.paymentStatus === "active" ? (
                    <StatusBadge tone="green">Subscribed</StatusBadge>
                  ) : selectedUserAccount.paymentStatus === PAYMENT_STATUS.APPROVED ? (
                    <StatusBadge tone="green">Approved</StatusBadge>
                  ) : selectedUserAccount.paymentStatus === PAYMENT_STATUS.PENDING ? (
                    <StatusBadge tone="amber">Pending</StatusBadge>
                  ) : selectedUserAccount.paymentStatus === PAYMENT_STATUS.REJECTED ? (
                    <StatusBadge tone="rose">Rejected</StatusBadge>
                  ) : (
                    <StatusBadge tone="slate">No Record</StatusBadge>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#13243d] p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Premium Entitlement</p>
                <div className="mt-2">
                  {selectedUserAccount.premiumEntitlement === "na" ? (
                    <span className="text-slate-500">—</span>
                  ) : selectedUserAccount.premiumEntitlement === "all-premium" ? (
                    <StatusBadge tone="blue">All Premium Modules</StatusBadge>
                  ) : (
                    <StatusBadge tone="slate">None</StatusBadge>
                  )}
                </div>
              </article>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#13243d] p-3 text-xs text-slate-300">
              <p>
                Created: {selectedUserAccount.createdAt ? new Date(selectedUserAccount.createdAt).toLocaleString() : "-"}
              </p>
              {selectedUserAccount.latestSubscriptionRequest?.submittedAt ? (
                <p className="mt-1">
                  Latest Request: {new Date(selectedUserAccount.latestSubscriptionRequest.submittedAt).toLocaleString()} via {selectedUserAccount.latestSubscriptionRequest.methodLabel || selectedUserAccount.latestSubscriptionRequest.method}
                </p>
              ) : null}
              {selectedUserAccount.subscription?.expiryDate ? (
                <p className="mt-1">
                  Expires: {new Date(selectedUserAccount.subscription.expiryDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {selectedUserAccount.latestSubscriptionRequest && !selectedUserAccount.isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment({ ...selectedUserAccount.latestSubscriptionRequest, userName: selectedUserAccount.name });
                    setSelectedUserAccount(null);
                  }}
                  className="rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                >
                  View Request Proof
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedUserAccount(null)}
                className="rounded-lg border border-slate-500 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentProofModal
        payment={selectedPayment}
        moduleName={
          moduleMap.get(selectedPayment?.moduleId)?.moduleName || "Subscription Payment"
        }
        onClose={() => setSelectedPayment(null)}
        onApprove={async () => {
          if (!selectedPayment) return;
          await updatePaymentRequestStatus(selectedPayment.id, PAYMENT_STATUS.APPROVED);
          setPaymentRequests(getPaymentRequests());
          setSelectedPayment(null);
          setStatusMessage("Subscription approved and activated.");
          await refreshAll();
        }}
      />
    </section>
  );
}
