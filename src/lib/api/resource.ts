import { apiRequest } from "@/lib/api/client";
import type { ApiRecordDto } from "@/lib/dto/api";

const resourceCache = new Map<
  string,
  { data: ApiRecordDto; expiresAt: number }
>();
const pendingResourceRequests = new Map<string, Promise<ApiRecordDto>>();

export async function fetchResourceById(endpoint: string, id: string) {
  const cacheKey = `${endpoint}/${id}`;
  const cached = resourceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pendingRequest = pendingResourceRequests.get(cacheKey);
  if (pendingRequest) return pendingRequest;

  const request = apiRequest<{ data: ApiRecordDto }>(cacheKey)
    .then((response) => {
      resourceCache.set(cacheKey, {
        data: response.data,
        expiresAt: Date.now() + 2_000,
      });
      return response.data;
    })
    .finally(() => {
      pendingResourceRequests.delete(cacheKey);
    });

  pendingResourceRequests.set(cacheKey, request);
  return request;
}

function invalidateResourceCache(endpoint: string, id?: string) {
  if (id) {
    resourceCache.delete(`${endpoint}/${id}`);
    pendingResourceRequests.delete(`${endpoint}/${id}`);
    return;
  }
  for (const key of resourceCache.keys()) {
    if (key.startsWith(`${endpoint}/`)) resourceCache.delete(key);
  }
  for (const key of pendingResourceRequests.keys()) {
    if (key.startsWith(`${endpoint}/`)) pendingResourceRequests.delete(key);
  }
}

export async function updateResource(
  endpoint: string,
  id: string,
  values: Record<string, unknown>,
  multipart = false,
) {
  const body = multipart
    ? Object.entries(values).reduce((form, [key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== "" && item !== undefined && item !== null)
              form.append(key, String(item));
          });
        } else if (value instanceof File) {
          if (value.size > 0) form.append(key, value);
        } else if (value !== "" && value !== undefined && value !== null) {
          form.append(key, String(value));
        }
        return form;
      }, new FormData())
    : values;
  const response = await apiRequest(`${endpoint}/${id}`, {
    method: "PUT",
    body,
  });
  invalidateResourceCache(endpoint, id);
  return response;
}

export async function createResource(
  endpoint: string,
  values: Record<string, unknown>,
  multipart = false,
) {
  const body = multipart
    ? Object.entries(values).reduce((form, [key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== "" && item !== undefined && item !== null)
              form.append(key, String(item));
          });
        } else if (value instanceof File) {
          if (value.size > 0) form.append(key, value);
        } else if (value !== "" && value !== undefined && value !== null) {
          form.append(key, String(value));
        }
        return form;
      }, new FormData())
    : values;
  const response = await apiRequest(endpoint, { method: "POST", body });
  invalidateResourceCache(endpoint);
  return response;
}

export function archiveResource(endpoint: string, id: string) {
  return apiRequest(`${endpoint}/${id}/archived`, { method: "DELETE" }).then(
    (response) => {
      invalidateResourceCache(endpoint, id);
      return response;
    },
  );
}

export function deleteResource(endpoint: string, id: string) {
  return apiRequest(`${endpoint}/${id}`, { method: "DELETE" }).then(
    (response) => {
      invalidateResourceCache(endpoint, id);
      return response;
    },
  );
}
