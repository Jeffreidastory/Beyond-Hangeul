export const MODULE_ACCESS = {
  LOCKED: "locked",
  UNLOCKED: "unlocked",
};

export const MODULE_TYPE = {
  FREE: "free",
  PAID: "paid",
};

export const MODULE_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
};

export const PATH_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
};

export const PATH_STEP_TYPE = {
  MODULE: "module",
  WORKSHEET: "worksheet",
  INFO: "info",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const PAYMENT_METHOD_TYPES = {
  E_WALLET: "e-wallet",
  BANK: "bank",
};

export const PAYMENT_PLAN_TYPES = {
  LIFETIME: "lifetime",
};

export const PAYMENT_METHODS = ["GCash", "GoTyme"];

export const ADMIN_SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "modules", label: "Modules" },
  { key: "worksheets", label: "Worksheets" },
  { key: "path", label: "Path" },
  { key: "users", label: "Users" },
  { key: "payments", label: "Payments" },
  { key: "sales-report", label: "Sales Report" },
];
