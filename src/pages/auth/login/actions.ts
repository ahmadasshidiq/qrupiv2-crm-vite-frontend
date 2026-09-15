import type { LoginRequestDto, LoginResponseDto } from "@/lib/dto/auth";
import { apiRequest } from "@/lib/api/client";
import { persistSession } from "@/lib/auth/session";
import type { AuthUserDto } from "@/lib/dto/auth";

function getStringValue(source: Record<string, unknown>, key: string) {
  return typeof source[key] === "string" && source[key].trim()
    ? source[key]
    : undefined;
}

function getInstitutionFromUser(
  rawUser: Record<string, unknown>,
): NonNullable<AuthUserDto["institution"]> | null {
  if (rawUser.institution && typeof rawUser.institution === "object")
    return rawUser.institution as NonNullable<AuthUserDto["institution"]>;

  const id = getStringValue(rawUser, "institution_id");
  const name = getStringValue(rawUser, "institution_name");
  const avatarUrl =
    getStringValue(rawUser, "institution_avatar_url") ??
    getStringValue(rawUser, "institution_file_url");

  return id || name
    ? { id, name, avatar_url: avatarUrl ?? null }
    : null;
}

export async function login(
  credentials: LoginRequestDto,
): Promise<LoginResponseDto> {
  const payload = await apiRequest<Record<string, unknown>>("/auth/login", {
    method: "POST",
    authenticated: false,
    body: credentials,
  });
  const source = (
    payload.data && typeof payload.data === "object" ? payload.data : payload
  ) as Record<string, unknown>;
  const accessToken = source.accessToken ?? source.access_token ?? source.token;
  const refreshToken = source.refreshToken ?? source.refresh_token;
  const rawUser =
    source.user && typeof source.user === "object"
      ? (source.user as Record<string, unknown>)
      : source;

  if (
    typeof accessToken !== "string" ||
    typeof rawUser.id !== "string" ||
    typeof rawUser.name !== "string"
  ) {
    throw new Error("Respons autentikasi dari server tidak valid.");
  }

  let role: AuthUserDto["role"] =
    typeof rawUser.role === "string" ? rawUser.role : "";
  if (typeof rawUser.role === "string" && rawUser.role) {
    const rolePayload = await apiRequest<{ data?: AuthUserDto["role"] }>(
      `/roles/${rawUser.role}`,
      {
        authenticated: false,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ).catch(() => null);
    role = rolePayload?.data ?? role;
  }

  let institution = getInstitutionFromUser(rawUser);
  if (institution?.id && !institution.name) {
    const institutionPayload = await apiRequest<{
      data?: NonNullable<AuthUserDto["institution"]>;
    }>(`/institutions/${institution.id}`, {
      authenticated: false,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
    institution = institutionPayload?.data ?? institution;
  }

  const user: AuthUserDto = {
    id: rawUser.id,
    name: rawUser.name,
    email: typeof rawUser.email === "string" ? rawUser.email : "",
    avatar_url:
      typeof rawUser.avatar_profile_url === "string"
        ? rawUser.avatar_profile_url
        : typeof rawUser.avatar_url === "string"
          ? rawUser.avatar_url
          : null,
    type: typeof rawUser.type === "string" ? rawUser.type : undefined,
    role,
    institution,
  };

  return {
    accessToken,
    refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
    user,
  };
}

export { persistSession };
