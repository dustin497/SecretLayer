import type { PromotionLead, VaultItemRecord } from "@secretlayer/shared";

export interface User {
  id: string;
  email: string;
  password: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  userId?: string;
  action: string;
  detail: string;
  at: string;
}

export const users = new Map<string, User>();
export const sessions = new Map<string, string>();
export const projects = new Map<string, Project>();
export const vaultItems = new Map<string, VaultItemRecord>();
export const leads = new Map<string, PromotionLead>();
export const auditLog: AuditEntry[] = [];

export function audit(action: string, detail: string, userId?: string) {
  auditLog.push({
    id: crypto.randomUUID(),
    userId,
    action,
    detail,
    at: new Date().toISOString(),
  });
  if (auditLog.length > 500) auditLog.shift();
}
