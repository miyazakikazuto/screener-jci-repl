const IDX_ORIGIN = "https://www.idx.co.id";

const BROWSER_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  Referer: `${IDX_ORIGIN}/`,
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
};

let sessionCookie = "";

async function ensureSession(): Promise<void> {
  if (sessionCookie) return;
  try {
    const indexRes = await fetch(`${IDX_ORIGIN}/id`, {
      headers: BROWSER_HEADERS,
    });
    const setCookieHeaders = indexRes.headers.getSetCookie?.() ?? [];
    sessionCookie = setCookieHeaders.join("; ");
    indexRes.body?.cancel?.();
    await new Promise((r) => setTimeout(r, 800));
    const validationRes = await fetch(
      `${IDX_ORIGIN}/primary/home/GetIndexList`,
      {
        headers: {
          ...BROWSER_HEADERS,
          ...(sessionCookie ? { Cookie: sessionCookie } : {}),
        },
      }
    );
    validationRes.body?.cancel?.();
  } catch {
    sessionCookie = "";
  }
}

export async function idxGet(url: string): Promise<Response> {
  await ensureSession();
  const headers = {
    ...BROWSER_HEADERS,
    ...(sessionCookie ? { Cookie: sessionCookie } : {}),
  };
  const response = await fetch(url, { headers });
  if (!response.ok && response.status === 403) {
    sessionCookie = "";
  }
  return response;
}
