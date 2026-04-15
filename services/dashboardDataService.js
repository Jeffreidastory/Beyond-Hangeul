import {
  MODULE_ACCESS,
  MODULE_STATUS,
  MODULE_TYPE,
  PATH_STATUS,
  PATH_STEP_TYPE,
  PAYMENT_STATUS,
} from "@/types/dashboardModels";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const STORAGE_KEY = "bh-dashboard-data-v1";
const DASHBOARD_BLOB_STORE_KEY = "__bhDashboardBlobStore";
export const ONE_TIME_PREMIUM_MODULE_ID = "premium-all-modules";
const RESOURCE_FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024;

const RESOURCE_REFERENCES = [
  {
    id: "ref-hangul-chart",
    title: "Korean Alphabet Chart",
    description: "Quick visual chart for Hangul vowels and consonants.",
    content:
      "Hangul essentials: Basic vowels (a, eo, o, u, eu, i), consonants (g/n/d/r/m/b/s/ng/j/ch/k/t/p/h), and common combined vowels.",
  },
  {
    id: "ref-pronunciation-guide",
    title: "Pronunciation Guide",
    description: "Core pronunciation rules and practical mouth-position tips.",
    content:
      "Focus on batchim rules, aspiration contrasts, and double consonants. Practice minimal pairs daily and shadow native audio for 10 minutes.",
  },
  {
    id: "ref-grammar-cheat-sheet",
    title: "Grammar Cheat Sheet",
    description: "High-frequency sentence structures for daily Korean usage.",
    content:
      "Sentence order (SOV), particles (eun/neun, i/ga, eul/reul), polite endings (yo), tense markers, and connectors for basic conversations.",
  },
];

const runtimeGlobal = globalThis;
if (!runtimeGlobal[DASHBOARD_BLOB_STORE_KEY]) {
  runtimeGlobal[DASHBOARD_BLOB_STORE_KEY] = {
    moduleFiles: new Map(),
    paymentReceipts: new Map(),
  };
}

const blobStore = runtimeGlobal[DASHBOARD_BLOB_STORE_KEY];

const buildSeedData = () => ({
  modules: [],
  pathItems: [],
  learningPaths: [],
  worksheets: [],
  resourceFiles: [],
  resourceNotes: [],
  resourceBookmarks: [],
  resourceReferences: RESOURCE_REFERENCES,
  users: [],
  userModuleAccess: [],
  payments: [],
  moduleProgress: [],
  worksheetProgress: [],
  containers: [],
});

const parseStore = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

function isDemoSeedStore(store) {
  const demoModuleIds = new Set(["m-free-1", "m-paid-1"]);
  const demoPathIds = new Set(["path-1", "learning-path-1"]);

  const hasDemoModule = Array.isArray(store.modules) && store.modules.some((module) => demoModuleIds.has(module.id));
  const hasDemoPath = Array.isArray(store.pathItems) && store.pathItems.some((item) => demoPathIds.has(item.id));
  const hasDemoLearningPath = Array.isArray(store.learningPaths) && store.learningPaths.some((path) => demoPathIds.has(path.id));

  return hasDemoModule || hasDemoPath || hasDemoLearningPath;
}

const ensureBrowser = () => typeof window !== "undefined";

function setModuleFileBlob(moduleId, dataUrl) {
  if (!moduleId || !dataUrl) return;
  blobStore.moduleFiles.set(moduleId, dataUrl);
}

function getModuleFileBlob(moduleId) {
  return blobStore.moduleFiles.get(moduleId) || "";
}

function deleteModuleFileBlob(moduleId) {
  blobStore.moduleFiles.delete(moduleId);
}

function setPaymentReceiptBlob(paymentId, dataUrl) {
  if (!paymentId || !dataUrl) return;
  blobStore.paymentReceipts.set(paymentId, dataUrl);
}

function getPaymentReceiptBlob(paymentId) {
  return blobStore.paymentReceipts.get(paymentId) || "";
}

function deletePaymentReceiptBlob(paymentId) {
  blobStore.paymentReceipts.delete(paymentId);
}

function hydrateBlobFields(store) {
  return {
    ...store,
    modules: (store.modules || []).map((module) => ({
      ...module,
      resourceFileData: module.resourceFileData || getModuleFileBlob(module.id),
      containerId: module.containerId || "",
      containerTitle: module.containerTitle || "",
      containerSubtitle: module.containerSubtitle || "",
    })),
    payments: (store.payments || []).map((payment) => {
      const hydratedProof = payment.proofImage || payment.receiptImage || getPaymentReceiptBlob(payment.id);
      return {
        ...payment,
        amount: Number(payment.amount || 150),
        proofImage: hydratedProof,
        receiptImage: hydratedProof,
      };
    }),
  };
}

function toPersistableStore(store) {
  return {
    ...store,
    modules: (store.modules || []).map((module) => ({
      ...module,
      resourceFileData: "",
    })),
    payments: (store.payments || []).map((payment) => ({
      ...payment,
      receiptImage: "",
    })),
    containers: store.containers || [],
  };
}

function migrateBlobFieldsToRuntime(store) {
  const migrated = {
    ...store,
    modules: (store.modules || []).map((module) => {
      if (module.resourceFileData) {
        setModuleFileBlob(module.id, module.resourceFileData);
      }
      return {
        ...module,
        resourceFileData: "",
      };
    }),
    payments: (store.payments || []).map((payment) => {
      const existingProof = payment.proofImage || payment.receiptImage || "";
      if (existingProof) {
        setPaymentReceiptBlob(payment.id, existingProof);
      }
      return {
        ...payment,
        amount: Number(payment.amount || 150),
        proofImage: payment.proofImage || existingProof,
        receiptImage: "",
      };
    }),
  };

  return migrated;
}

function getStore() {
  if (!ensureBrowser()) {
    return hydrateBlobFields(buildSeedData());
  }

  const existing = parseStore(window.localStorage.getItem(STORAGE_KEY));
  if (existing) {
    const normalizedStore = {
      ...buildSeedData(),
      ...existing,
      modules: existing.modules || [],
      pathItems: existing.pathItems || [],
      learningPaths: existing.learningPaths || [],
      worksheets: existing.worksheets || [],
      resourceFiles: existing.resourceFiles || [],
      resourceNotes: existing.resourceNotes || [],
      resourceBookmarks: existing.resourceBookmarks || [],
      resourceReferences: existing.resourceReferences || RESOURCE_REFERENCES,
      users: existing.users || [],
      userModuleAccess: existing.userModuleAccess || [],
      payments: existing.payments || [],
      moduleProgress: existing.moduleProgress || [],
      worksheetProgress: existing.worksheetProgress || [],
      containers: existing.containers || [],
    };

    normalizedStore.learningPaths = (normalizedStore.learningPaths || []).map((path) => ({
      ...path,
      status: path.status || PATH_STATUS.DRAFT,
      steps: normalizePathSteps(path.steps || []),
      createdAt: path.createdAt || new Date().toISOString(),
      updatedAt: path.updatedAt || path.createdAt || new Date().toISOString(),
    }));

    if (isDemoSeedStore(normalizedStore)) {
      const clearedStore = buildSeedData();
      saveStore(clearedStore);
      return hydrateBlobFields(clearedStore);
    }

    if (!normalizedStore.learningPaths.length) {
      normalizedStore.learningPaths = buildSeedData().learningPaths;
    }

    syncPathItemsFromLearningPaths(normalizedStore);

    const migratedStore = migrateBlobFieldsToRuntime(normalizedStore);
    saveStore(migratedStore);
    return hydrateBlobFields(migratedStore);
  }

  const seed = buildSeedData();
  saveStore(seed);
  return hydrateBlobFields(seed);
}

