import type {
  IContentMetadata,
  IEditorModel,
  IPlayerModel,
} from "@lumieducation/h5p-server";

export interface H5PSaveResult {
  contentId: string;
  metadata: IContentMetadata;
}

const baseUrl = (import.meta.env.VITE_H5P_BASE_URL ?? "/h5p").replace(
  /\/$/,
  "",
);
const basePath = baseUrl.startsWith("/") ? baseUrl : new URL(baseUrl).pathname;

function resolveH5PUrls<T>(value: T): T {
  if (typeof value === "string") {
    if (!value.startsWith("/")) return value as T;
    // Some H5P paths already include the configured base path (/h5p), while
    // paths such as /libraries and /editor are relative to that base path.
    const resolved = value.startsWith(`${basePath}/`)
      ? value
      : `${basePath}${value}`;
    return resolved as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveH5PUrls(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveH5PUrls(item)]),
    ) as T;
  }
  return value;
}

async function parseResponse<T>(
  response: Response,
  message: string,
): Promise<T> {
  if (!response.ok)
    throw new Error(`${message}: ${response.status} ${await response.text()}`);
  return (await response.json()) as T;
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${baseUrl}/csrf-token`, {
    credentials: "include",
  });
  const data = await parseResponse<{ csrfToken?: string }>(
    response,
    "Gagal mengambil token CSRF H5P",
  );
  if (!data.csrfToken) throw new Error("Token CSRF H5P tidak tersedia.");
  return data.csrfToken;
}

export const h5pService = {
  getEdit: async (contentId?: string): Promise<IEditorModel> => {
    // The REST example server uses the literal "undefined" route segment
    // to represent a new content item.
    const editId = contentId || "undefined";
    const response = await fetch(
      `${baseUrl}/${encodeURIComponent(editId)}/edit`,
      {
        credentials: "include",
      },
    );
    const model = await parseResponse<IEditorModel>(
      response,
      "Gagal membuka editor H5P",
    );
    return resolveH5PUrls(model);
  },

  save: async (
    contentId: string,
    requestBody: { library: string; params: unknown },
  ): Promise<H5PSaveResult> => {
    // H5PEditorUI passes undefined for a new content item.
    const isNew =
      !contentId || contentId === "new" || contentId === "undefined";
    const csrfToken = await getCsrfToken();
    const response = await fetch(
      isNew ? baseUrl : `${baseUrl}/${encodeURIComponent(contentId)}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      },
    );
    return parseResponse<H5PSaveResult>(response, "Gagal menyimpan H5P");
  },

  getPlay: async (contentId: string): Promise<IPlayerModel> => {
    const response = await fetch(
      `${baseUrl}/${encodeURIComponent(contentId)}/play`,
      {
        credentials: "include",
      },
    );
    const model = await parseResponse<IPlayerModel>(
      response,
      "Gagal membuka H5P",
    );
    return resolveH5PUrls(model);
  },
};
