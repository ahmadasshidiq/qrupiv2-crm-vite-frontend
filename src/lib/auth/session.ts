import type { AuthUserDto } from "@/lib/dto/auth";

const AUTH_USER_KEY = "authUser";

export function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function getCsrfToken() {
  return getCookie(import.meta.env.VITE_CSRF_COOKIE_NAME ?? "qrupi_csrf");
}

function getStorageValue(key: string) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function getAuthUser(): AuthUserDto | null {
  const value = getStorageValue(AUTH_USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUserDto;
  } catch {
    clearSession();
    return null;
  }
}

export function persistSession(user: AuthUserDto) {
  clearSession();
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(AUTH_USER_KEY);
  }
}

export function getRoleName(user: AuthUserDto | null) {
  if (!user) return "";
  const roleName =
    typeof user.role === "string"
      ? user.role
      : (user.role.slug ?? user.role.name ?? "");
  return roleName
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

export function canAccessCrm(user: AuthUserDto | null) {
  if (!user) return false;
  const identity = `${user.type ?? ""} ${getRoleName(user)}`.toLowerCase();
  return !identity.includes("student") && !identity.includes("siswa");
}

export function hasPermission(model: string, action: string) {
  const user = getAuthUser();
  const role = user?.role;
  const permissions = user?.permissions ??
    (role && typeof role !== "string" ? role.permissions : undefined);
  if (!permissions) return false;
  return permissions.some(
    (permission) => permission.model === model && permission.action === action,
  );
}

export function canReadModel(model: string) {
  return hasPermission(model, "get") || hasPermission(model, "get-all");
}
