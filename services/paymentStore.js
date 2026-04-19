import { PAYMENT_STATUS } from "@/types/dashboardModels";

const DEFAULT_PLANS = [
  {
    id: "lifetime",
    name: "Lifetime Access",
    price: 349,
    billingCycle: "lifetime",
    label: "Lifetime Access",
    description: "One-time payment for lifetime premium access to all content.",
    featured: true,
  },
];

const DEFAULT_METHODS = [
  {
    id: "gcash",
    name: "GCash",
    accountName: "Aira Mae Araneta",
    accountNumber: "09089740724",
    type: "e-wallet",
    label: "GCash",
    qrCode: "",
  },
  {
    id: "maya",
    name: "Maya",
    accountName: "Beyond Hangul",
    accountNumber: "09171234567",
    type: "e-wallet",
    label: "Maya",
  },
  {
    id: "bdo",
    name: "BDO",
    accountName: "Beyond Hangul",
    accountNumber: "1234567890",
    type: "bank",
    label: "BDO",
  },
];

let paymentPlans = [...DEFAULT_PLANS];
let paymentMethods = [...DEFAULT_METHODS];
let paymentRequests = [];
const userSubscriptions = new Map();

export function clearLocalPaymentStore() {
  paymentPlans = [...DEFAULT_PLANS];
  paymentMethods = [...DEFAULT_METHODS];
  paymentRequests = [];
  userSubscriptions.clear();

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem("payment:plans");
      window.localStorage.removeItem("payment:methods");
      window.localStorage.removeItem("payment:requests");
      window.localStorage.removeItem("bh-dashboard-data-v1");

      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (typeof key === "string" && key.startsWith("users:") && key.endsWith(":subscription")) {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore cleanup failures
    }
  }
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePlan(plan) {
  return {
    id: String(plan?.id || "lifetime"),
    name: String(plan?.name || "Lifetime Access"),
    price: Number(plan?.price || 349),
    billingCycle: String(plan?.billingCycle || "lifetime"),
    label: String(plan?.label || (plan?.name || "Lifetime Access")),
    description: String(plan?.description || ""),
    featured: Boolean(plan?.featured),
  };
}

function normalizeMethod(method) {
  return {
    id: String(method?.id || randomId("method")),
    name: String(method?.name || "Payment Method"),
    accountName: String(method?.accountName || ""),
    accountNumber: String(method?.accountNumber || ""),
    type: String(method?.type || "e-wallet"),
    label: String(method?.label || String(method?.name || "Payment Method")),
    qrCode: String(method?.qrCode || ""),
  };
}

function normalizeRequest(request) {
  const normalized = {
    id: String(request?.id || randomId("payment")),
    userId: String(request?.userId || ""),
    userEmail: String(request?.userEmail || ""),
    userName: String(request?.userName || request?.userEmail?.split("@")[0] || "Learner"),
    planId: String(request?.planId || "lifetime"),
    planLabel: String(request?.planLabel || "Lifetime Access"),
    amount: Number(request?.amount || 0),
    methodId: String(request?.methodId || "gcash"),
    methodLabel: String(request?.methodLabel || "GCash"),
    reference: String(request?.reference || ""),
    proofImage: String(request?.proofImage || ""),
    status: String(request?.status || PAYMENT_STATUS.PENDING),
    submittedAt: String(request?.submittedAt || new Date().toISOString()),
    approvedAt: request?.approvedAt ? String(request.approvedAt) : null,
    rejectedAt: request?.rejectedAt ? String(request.rejectedAt) : null,
    expiryDate: request?.expiryDate ? String(request.expiryDate) : null,
  };

  return normalizeLegacyPayment(normalized);
}

const LEGACY_PLAN_IDS = new Set(["monthly", "yearly"]);

function normalizeLegacyPayment(record) {
  const label = String(record?.planLabel || "").toLowerCase();
  const numericPlanId = String(record?.planId || "").toLowerCase();
  const isLegacy = isLegacyPlanId(numericPlanId) || /(monthly|yearly)/i.test(label);

  if (!isLegacy) {
    return record;
  }

  return {
    ...record,
    planId: "lifetime",
    planLabel: "Lifetime Access",
    amount: 349,
    expiryDate: record.status === PAYMENT_STATUS.APPROVED ? null : record.expiryDate,
  };
}