function saveStore(store) {
  if (!ensureBrowser()) return;
  const persistable = toPersistableStore(store);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (error) {
    try {
      const fallback = {
        ...persistable,
        payments: (persistable.payments || []).slice(0, 30),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      console.warn("Failed to save dashboard store to localStorage.", error);
    }
  }
}

const randomId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

function normalizePathSteps(steps = []) {
  return (steps || []).map((step, index) => {
    const validTypes = [PATH_STEP_TYPE.MODULE, PATH_STEP_TYPE.WORKSHEET, PATH_STEP_TYPE.INFO];
    const enabledTypes = Array.isArray(step.enabledTypes)
      ? step.enabledTypes.filter((type) => validTypes.includes(type))
      : step.type
        ? [step.type]
        : [PATH_STEP_TYPE.INFO];

    const finalEnabledTypes = enabledTypes.length ? enabledTypes : [PATH_STEP_TYPE.INFO];

    const legacyLinkedIds = Array.isArray(step.linkedItemIds)
      ? step.linkedItemIds.filter(Boolean)
      : step.linkedItemId
        ? [step.linkedItemId]
        : [];

    const linkedModuleIds = Array.isArray(step.linkedModuleIds)
      ? step.linkedModuleIds.filter(Boolean)
      : step.type === PATH_STEP_TYPE.MODULE
        ? legacyLinkedIds
        : [];

    const linkedWorksheetIds = Array.isArray(step.linkedWorksheetIds)
      ? step.linkedWorksheetIds.filter(Boolean)
      : step.type === PATH_STEP_TYPE.WORKSHEET
        ? legacyLinkedIds
        : [];

    const linkedItemIds =
      finalEnabledTypes.includes(PATH_STEP_TYPE.MODULE) && linkedModuleIds.length
        ? linkedModuleIds
        : finalEnabledTypes.includes(PATH_STEP_TYPE.WORKSHEET) && linkedWorksheetIds.length
          ? linkedWorksheetIds
          : [];

    return {
      id: step.id || randomId("path-step"),
      order: index + 1,
      title: step.title || "",
      description: step.description || "",
      type: finalEnabledTypes[0] || PATH_STEP_TYPE.INFO,
      enabledTypes: finalEnabledTypes,
      linkedItemId: step.linkedItemId || linkedItemIds[0] || "",
      linkedItemIds,
      linkedModuleIds,
      linkedWorksheetIds,
      infoContent: step.infoContent || "",
    };
  });
}

function getActivePathFromStore(store) {
  const activePath = (store.learningPaths || []).find((path) => path.status === PATH_STATUS.ACTIVE);
  return activePath || (store.learningPaths || [])[0] || null;
}

function syncPathItemsFromLearningPaths(store) {
  const activePath = getActivePathFromStore(store);
  if (!activePath) {
    store.pathItems = [];
    return;
  }

  store.pathItems = (activePath.steps || []).map((step, index) => {
    const prefix = `Step ${index + 1}`;
    const baseTitle = step.title || "Untitled Step";
    const description = step.description || step.infoContent || "Path step content";

    return {
      id: `path-item-${step.id}`,
      title: `${prefix}: ${baseTitle}`,
      content: description,
      createdAt: activePath.updatedAt || activePath.createdAt || new Date().toISOString(),
    };
  });
}

function buildPathItemsFromPath(path) {
  if (!path) return [];
  return (path.steps || []).map((step, index) => {
    const prefix = `Step ${index + 1}`;
    const baseTitle = step.title || "Untitled Step";
    const description = step.description || step.infoContent || "Path step content";

    return {
      id: `path-item-${step.id}`,
      title: `${prefix}: ${baseTitle}`,
      content: description,
      createdAt: path.updatedAt || path.createdAt || new Date().toISOString(),
    };
  });
}

export function syncUsers(initialUsers = []) {
  const store = getStore();
  const userMap = new Map((store.users || []).map((user) => [user.id, user]));

  (initialUsers || []).forEach((user) => {
    const existing = userMap.get(user.id);
    userMap.set(user.id, {
      id: user.id,
      name:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.email?.split("@")[0] ||
        existing?.name ||
        "Learner",
      email: user.email,
      role: user.role || existing?.role || "user",
      createdAt: user.created_at || existing?.createdAt || new Date().toISOString(),
    });
  });

  store.users = Array.from(userMap.values());
  saveStore(store);
  return store.users;
}

export function listModules() {
  return getStore().modules;
}

export function listContainers() {
  return getStore().containers || [];
}

export function createContainer(payload) {
  const store = getStore();
  const nextContainer = {
    id: payload.id || randomId("container"),
    title: payload.title || "Untitled Container",
    subtitle: payload.subtitle || "",
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  store.containers = [...(store.containers || []), nextContainer];
  saveStore(store);
  return nextContainer;
}

export function updateContainer(containerId, patch) {
  const store = getStore();
  store.containers = (store.containers || []).map((container) =>
    container.id === containerId
      ? {
          ...container,
          ...patch,
        }
      : container
  );
  saveStore(store);
}

export function deleteContainer(containerId) {
  const store = getStore();
  store.containers = (store.containers || []).filter((container) => container.id !== containerId);
  saveStore(store);
}

export function createModule(payload) {
  const store = getStore();
  const nextModuleId = randomId("module");
  const nextModule = {
    id: nextModuleId,
    moduleName: payload.moduleName,
    topicTitle: payload.topicTitle,
    resourceFileName: payload.resourceFileName || "",
    resourceFileData: payload.resourceFileData || "",
    resourceFileType: payload.resourceFileType || "",
    type: payload.type,
    price: payload.type === MODULE_TYPE.PAID ? Number(payload.price || 0) : null,
    status: payload.status || MODULE_STATUS.ACTIVE,
    containerId: payload.containerId || "",
    containerTitle: payload.containerTitle || "",
    containerSubtitle: payload.containerSubtitle || "",
    createdAt: new Date().toISOString(),
  };

  if (nextModule.resourceFileData) {
    setModuleFileBlob(nextModuleId, nextModule.resourceFileData);
  }

  store.modules = [nextModule, ...store.modules];
  saveStore(store);
  return nextModule;
}

export function updateModule(moduleId, patch) {
  const store = getStore();
  if (patch.resourceFileData) {
    setModuleFileBlob(moduleId, patch.resourceFileData);
  }

  store.modules = store.modules.map((module) =>
    module.id === moduleId
      ? {
          ...module,
          ...patch,
        }
      : module
  );

  saveStore(store);
}

export function deleteModule(moduleId) {
  const store = getStore();
  store.modules = store.modules.filter((module) => module.id !== moduleId);
  store.userModuleAccess = store.userModuleAccess.filter((access) => access.moduleId !== moduleId);
  const deletedPayments = store.payments.filter((payment) => payment.moduleId === moduleId);
  deletedPayments.forEach((payment) => deletePaymentReceiptBlob(payment.id));
  store.payments = store.payments.filter((payment) => payment.moduleId !== moduleId);
  deleteModuleFileBlob(moduleId);
  saveStore(store);
}

export function listPathItems() {
  return getStore().pathItems;
}

export function listLearningPaths() {
  return getStore().learningPaths || [];
}

export async function listLearningPathsShared() {
  try {
    const supabase = getSupabaseBrowserClient();
    const [pathsResult, stepsResult] = await Promise.all([
      supabase
        .from("learning_paths")
        .select("id, title, description, status, created_at, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("learning_path_steps")
        .select("id, path_id, step_order, title, description, type, enabled_types, linked_item_id, linked_item_ids, linked_module_ids, linked_worksheet_ids, info_content")
        .order("step_order", { ascending: true }),
    ]);

    if (pathsResult.error) throw pathsResult.error;
    if (stepsResult.error) throw stepsResult.error;

    const stepsByPathId = (stepsResult.data || []).reduce((map, row) => {
      const current = map.get(row.path_id) || [];
      current.push({
        id: row.id,
        order: Number(row.step_order || current.length + 1),
        title: row.title || "",
        description: row.description || "",
        type: row.type || PATH_STEP_TYPE.INFO,
        enabledTypes: Array.isArray(row.enabled_types)
          ? row.enabled_types
          : row.type
            ? [row.type]
            : [PATH_STEP_TYPE.INFO],
        linkedItemId: row.linked_item_id || "",
        linkedItemIds: Array.isArray(row.linked_item_ids) ? row.linked_item_ids : [],
        linkedModuleIds: Array.isArray(row.linked_module_ids) ? row.linked_module_ids : [],
        linkedWorksheetIds: Array.isArray(row.linked_worksheet_ids) ? row.linked_worksheet_ids : [],
        infoContent: row.info_content || "",
      });
      map.set(row.path_id, current);
      return map;
    }, new Map());

    return (pathsResult.data || []).map((row) => ({
      id: row.id,
      title: row.title || "Untitled Path",
      description: row.description || "",
      status: row.status || PATH_STATUS.DRAFT,
      steps: normalizePathSteps(stepsByPathId.get(row.id) || []),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    throw normalizeError(error);
  }
}

export function getActiveLearningPath() {
  const store = getStore();
  return getActivePathFromStore(store);
}

export async function getActiveLearningPathShared() {
  const paths = await listLearningPathsShared();
  return paths.find((path) => path.status === PATH_STATUS.ACTIVE) || paths[0] || null;
}

export function saveLearningPath(payload) {
  const store = getStore();
  const normalizedSteps = normalizePathSteps(payload.steps || []);
  const nowIso = new Date().toISOString();

  const nextPath = {
    id: payload.id || randomId("learning-path"),
    title: payload.title || "Untitled Path",
    description: payload.description || "",
    status: payload.status || PATH_STATUS.DRAFT,
    steps: normalizedSteps,
    createdAt: payload.createdAt || nowIso,
    updatedAt: nowIso,
  };

  const exists = (store.learningPaths || []).some((path) => path.id === nextPath.id);
  store.learningPaths = exists
    ? store.learningPaths.map((path) =>
        path.id === nextPath.id ? { ...path, ...nextPath, createdAt: path.createdAt || nextPath.createdAt } : path
      )
    : [nextPath, ...(store.learningPaths || [])];

  if (nextPath.status === PATH_STATUS.ACTIVE) {
    store.learningPaths = store.learningPaths.map((path) =>
      path.id === nextPath.id ? path : { ...path, status: PATH_STATUS.DRAFT }
    );
  }

  syncPathItemsFromLearningPaths(store);
  saveStore(store);
  return nextPath;
}

export async function saveLearningPathShared(payload) {
  try {
    const supabase = getSupabaseBrowserClient();
    const normalizedSteps = normalizePathSteps(payload.steps || []).map((step, index) => ({ ...step, order: index + 1 }));
    const nowIso = new Date().toISOString();

    const nextPathPayload = {
      title: payload.title || "Untitled Path",
      description: payload.description || "",
      status: payload.status || PATH_STATUS.DRAFT,
      updated_at: nowIso,
    };

    let pathId = payload.id || "";

    if (pathId) {
      const { error: updateError } = await supabase.from("learning_paths").update(nextPathPayload).eq("id", pathId);
      if (updateError) throw updateError;
    } else {
      const { data: created, error: insertError } = await supabase
        .from("learning_paths")
        .insert({ ...nextPathPayload, created_at: nowIso })
        .select("id")
        .single();
      if (insertError) throw insertError;
      pathId = created.id;
    }

    if (nextPathPayload.status === PATH_STATUS.ACTIVE) {
      const { error: deactivateError } = await supabase
        .from("learning_paths")
        .update({ status: PATH_STATUS.DRAFT, updated_at: nowIso })
        .neq("id", pathId);
      if (deactivateError) throw deactivateError;
    }

    const { error: deleteStepsError } = await supabase.from("learning_path_steps").delete().eq("path_id", pathId);
    if (deleteStepsError) throw deleteStepsError;

    if (normalizedSteps.length) {
      const rows = normalizedSteps.map((step, index) => ({
        path_id: pathId,
        step_order: index + 1,
        title: step.title || "",
        description: step.description || "",
        type: step.type || PATH_STEP_TYPE.INFO,
        enabled_types: Array.isArray(step.enabledTypes) && step.enabledTypes.length ? step.enabledTypes : [step.type || PATH_STEP_TYPE.INFO],
        linked_item_id: step.linkedItemId || "",
        linked_item_ids: Array.isArray(step.linkedItemIds) ? step.linkedItemIds : [],
        linked_module_ids: Array.isArray(step.linkedModuleIds) ? step.linkedModuleIds : [],
        linked_worksheet_ids: Array.isArray(step.linkedWorksheetIds) ? step.linkedWorksheetIds : [],
        info_content: step.infoContent || "",
      }));

      const { error: insertStepsError } = await supabase.from("learning_path_steps").insert(rows);
      if (insertStepsError) throw insertStepsError;
    }

    const paths = await listLearningPathsShared();
    return paths.find((path) => path.id === pathId) || saveLearningPath(payload);
  } catch {
    return saveLearningPath(payload);
  }
}

export function deleteLearningPath(pathId) {
  const store = getStore();
  store.learningPaths = (store.learningPaths || []).filter((path) => path.id !== pathId);
  syncPathItemsFromLearningPaths(store);
  saveStore(store);
}

export async function deleteLearningPathShared(pathId) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("learning_paths").delete().eq("id", pathId);
    if (error) throw error;
  } catch {
    deleteLearningPath(pathId);
  }
}

export function createPathItem(payload) {
  const store = getStore();
  const nextItem = {
    id: randomId("path"),
    title: payload.title,
    content: payload.content,
    createdAt: new Date().toISOString(),
  };
  store.pathItems = [nextItem, ...store.pathItems];
  saveStore(store);
  return nextItem;
}

export function updatePathItem(pathId, patch) {
  const store = getStore();
  store.pathItems = store.pathItems.map((item) => (item.id === pathId ? { ...item, ...patch } : item));
  saveStore(store);
}

export function deletePathItem(pathId) {
  const store = getStore();
  store.pathItems = store.pathItems.filter((item) => item.id !== pathId);
  saveStore(store);
}

function normalizeWorksheetEntries(entries = []) {
  return (entries || [])
    .map((row) => ({
      number: String(row?.number || "").trim(),
      korean: String(row?.korean || "").trim(),
    }))
    .filter((row) => row.number && row.korean);
}

function parseWorksheetContentRows(content = "") {
  return String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s*[-:=>]\s*(.+)$/);
      if (match) {
        return {
          number: String(match[1] || "").trim(),
          korean: String(match[2] || "").trim(),
        };
      }
      return { number: "", korean: "" };
    })
    .filter((row) => row.number && row.korean);
}

function normalizeWorksheet(worksheet) {
  const normalizedEntries = normalizeWorksheetEntries(worksheet?.entries || []);
  const legacyEntries = parseWorksheetContentRows(worksheet?.content || "");
  const entries = normalizedEntries.length ? normalizedEntries : legacyEntries;
  const accessType = worksheet?.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE;

  return {
    ...worksheet,
    title: String(worksheet?.title || "Untitled Worksheet"),
    type: "writing-quiz",
    accessType,
    resourceFileName: String(worksheet?.resourceFileName || ""),
    resourceFileData: String(worksheet?.resourceFileData || ""),
    resourceFileType: String(worksheet?.resourceFileType || ""),
    entries,
    description: worksheet?.description || "",
    content: "",
  };
}

export function listWorksheets() {
  return (getStore().worksheets || []).map(normalizeWorksheet);
}

export function createWorksheet(payload) {
  const store = getStore();
  const normalizedEntries = normalizeWorksheetEntries(payload.entries || []);
  const nextSheet = {
    id: randomId("worksheet"),
    title: payload.title,
    type: "writing-quiz",
    accessType: payload.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
    resourceFileName: String(payload.resourceFileName || ""),
    resourceFileData: String(payload.resourceFileData || ""),
    resourceFileType: String(payload.resourceFileType || ""),
    entries: normalizedEntries,
    description: payload.description || "",
    content: "",
    createdAt: new Date().toISOString(),
  };

  store.worksheets = [nextSheet, ...store.worksheets];
  saveStore(store);
  return normalizeWorksheet(nextSheet);
}

export function updateWorksheet(worksheetId, patch) {
  const store = getStore();
  store.worksheets = store.worksheets.map((worksheet) =>
    worksheet.id === worksheetId
      ? {
          ...worksheet,
          ...patch,
          type: "writing-quiz",
          accessType: patch.accessType !== undefined
            ? (patch.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE)
            : (worksheet.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE),
          resourceFileName: patch.resourceFileName !== undefined
            ? String(patch.resourceFileName || "")
            : String(worksheet.resourceFileName || ""),
          resourceFileData: patch.resourceFileData !== undefined
            ? String(patch.resourceFileData || "")
            : String(worksheet.resourceFileData || ""),
          resourceFileType: patch.resourceFileType !== undefined
            ? String(patch.resourceFileType || "")
            : String(worksheet.resourceFileType || ""),
          entries:
            patch.entries !== undefined
              ? normalizeWorksheetEntries(patch.entries)
              : normalizeWorksheetEntries(worksheet.entries || parseWorksheetContentRows(worksheet.content || "")),
          content: "",
        }
      : worksheet
  );
  saveStore(store);
}

export function deleteWorksheet(worksheetId) {
  const store = getStore();
  store.worksheets = store.worksheets.filter((worksheet) => worksheet.id !== worksheetId);
  saveStore(store);
}

export function submitPaymentProof(payload) {
  const store = getStore();
  const paymentModuleId = payload.moduleId || ONE_TIME_PREMIUM_MODULE_ID;
  const existingApproved = store.payments.find(
    (item) => item.userId === payload.userId && item.status === PAYMENT_STATUS.APPROVED
  );

  if (existingApproved) {
    return {
      ...existingApproved,
      blocked: true,
      blockReason: "already-approved",
      amount: Number(existingApproved.amount || 150),
      proofImage: existingApproved.proofImage || existingApproved.receiptImage || getPaymentReceiptBlob(existingApproved.id),
      receiptImage: existingApproved.proofImage || existingApproved.receiptImage || getPaymentReceiptBlob(existingApproved.id),
    };
  }

  const existingPending = store.payments.find(
    (item) => item.userId === payload.userId && item.status === PAYMENT_STATUS.PENDING
  );

  if (existingPending) {
    return {
      ...existingPending,
      blocked: true,
      blockReason: "pending-verification",
      amount: Number(existingPending.amount || 150),
      proofImage: existingPending.proofImage || existingPending.receiptImage || getPaymentReceiptBlob(existingPending.id),
      receiptImage: existingPending.proofImage || existingPending.receiptImage || getPaymentReceiptBlob(existingPending.id),
    };
  }

  const nextPaymentId = randomId("payment");
  const nextPayment = {
    id: nextPaymentId,
    userId: payload.userId,
    userEmail: payload.userEmail,
    userName: payload.userName || payload.userEmail?.split("@")[0] || "Learner",
    moduleId: paymentModuleId,
    amount: Number(payload.amount || 150),
    method: payload.method,
    proofImage: payload.proofImage || payload.receiptImage || "",
    receiptImage: payload.proofImage || payload.receiptImage || "",
    status: PAYMENT_STATUS.PENDING,
    submittedAt: new Date().toISOString(),
  };

  if (nextPayment.proofImage) {
    setPaymentReceiptBlob(nextPaymentId, nextPayment.proofImage);
  }

  store.payments = [
    nextPayment,
    ...store.payments.filter((item) => !(item.userId === payload.userId && item.status === PAYMENT_STATUS.PENDING)),
  ];
  saveStore(store);
  return nextPayment;
}

export function approvePaymentAndGrantAccess(paymentId) {
  const store = getStore();
  const payment = store.payments.find((item) => item.id === paymentId);
  if (!payment) return;

  store.payments = store.payments.map((item) =>
    item.id === paymentId
      ? {
          ...item,
          moduleId: ONE_TIME_PREMIUM_MODULE_ID,
          status: PAYMENT_STATUS.APPROVED,
          approvedAt: new Date().toISOString(),
        }
      : item
  );

  const premiumModules = store.modules.filter((module) => module.type === MODULE_TYPE.PAID);
  premiumModules.forEach((module) => {
    const existingAccess = store.userModuleAccess.find(
      (access) => access.userId === payment.userId && access.moduleId === module.id
    );

    if (existingAccess) {
      existingAccess.status = MODULE_ACCESS.UNLOCKED;
      existingAccess.grantedAt = new Date().toISOString();
      return;
    }

    store.userModuleAccess.push({
      id: randomId("access"),
      userId: payment.userId,
      moduleId: module.id,
      status: MODULE_ACCESS.UNLOCKED,
      grantedAt: new Date().toISOString(),
    });
  });

  saveStore(store);
}

export function listUsersWithStatus(initialUsers = []) {
  const users = syncUsers(initialUsers);
  const store = getStore();

  return users.map((user) => {
    const unlockedModuleIds = new Set(
      store.userModuleAccess
        .filter((access) => access.userId === user.id && access.status === MODULE_ACCESS.UNLOCKED)
        .map((access) => access.moduleId)
    );

    const hasOneTimeApproved = store.payments.some(
      (payment) => payment.userId === user.id && payment.status === PAYMENT_STATUS.APPROVED
    );

    const autoUnlockedPremiumIds = hasOneTimeApproved
      ? store.modules.filter((module) => module.type === MODULE_TYPE.PAID).map((module) => module.id)
      : [];

    autoUnlockedPremiumIds.forEach((id) => unlockedModuleIds.add(id));

    const unlockedModules = store.modules.filter((module) => unlockedModuleIds.has(module.id));
    const pendingPayments = store.payments.filter(
      (payment) => payment.userId === user.id && payment.status === PAYMENT_STATUS.PENDING
    );
    const paymentRecords = store.payments
      .filter((payment) => payment.userId === user.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latestPayment = paymentRecords[0] || null;

    return {
      ...user,
      unlockedModules,
      pendingPayments,
      paymentRecords,
      latestPayment,
    };
  });
}

export function listPayments() {
  return getStore().payments;
}

export function getUserLearningData(userId) {
  const store = getStore();
  const activeLearningPath = getActivePathFromStore(store);
  const worksheetScores = listWorksheetProgress(userId);
  const moduleProgress = listModuleProgress(userId);

  const accessMap = new Map(
    store.userModuleAccess
      .filter((access) => access.userId === userId)
      .map((access) => [access.moduleId, access.status])
  );

  const hasOneTimeApproved = store.payments.some(
    (payment) => payment.userId === userId && payment.status === PAYMENT_STATUS.APPROVED
  );

  const modules = store.modules.map((module) => {
    const isFree = module.type === MODULE_TYPE.FREE;
    const hasPremiumUnlock = hasOneTimeApproved && module.type === MODULE_TYPE.PAID;
    const isInactive = (module.status || MODULE_STATUS.ACTIVE) !== MODULE_STATUS.ACTIVE;
    const accessStatus = isInactive
      ? MODULE_ACCESS.LOCKED
      : isFree
      ? MODULE_ACCESS.UNLOCKED
      : hasPremiumUnlock
        ? MODULE_ACCESS.UNLOCKED
      : accessMap.get(module.id) === MODULE_ACCESS.UNLOCKED
        ? MODULE_ACCESS.UNLOCKED
        : MODULE_ACCESS.LOCKED;

    return {
      ...module,
      accessStatus,
      isInactive,
      isLocked: accessStatus === MODULE_ACCESS.LOCKED,
    };
  });

  return {
    modules,
    pathItems: store.pathItems,
    activeLearningPath,
    learningPaths: store.learningPaths || [],
    worksheets: store.worksheets,
    payments: store.payments.filter((payment) => payment.userId === userId),
    moduleProgress,
    worksheetScores,
  };
}

export function getUserResourcesData(userId) {
  const store = getStore();
  const moduleMap = new Map((store.modules || []).map((module) => [module.id, module]));
  const worksheetMap = new Map((store.worksheets || []).map((sheet) => [sheet.id, sheet]));

  const files = (store.resourceFiles || [])
    .filter((file) => file.userId === userId)
    .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

  const notes = (store.resourceNotes || [])
    .filter((note) => note.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const bookmarks = (store.resourceBookmarks || [])
    .filter((bookmark) => bookmark.userId === userId)
    .map((bookmark) => {
      if (bookmark.type === "module") {
        const module = moduleMap.get(bookmark.itemId);
        return {
          ...bookmark,
          title: module?.moduleName || "Module",
          description: module?.topicTitle || "Saved module",
        };
      }

      const worksheet = worksheetMap.get(bookmark.itemId);
      return {
        ...bookmark,
        title: worksheet?.title || "Worksheet",
        description: worksheet?.description || "Saved worksheet",
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return {
    files,
    notes,
    bookmarks,
    references: store.resourceReferences || RESOURCE_REFERENCES,
  };
}

export function createResourceFile(payload) {
  const store = getStore();
  const fileSize = Number(payload.fileSize || 0);
  if (fileSize > RESOURCE_FILE_SIZE_LIMIT_BYTES) {
    return {
      error: "File exceeds 10MB limit.",
    };
  }

  const nextFile = {
    id: randomId("resource-file"),
    userId: payload.userId,
    fileName: payload.fileName,
    fileType: payload.fileType,
    fileSize,
    fileUrl: payload.fileUrl || "",
    uploadedAt: new Date().toISOString(),
  };

  store.resourceFiles = [nextFile, ...(store.resourceFiles || [])];
  saveStore(store);
  return {
    data: nextFile,
    error: null,
  };
}

export function renameResourceFile(fileId, userId, fileName) {
  const store = getStore();
  store.resourceFiles = (store.resourceFiles || []).map((file) =>
    file.id === fileId && file.userId === userId
      ? {
          ...file,
          fileName,
        }
      : file
  );
  saveStore(store);
}

export function deleteResourceFile(fileId, userId) {
  const store = getStore();
  store.resourceFiles = (store.resourceFiles || []).filter(
    (file) => !(file.id === fileId && file.userId === userId)
  );
  saveStore(store);
}

export function createResourceNote(payload) {
  const store = getStore();
  const now = new Date().toISOString();
  const nextNote = {
    id: randomId("resource-note"),
    userId: payload.userId,
    title: payload.title || "Untitled note",
    content: payload.content || "",
    updatedAt: now,
  };

  store.resourceNotes = [nextNote, ...(store.resourceNotes || [])];
  saveStore(store);
  return nextNote;
}

export function updateResourceNote(noteId, userId, patch) {
  const store = getStore();
  const now = new Date().toISOString();
  store.resourceNotes = (store.resourceNotes || []).map((note) =>
    note.id === noteId && note.userId === userId
      ? {
          ...note,
          ...patch,
          updatedAt: now,
        }
      : note
  );
  saveStore(store);
}

export function deleteResourceNote(noteId, userId) {
  const store = getStore();
  store.resourceNotes = (store.resourceNotes || []).filter(
    (note) => !(note.id === noteId && note.userId === userId)
  );
  saveStore(store);
}

export function toggleResourceBookmark(payload) {
  const store = getStore();
  const existing = (store.resourceBookmarks || []).find(
    (bookmark) =>
      bookmark.userId === payload.userId &&
      bookmark.type === payload.type &&
      bookmark.itemId === payload.itemId
  );

  if (existing) {
    store.resourceBookmarks = (store.resourceBookmarks || []).filter(
      (bookmark) => bookmark.id !== existing.id
    );
    saveStore(store);
    return { bookmarked: false, id: existing.id };
  }

  const nextBookmark = {
    id: randomId("resource-bookmark"),
    userId: payload.userId,
    type: payload.type,
    itemId: payload.itemId,
    createdAt: new Date().toISOString(),
  };

  store.resourceBookmarks = [nextBookmark, ...(store.resourceBookmarks || [])];
  saveStore(store);
  return { bookmarked: true, id: nextBookmark.id };
}

export function removeResourceBookmark(bookmarkId, userId) {
  const store = getStore();
  store.resourceBookmarks = (store.resourceBookmarks || []).filter(
    (bookmark) => !(bookmark.id === bookmarkId && bookmark.userId === userId)
  );
  saveStore(store);
}

export function listWorksheetProgress(userId) {
  const store = getStore();
  const rows = (store.worksheetProgress || []).filter((item) => item.userId === userId);

  return rows.reduce((acc, row) => {
    acc[row.worksheetId] = {
      quizPercent: Number(row.quizPercent || 0),
      writingPercent: Number(row.writingPercent || 0),
      quizComplete: Boolean(row.quizComplete),
      updatedAt: row.updatedAt || row.createdAt || null,
    };
    return acc;
  }, {});
}

export function upsertWorksheetProgress(payload) {
  const store = getStore();
  const nextRow = {
    id: randomId("worksheet-progress"),
    userId: payload.userId,
    worksheetId: payload.worksheetId,
    quizPercent: Number(payload.quizPercent || 0),
    writingPercent: Number(payload.writingPercent || 0),
    quizComplete: Boolean(payload.quizComplete),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = (store.worksheetProgress || []).findIndex(
    (item) => item.userId === payload.userId && item.worksheetId === payload.worksheetId
  );

  if (existingIndex >= 0) {
    const existing = store.worksheetProgress[existingIndex];
    store.worksheetProgress[existingIndex] = {
      ...existing,
      ...nextRow,
      id: existing.id,
      createdAt: existing.createdAt,
    };
  } else {
    store.worksheetProgress = [nextRow, ...(store.worksheetProgress || [])];
  }

  saveStore(store);
  return listWorksheetProgress(payload.userId);
}

export function listModuleProgress(userId) {
  const store = getStore();
  const rows = (store.moduleProgress || []).filter((item) => item.userId === userId);

  return rows.reduce((acc, row) => {
    acc[row.moduleId] = {
      progressPercent: Number(row.progressPercent || 0),
      completed: Boolean(row.completed),
      updatedAt: row.updatedAt || row.createdAt || null,
    };
    return acc;
  }, {});
}

export function upsertModuleProgress(payload) {
  const store = getStore();
  const normalizedPercent = Math.max(0, Math.min(100, Number(payload.progressPercent || 0)));
  const nextRow = {
    id: randomId("module-progress"),
    userId: payload.userId,
    moduleId: payload.moduleId,
    progressPercent: normalizedPercent,
    completed: Boolean(payload.completed) || normalizedPercent >= 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = (store.moduleProgress || []).findIndex(
    (item) => item.userId === payload.userId && item.moduleId === payload.moduleId
  );

  if (existingIndex >= 0) {
    const existing = store.moduleProgress[existingIndex];
    store.moduleProgress[existingIndex] = {
      ...existing,
      ...nextRow,
      id: existing.id,
      createdAt: existing.createdAt,
    };
  } else {
    store.moduleProgress = [nextRow, ...(store.moduleProgress || [])];
  }

  saveStore(store);
  return listModuleProgress(payload.userId);
}

function mapModuleRowToModel(row) {
  return {
    id: row.id,
    moduleName: row.module_name,
    topicTitle: row.topic_title,
    resourceFileName: row.resource_file_name || "",
    resourceFileData: row.resource_file_data || "",
    resourceFileType: row.resource_file_type || "",
    type: row.type || MODULE_TYPE.FREE,
    price: row.price == null ? null : Number(row.price),
    status: row.status || MODULE_STATUS.ACTIVE,
    createdAt: row.created_at,
    containerId: row.container_id || "",
    containerTitle: row.container_title || "",
    containerSubtitle: row.container_subtitle || "",
  };
}

function mapWorksheetRowToModel(row) {
  return normalizeWorksheet({
    id: row.id,
    title: row.title || "Untitled Worksheet",
    accessType: row.access_type || MODULE_TYPE.FREE,
    resourceFileName: row.resource_file_name || "",
    resourceFileData: row.resource_file_data || "",
    resourceFileType: row.resource_file_type || "",
    entries: Array.isArray(row.entries)
      ? row.entries.map((entry) => ({
          number: String(entry?.number || "").trim(),
          korean: String(entry?.korean || "").trim(),
        }))
      : [],
    description: row.description || "",
    createdAt: row.created_at || new Date().toISOString(),
  });
}

function mapPaymentRowToModel(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email || "",
    userName: row.user_name || "Learner",
    moduleId: row.module_id || ONE_TIME_PREMIUM_MODULE_ID,
    amount: Number(row.amount || 150),
    method: row.method || "GCash",
    proofImage: row.proof_image || "",
    receiptImage: row.proof_image || "",
    status: row.status || PAYMENT_STATUS.PENDING,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at || "",
  };
}

function mapAccessRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    status: row.status || MODULE_ACCESS.UNLOCKED,
    grantedAt: row.granted_at,
  };
}

function mapWorksheetProgressRow(row) {
  return {
    userId: row.user_id,
    worksheetId: row.worksheet_id,
    quizPercent: Number(row.quiz_percent || 0),
    writingPercent: Number(row.writing_percent || 0),
    quizComplete: Boolean(row.quiz_complete),
    updatedAt: row.updated_at || row.created_at || null,
  };
}

function mapModuleProgressRow(row) {
  return {
    userId: row.user_id,
    moduleId: row.module_id,
    progressPercent: Number(row.progress_percent || 0),
    completed: Boolean(row.completed),
    updatedAt: row.updated_at || row.created_at || null,
  };
}

function normalizeError(error) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error && typeof error === "object") {
    if (typeof error.message === "string" && error.message.trim()) {
      return new Error(error.message);
    }
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error(String(error));
    }
  }
  return new Error(String(error));
}

function mergeLocalModuleContainerMetadata(remoteModules) {
  const localModules = listModules();
  const localMap = new Map(localModules.map((module) => [module.id, module]));
  return remoteModules.map((module) => {
    const local = localMap.get(module.id);
    if (!local) return module;
    return {
      ...module,
      containerId: local.containerId || module.containerId || "",
      containerTitle: local.containerTitle || module.containerTitle || "",
      containerSubtitle: local.containerSubtitle || module.containerSubtitle || "",
    };
  });
}

async function fetchSharedModulesViaApi() {
  try {
    const response = await fetch("/api/shared/modules");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const apiError = payload?.error;
      const errorMessage = typeof apiError === "string" ? apiError : apiError?.message || `Shared modules API failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    const payload = await response.json();
    return (payload.modules || []).map(mapModuleRowToModel);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function listModulesShared() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("learning_modules")
      .select(
        "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    const remoteModules = (data || []).map(mapModuleRowToModel);
    return mergeLocalModuleContainerMetadata(remoteModules);
  } catch (error) {
    console.warn("listModulesShared failed, retrying with minimal module fields:", error);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: minimalError } = await supabase
        .from("learning_modules")
        .select(
          "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (!minimalError) {
        const remoteModules = (data || []).map(mapModuleRowToModel);
        return mergeLocalModuleContainerMetadata(remoteModules);
      }

      console.warn("Minimal module field query also failed, using server API fallback:", minimalError);
    } catch (fallbackError) {
      console.warn("Minimal module field retry threw error:", fallbackError);
    }

    const remoteModules = await fetchSharedModulesViaApi();
    return mergeLocalModuleContainerMetadata(remoteModules);
  }
}

export async function listWorksheetsShared() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("learning_worksheets")
      .select("id, title, access_type, resource_file_name, resource_file_data, resource_file_type, entries, description, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapWorksheetRowToModel);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createWorksheetShared(payload) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("learning_worksheets")
      .insert({
        title: payload.title || "Untitled Worksheet",
        access_type: payload.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
        resource_file_name: String(payload.resourceFileName || ""),
        resource_file_data: String(payload.resourceFileData || ""),
        resource_file_type: String(payload.resourceFileType || ""),
        entries: normalizeWorksheetEntries(payload.entries || []),
        description: String(payload.description || ""),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, title, access_type, resource_file_name, resource_file_data, resource_file_type, entries, description, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapWorksheetRowToModel(data);
  } catch {
    return createWorksheet(payload);
  }
}

export async function updateWorksheetShared(worksheetId, patch) {
  try {
    const supabase = getSupabaseBrowserClient();
    const nextPatch = {
      updated_at: new Date().toISOString(),
    };

    if (patch.title !== undefined) nextPatch.title = patch.title;
    if (patch.accessType !== undefined) nextPatch.access_type = patch.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE;
    if (patch.resourceFileName !== undefined) nextPatch.resource_file_name = String(patch.resourceFileName || "");
    if (patch.resourceFileData !== undefined) nextPatch.resource_file_data = String(patch.resourceFileData || "");
    if (patch.resourceFileType !== undefined) nextPatch.resource_file_type = String(patch.resourceFileType || "");
    if (patch.entries !== undefined) nextPatch.entries = normalizeWorksheetEntries(patch.entries || []);
    if (patch.description !== undefined) nextPatch.description = String(patch.description || "");

    const { error } = await supabase.from("learning_worksheets").update(nextPatch).eq("id", worksheetId);
    if (error) throw error;
  } catch {
    updateWorksheet(worksheetId, patch);
  }
}

export async function deleteWorksheetShared(worksheetId) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("learning_worksheets").delete().eq("id", worksheetId);
    if (error) throw error;
  } catch {
    deleteWorksheet(worksheetId);
  }
}

export async function migrateLocalWorksheetsToShared() {
  const localWorksheets = listWorksheets();
  if (!localWorksheets.length) {
    return {
      totalLocalCount: 0,
      migratedCount: 0,
      skippedCount: 0,
    };
  }

  const toSignature = (worksheet) => {
    const entries = normalizeWorksheetEntries(worksheet?.entries || []).map((entry) => ({
      number: String(entry.number || "").trim(),
      korean: String(entry.korean || "").trim(),
    }));

    return JSON.stringify({
      title: String(worksheet?.title || "").trim().toLowerCase(),
      accessType: worksheet?.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
      resourceFileName: String(worksheet?.resourceFileName || "").trim().toLowerCase(),
      entries,
      description: String(worksheet?.description || "").trim(),
    });
  };

  const supabase = getSupabaseBrowserClient();
  const { data: existingRows, error: existingError } = await supabase
    .from("learning_worksheets")
    .select("title, access_type, resource_file_name, entries, description");

  if (existingError) throw existingError;

  const existingSignatures = new Set(
    (existingRows || []).map((row) =>
      toSignature({
        title: row.title,
        accessType: row.access_type,
        resourceFileName: row.resource_file_name,
        entries: Array.isArray(row.entries) ? row.entries : [],
        description: row.description || "",
      })
    )
  );

  const rowsToInsert = localWorksheets
    .filter((worksheet) => !existingSignatures.has(toSignature(worksheet)))
    .map((worksheet) => ({
      title: worksheet.title || "Untitled Worksheet",
      access_type: worksheet.accessType === MODULE_TYPE.PAID ? MODULE_TYPE.PAID : MODULE_TYPE.FREE,
      resource_file_name: String(worksheet.resourceFileName || ""),
      resource_file_data: String(worksheet.resourceFileData || ""),
      resource_file_type: String(worksheet.resourceFileType || ""),
      entries: normalizeWorksheetEntries(worksheet.entries || []),
      description: String(worksheet.description || ""),
      created_at: worksheet.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (rowsToInsert.length) {
    const { error: insertError } = await supabase.from("learning_worksheets").insert(rowsToInsert);
    if (insertError) throw insertError;
  }

  return {
    totalLocalCount: localWorksheets.length,
    migratedCount: rowsToInsert.length,
    skippedCount: localWorksheets.length - rowsToInsert.length,
  };
}

export async function createModuleShared(payload) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("learning_modules")
    .insert({
      module_name: payload.moduleName,
      topic_title: payload.topicTitle,
      resource_file_name: payload.resourceFileName || "",
      resource_file_data: payload.resourceFileData || "",
      resource_file_type: payload.resourceFileType || "",
      type: payload.type || MODULE_TYPE.FREE,
      price: payload.type === MODULE_TYPE.PAID ? Number(payload.price || 0) : null,
      status: payload.status || MODULE_STATUS.ACTIVE,
      container_id: payload.containerId || null,
      container_title: payload.containerTitle || "",
      container_subtitle: payload.containerSubtitle || "",
    })
    .select(
      "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
    )
    .single();

  if (error) throw error;
  return mapModuleRowToModel(data);
}

async function fetchSharedContainersViaApi() {
  try {
    const response = await fetch("/api/shared/containers", {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn("fetchSharedContainersViaApi failed", response.status, response.statusText, errorText);
      return [];
    }

    const payload = await response.json().catch(() => ({}));
    return (payload.containers || []).map((row) => ({
      id: row.id,
      title: row.title || "Untitled Container",
      subtitle: row.subtitle || "",
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn("fetchSharedContainersViaApi exception:", error);
    return [];
  }
}

export async function listContainersShared() {
  return await fetchSharedContainersViaApi();
}

async function callAdminContainerApi(method, body) {
  const response = await fetch("/api/admin/containers", {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn(`callAdminContainerApi ${method} failed`, response.status, response.statusText, payload);
    throw normalizeError(payload.error || payload || `Container API ${method} failed`);
  }
  return payload;
}

export async function createContainerShared(payload) {
  const response = await callAdminContainerApi("POST", {
    title: payload.title || "Untitled Container",
    subtitle: payload.subtitle || "",
    createdAt: payload.createdAt || new Date().toISOString(),
  });

  const data = response.container;
  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle || "",
    createdAt: data.created_at,
  };
}

export async function updateContainerShared(containerId, patch) {
  await callAdminContainerApi("PATCH", {
    id: containerId,
    title: patch.title,
    subtitle: patch.subtitle,
  });
}

export async function deleteContainerShared(containerId) {
  await callAdminContainerApi("DELETE", { id: containerId });
}

export async function updateModuleShared(moduleId, patch) {
  const supabase = getSupabaseBrowserClient();
  const nextPatch = {};

  if (patch.moduleName !== undefined) nextPatch.module_name = patch.moduleName;
  if (patch.topicTitle !== undefined) nextPatch.topic_title = patch.topicTitle;
  if (patch.resourceFileName !== undefined) nextPatch.resource_file_name = patch.resourceFileName;
  if (patch.resourceFileData !== undefined) nextPatch.resource_file_data = patch.resourceFileData;
  if (patch.resourceFileType !== undefined) nextPatch.resource_file_type = patch.resourceFileType;
  if (patch.type !== undefined) nextPatch.type = patch.type;
  if (patch.price !== undefined) nextPatch.price = patch.price == null ? null : Number(patch.price);
  if (patch.status !== undefined) nextPatch.status = patch.status;
  if (patch.containerId !== undefined) nextPatch.container_id = patch.containerId || null;
  if (patch.containerTitle !== undefined) nextPatch.container_title = patch.containerTitle || "";
  if (patch.containerSubtitle !== undefined) nextPatch.container_subtitle = patch.containerSubtitle || "";

  const { error } = await supabase.from("learning_modules").update(nextPatch).eq("id", moduleId);
  if (error) throw normalizeError(error);
}

export async function deleteModuleShared(moduleId) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("learning_modules").delete().eq("id", moduleId);
  if (error) throw error;
}

export async function listPaymentsShared() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("payment_records")
      .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.warn("Payment records fetch failed, returning empty payment list:", error);
      return [];
    }
    return (data || []).map(mapPaymentRowToModel);
  } catch (error) {
    console.warn("Payment records fetch exception, returning empty payment list:", error);
    return [];
  }
}

export async function submitPaymentProofShared(payload) {
  try {
    const supabase = getSupabaseBrowserClient();
    const paymentModuleId = payload.moduleId || ONE_TIME_PREMIUM_MODULE_ID;

    const { data: approvedRows, error: approvedError } = await supabase
      .from("payment_records")
      .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
      .eq("user_id", payload.userId)
      .eq("status", PAYMENT_STATUS.APPROVED)
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (approvedError) throw approvedError;
    const approvedPayment = approvedRows?.[0];

    if (approvedPayment) {
      return {
        ...mapPaymentRowToModel(approvedPayment),
        blocked: true,
        blockReason: "already-approved",
      };
    }

    const { data: pendingRows, error: pendingError } = await supabase
      .from("payment_records")
      .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
      .eq("user_id", payload.userId)
      .eq("status", PAYMENT_STATUS.PENDING)
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (pendingError) throw pendingError;
    const pendingPayment = pendingRows?.[0];
    const incomingProof = payload.proofImage || payload.receiptImage || "";

    if (pendingPayment) {
      return {
        ...mapPaymentRowToModel(pendingPayment),
        blocked: true,
        blockReason: "pending-verification",
      };
    }

    const { data: created, error: createError } = await supabase
      .from("payment_records")
      .insert({
        user_id: payload.userId,
        user_email: payload.userEmail || "",
        user_name: payload.userName || payload.userEmail?.split("@")[0] || "Learner",
        module_id: paymentModuleId,
        amount: Number(payload.amount || 150),
        method: payload.method,
        proof_image: incomingProof,
        status: PAYMENT_STATUS.PENDING,
      })
      .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
      .single();

    if (createError) throw createError;
    return mapPaymentRowToModel(created);
  } catch {
    return submitPaymentProof(payload);
  }
}

export async function approvePaymentAndGrantAccessShared(paymentId) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: paymentRow, error: paymentError } = await supabase
      .from("payment_records")
      .select("id, user_id")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!paymentRow) return;

    const { error: updateError } = await supabase
      .from("payment_records")
      .update({
        module_id: ONE_TIME_PREMIUM_MODULE_ID,
        status: PAYMENT_STATUS.APPROVED,
        approved_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (updateError) throw updateError;

    const { data: premiumModules, error: moduleError } = await supabase
      .from("learning_modules")
      .select("id")
      .eq("type", MODULE_TYPE.PAID);

    if (moduleError) throw moduleError;

    if ((premiumModules || []).length) {
      const rows = premiumModules.map((module) => ({
        user_id: paymentRow.user_id,
        module_id: module.id,
        status: MODULE_ACCESS.UNLOCKED,
        granted_at: new Date().toISOString(),
      }));

      const { error: accessError } = await supabase
        .from("user_module_access")
        .upsert(rows, { onConflict: "user_id,module_id" });

      if (accessError) throw accessError;
    }
  } catch {
    approvePaymentAndGrantAccess(paymentId);
  }
}

export async function listUsersWithStatusShared(initialUsers = []) {
  const users = syncUsers(initialUsers);

  try {
    const supabase = getSupabaseBrowserClient();
    const [paymentsResult, accessResult, modulesResult] = await Promise.all([
      supabase
        .from("payment_records")
        .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("user_module_access")
        .select("id, user_id, module_id, status, granted_at"),
      supabase
        .from("learning_modules")
        .select(
          "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
        ),
    ]);

    const payments = paymentsResult.error ? [] : (paymentsResult.data || []).map(mapPaymentRowToModel);
    if (paymentsResult.error) {
      console.warn("Ignoring payment fetch failure in shared user status:", paymentsResult.error);
    }

    const accessRows = accessResult.error ? [] : (accessResult.data || []).map(mapAccessRow);
    if (accessResult.error) {
      console.warn("Ignoring module access fetch failure in shared user status:", accessResult.error);
    }

    const modules = modulesResult.error ? [] : (modulesResult.data || []).map(mapModuleRowToModel);
    if (modulesResult.error) {
      console.warn("Ignoring module fetch failure in shared user status:", modulesResult.error);
    }

    return users.map((user) => {
      const unlockedModuleIds = new Set(
        accessRows
          .filter((access) => access.userId === user.id && access.status === MODULE_ACCESS.UNLOCKED)
          .map((access) => access.moduleId)
      );

      const hasOneTimeApproved = payments.some(
        (payment) => payment.userId === user.id && payment.status === PAYMENT_STATUS.APPROVED
      );

      if (hasOneTimeApproved) {
        modules
          .filter((module) => module.type === MODULE_TYPE.PAID)
          .forEach((module) => unlockedModuleIds.add(module.id));
      }

      const unlockedModules = modules.filter((module) => unlockedModuleIds.has(module.id));
      const pendingPayments = payments.filter(
        (payment) => payment.userId === user.id && payment.status === PAYMENT_STATUS.PENDING
      );
      const paymentRecords = payments
        .filter((payment) => payment.userId === user.id)
        .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

      return {
        ...user,
        unlockedModules,
        pendingPayments,
        paymentRecords,
        latestPayment: paymentRecords[0] || null,
      };
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getUserLearningDataShared(userId) {
  try {
    const supabase = getSupabaseBrowserClient();
    const [modulesResult, accessResult, paymentsResult, sharedPaths, sharedWorksheets, containersResult] = await Promise.all([
      supabase
        .from("learning_modules")
        .select(
          "id, module_name, topic_title, resource_file_name, resource_file_data, resource_file_type, type, price, status, created_at, container_id, container_title, container_subtitle"
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("user_module_access")
        .select("id, user_id, module_id, status, granted_at")
        .eq("user_id", userId),
      supabase
        .from("payment_records")
        .select("id, user_id, user_email, user_name, module_id, amount, method, proof_image, status, submitted_at, approved_at")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false }),
      listLearningPathsShared(),
      listWorksheetsShared(),
      listContainersShared(),
    ]);

    if (modulesResult.error) throw modulesResult.error;
    if (accessResult.error) throw accessResult.error;

    const modules = (modulesResult.data || []).map(mapModuleRowToModel);
    const accessRows = (accessResult.data || []).map(mapAccessRow);
    const payments = paymentsResult.error ? [] : (paymentsResult.data || []).map(mapPaymentRowToModel);
    if (paymentsResult.error) {
      console.warn("Ignoring payment fetch failure in user learning data:", paymentsResult.error);
    }

    const containers = (containersResult || []).map((row) => ({
      id: row.id,
      title: row.title || "Untitled Container",
      subtitle: row.subtitle || "",
      createdAt: row.created_at,
    }));
    const activeLearningPath = sharedPaths.find((path) => path.status === PATH_STATUS.ACTIVE) || sharedPaths[0] || null;
    const pathItems = buildPathItemsFromPath(activeLearningPath);
    let worksheetScores = {};
    let moduleProgress = {};

    try {
      const [worksheetResult, moduleResult] = await Promise.all([
        supabase
          .from("worksheet_progress")
          .select("user_id, worksheet_id, quiz_percent, writing_percent, quiz_complete, created_at, updated_at")
          .eq("user_id", userId),
        supabase
          .from("module_progress")
          .select("user_id, module_id, progress_percent, completed, created_at, updated_at")
          .eq("user_id", userId),
      ]);

      if (!worksheetResult.error) {
        worksheetScores = (worksheetResult.data || [])
          .map(mapWorksheetProgressRow)
          .reduce((acc, row) => {
            acc[row.worksheetId] = {
              quizPercent: row.quizPercent,
              writingPercent: row.writingPercent,
              quizComplete: row.quizComplete,
              updatedAt: row.updatedAt,
            };
            return acc;
          }, {});
      }

      if (!moduleResult.error) {
        moduleProgress = (moduleResult.data || [])
          .map(mapModuleProgressRow)
          .reduce((acc, row) => {
            acc[row.moduleId] = {
              progressPercent: row.progressPercent,
              completed: row.completed,
              updatedAt: row.updatedAt,
            };
            return acc;
          }, {});
      }
    } catch {
      worksheetScores = {};
      moduleProgress = {};
    }

    const accessMap = new Map(
      accessRows
        .filter((access) => access.userId === userId)
        .map((access) => [access.moduleId, access.status])
    );

    const hasOneTimeApproved = payments.some((payment) => payment.status === PAYMENT_STATUS.APPROVED);

    const modulesWithAccess = modules.map((module) => {
      const isFree = module.type === MODULE_TYPE.FREE;
      const hasPremiumUnlock = hasOneTimeApproved && module.type === MODULE_TYPE.PAID;
      const isInactive = (module.status || MODULE_STATUS.ACTIVE) !== MODULE_STATUS.ACTIVE;
      const accessStatus = isInactive
        ? MODULE_ACCESS.LOCKED
        : isFree
          ? MODULE_ACCESS.UNLOCKED
          : hasPremiumUnlock
            ? MODULE_ACCESS.UNLOCKED
            : accessMap.get(module.id) === MODULE_ACCESS.UNLOCKED
              ? MODULE_ACCESS.UNLOCKED
              : MODULE_ACCESS.LOCKED;

      return {
        ...module,
        accessStatus,
        isInactive,
        isLocked: accessStatus === MODULE_ACCESS.LOCKED,
      };
    });

    return {
      modules: modulesWithAccess,
      pathItems,
      activeLearningPath,
      learningPaths: sharedPaths,
      worksheets: sharedWorksheets,
      payments,
      moduleProgress,
      worksheetScores,
      containers,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function upsertWorksheetProgressShared(payload) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("worksheet_progress")
      .upsert(
        {
          user_id: payload.userId,
          worksheet_id: payload.worksheetId,
          quiz_percent: Number(payload.quizPercent || 0),
          writing_percent: Number(payload.writingPercent || 0),
          quiz_complete: Boolean(payload.quizComplete),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,worksheet_id" }
      );

    if (error) throw error;
  } catch {
    upsertWorksheetProgress(payload);
  }
}

export async function upsertModuleProgressShared(payload) {
  try {
    const supabase = getSupabaseBrowserClient();
    const progressPercent = Math.max(0, Math.min(100, Number(payload.progressPercent || 0)));
    const { error } = await supabase
      .from("module_progress")
      .upsert(
        {
          user_id: payload.userId,
          module_id: payload.moduleId,
          progress_percent: progressPercent,
          completed: Boolean(payload.completed) || progressPercent >= 100,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,module_id" }
      );

    if (error) throw error;
  } catch {
    upsertModuleProgress(payload);
  }
}
