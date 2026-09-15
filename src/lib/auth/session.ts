import type { AuthUserDto, LoginResponseDto } from "@/lib/dto/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_USER_KEY = "authUser";

function getStorageValue(key: string) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function getAccessToken() {
  return getStorageValue(ACCESS_TOKEN_KEY);
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

export function persistSession(session: LoginResponseDto, remember: boolean) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  if (session.refreshToken)
    storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
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
  const role = getAuthUser()?.role;
  if (!role || typeof role === "string" || !role.permissions?.length)
    return true;
  return role.permissions.some(
    (permission) => permission.model === model && permission.action === action,
  );
}