function normalizeSubscription(subscription) {
  const normalized = {
    status: String(subscription?.status || "inactive"),
    planId: subscription?.planId ? String(subscription.planId) : null,
    planLabel: subscription?.planLabel ? String(subscription.planLabel) : null,
    expiryDate: subscription?.expiryDate ? String(subscription.expiryDate) : null,
    amount: Number(subscription?.amount || 0),
    reference: subscription?.reference ? String(subscription.reference) : "",
    requestId: subscription?.requestId ? String(subscription.requestId) : null,
    submittedAt: subscription?.submittedAt ? String(subscription.submittedAt) : null,
    approvedAt: subscription?.approvedAt ? String(subscription.approvedAt) : null,
    rejectedAt: subscription?.rejectedAt ? String(subscription.rejectedAt) : null,
    updatedAt: subscription?.updatedAt ? String(subscription.updatedAt) : null,
  };

  return normalizeLegacyPayment(normalized);
}

function isLegacyPlanId(planId) {
  return LEGACY_PLAN_IDS.has(String(planId || "").toLowerCase());
}

function cleanLegacyRequests(requests = []) {
  const cleaned = (requests || []).filter((request) => !isLegacyPlanId(request.planId));
  if (cleaned.length !== (requests || []).length) {
    savePaymentRequests(cleaned);
  }
  return cleaned;
}

function cleanLegacySubscription(userId, subscription) {
  if (!subscription || !isLegacyPlanId(subscription.planId)) {
    return subscription;
  }

  const cleared = normalizeSubscription(null);
  userSubscriptions.set(userId, cleared);
  return cleared;
}

function loadList(key, fallback) {
  return fallback;
}

export function getPaymentPlans() {
  if (!paymentPlans || !paymentPlans.length) {
    paymentPlans = [...DEFAULT_PLANS];
  }

  const normalized = paymentPlans.map(normalizePlan);
  const lifetimeOnly = normalized
    .filter((plan) => plan.billingCycle === "lifetime" || plan.id === "lifetime")
    .map((plan) => ({
      ...plan,
      id: "lifetime",
      name: "Lifetime Access",
      label: "Lifetime Access",
      price: 349,
      billingCycle: "lifetime",
      description: "One-time payment for lifetime premium access to all content.",
      featured: true,
    }));

  if (!lifetimeOnly.length) {
    paymentPlans = [...DEFAULT_PLANS];
    return DEFAULT_PLANS;
  }

  if (lifetimeOnly.length !== normalized.length) {
    paymentPlans = lifetimeOnly;
  }

  return lifetimeOnly;
}

export function savePaymentPlans(plans = []) {
  paymentPlans = (plans || []).map(normalizePlan);
  return paymentPlans;
}

export function getPaymentMethods() {
  if (!paymentMethods || !paymentMethods.length) {
    paymentMethods = [...DEFAULT_METHODS];
  }
  return paymentMethods.map(normalizeMethod);
}

export function savePaymentMethods(methods = []) {
  paymentMethods = (methods || []).map(normalizeMethod);
  return paymentMethods;
}

