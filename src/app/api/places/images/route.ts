type ImageSearchResponse = {
  items?: { link?: string }[];
};

async function fetchThumbnail(name: string, signal: AbortSignal) {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(`${name} 부산`)}&display=1&filter=medium`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        signal,
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as ImageSearchResponse;
    const imageUrl = data.items?.[0]?.link;
    return imageUrl?.startsWith("http") ? imageUrl : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { names?: unknown } | null;
  const names = Array.isArray(body?.names)
    ? [...new Set(body.names.filter((name): name is string => typeof name === "string"))]
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const items = await Promise.all(
    names.map(async (name) => ({
      name,
      primaryImageUrl: await fetchThumbnail(name, request.signal),
    })),
  );

  return Response.json({ items });
}
