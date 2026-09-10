const BOT_API_URL = process.env.BOT_API_URL!;
const BOT_AUTH = process.env.BOT_AUTH!;

interface GowaRequestOptions {
  method?: string;
  path: string;
  device_id?: string;
  body?: unknown;
  query?: Record<string, string>;
  form?: FormData;
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, BOT_API_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export async function gowa<T = unknown>(
  options: GowaRequestOptions
): Promise<T> {
  const { method = "GET", path, device_id, body, query, form } = options;

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(BOT_AUTH).toString("base64")}`,
  };

  if (device_id) {
    headers["X-Device-Id"] = device_id;
  }

  const init: RequestInit = { method, headers, cache: "no-store" };

  if (form) {
    init.body = form;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const url = buildUrl(path, query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GOWA ${method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