export function getPaymentRequests() {
  return (paymentRequests || []).map(normalizeRequest).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function savePaymentRequests(requests = []) {
  paymentRequests = (requests || []).map(normalizeRequest);
  return paymentRequests;
}

export function getUserSubscription(userId) {
  if (!userId) return normalizeSubscription(null);
  const subscription = userSubscriptions.get(userId);
  return cleanLegacySubscription(userId, normalizeSubscription(subscription || null));
}

export function saveUserSubscription(userId, subscription) {
  if (!userId) return normalizeSubscription(null);
  const normalized = normalizeSubscription(subscription);
  userSubscriptions.set(userId, normalized);
  return normalized;
}

export function addPaymentRequest(payload = {}) {
  const requests = getPaymentRequests();
  const subscription = getUserSubscription(payload.userId);

  const existingPending = requests.find(
    (item) => item.userId === payload.userId && item.status === PAYMENT_STATUS.PENDING,
  );
  if (existingPending) {
    return {
      ...existingPending,
      blocked: true,
      blockReason: "pending-verification",
    };
  }

  const planId = String(payload.planId || "lifetime");
  const plan = normalizePlan(payload.plan || { id: planId, ...DEFAULT_PLANS.find((item) => item.id === planId) });
  const method = normalizeMethod(payload.method || { id: String(payload.methodId || "gcash"), name: String(payload.methodLabel || "GCash") });

  const nextRequest = normalizeRequest({
    id: randomId("payment"),
    userId: String(payload.userId || ""),
    userEmail: String(payload.userEmail || ""),
    userName: String(payload.userName || payload.userEmail?.split("@")[0] || "Learner"),
    planId: plan.id,
    planLabel: plan.label,
    amount: Number(payload.amount || plan.price || 0),
    methodId: method.id,
    methodLabel: method.label,
    reference: String(payload.reference || ""),
    proofImage: String(payload.proofImage || ""),
    status: PAYMENT_STATUS.PENDING,
    submittedAt: new Date().toISOString(),
  });

  savePaymentRequests([nextRequest, ...requests.filter((item) => item.id !== nextRequest.id)]);
  saveUserSubscription(payload.userId, {
    status: PAYMENT_STATUS.PENDING,
    planId: nextRequest.planId,
    planLabel: nextRequest.planLabel,
    amount: nextRequest.amount,
    reference: nextRequest.reference,
    requestId: nextRequest.id,
    submittedAt: nextRequest.submittedAt,
    updatedAt: new Date().toISOString(),
  });

  return nextRequest;
}

export function updatePaymentRequestStatus(requestId, nextStatus) {
  const requests = getPaymentRequests();
  const request = requests.find((item) => item.id === requestId);
  if (!request) return null;

  const updatedRequest = { ...request };
  const now = new Date().toISOString();
  const planId = updatedRequest.planId || "monthly";

  if (nextStatus === PAYMENT_STATUS.APPROVED) {
    let expiry = null;
    if (planId === "yearly") {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + 365);
    } else if (planId === "monthly") {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
    }
    updatedRequest.status = PAYMENT_STATUS.APPROVED;
    updatedRequest.approvedAt = now;
    updatedRequest.expiryDate = expiry ? expiry.toISOString() : null;
    saveUserSubscription(updatedRequest.userId, {
      status: "active",
      planId: updatedRequest.planId,
      planLabel: updatedRequest.planLabel,
      expiryDate: updatedRequest.expiryDate,
      amount: updatedRequest.amount,
      reference: updatedRequest.reference,
      requestId: updatedRequest.id,
      submittedAt: updatedRequest.submittedAt,
      approvedAt: now,
      updatedAt: now,
    });
  } else if (nextStatus === PAYMENT_STATUS.REJECTED) {
    updatedRequest.status = PAYMENT_STATUS.REJECTED;
    updatedRequest.rejectedAt = now;
    saveUserSubscription(updatedRequest.userId, {
      status: PAYMENT_STATUS.REJECTED,
      planId: updatedRequest.planId,
      planLabel: updatedRequest.planLabel,
      amount: updatedRequest.amount,
      reference: updatedRequest.reference,
      requestId: updatedRequest.id,
      submittedAt: updatedRequest.submittedAt,
      rejectedAt: now,
      updatedAt: now,
    });
  }

  const nextRequests = requests.map((item) => (item.id === requestId ? normalizeRequest(updatedRequest) : item));
  savePaymentRequests(nextRequests);
  return normalizeRequest(updatedRequest);
}

export function addPaymentMethod(payload = {}) {
  const methods = getPaymentMethods();
  const nextMethod = normalizeMethod({
    id: randomId("method"),
    name: payload.name,
    accountName: payload.accountName,
    accountNumber: payload.accountNumber,
    type: payload.type,
    label: payload.label || payload.name,
    qrCode: payload.qrCode || "",
  });
  savePaymentMethods([nextMethod, ...methods]);
  return nextMethod;
}

export function updatePaymentMethod(methodId, patch = {}) {
  const methods = getPaymentMethods();
  const updatedMethods = methods.map((method) =>
    method.id === methodId
      ? normalizeMethod({ ...method, ...patch })
      : method,
  );
  savePaymentMethods(updatedMethods);
  return updatedMethods.find((method) => method.id === methodId) || null;
}

export function deletePaymentMethod(methodId) {
  const methods = getPaymentMethods();
  const updatedMethods = methods.filter((method) => method.id !== methodId);
  savePaymentMethods(updatedMethods);
  return updatedMethods;
}

export function getPaymentRequestById(requestId) {
  return getPaymentRequests().find((request) => request.id === requestId) || null;
}

export function findUserPendingRequest(userId) {
  return getPaymentRequests().find(
    (request) => request.userId === userId && request.status === PAYMENT_STATUS.PENDING,
  );
}

export function findUserLatestRequest(userId) {
  return getPaymentRequests().filter((request) => request.userId === userId)[0] || null;
}

export function listeningStorageSupported() {
  return typeof window !== "undefined" && typeof window.addEventListener === "function";
}
