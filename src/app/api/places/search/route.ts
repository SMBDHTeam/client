const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function cleanText(text: string) {
  return text
    .replace(/<\/?b>/g, "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_ENTITIES[entity]);
}

async function fetchThumbnail(query: string) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=1&filter=medium`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_SEARCH_CLIENT_ID ?? "",
          "X-Naver-Client-Secret": process.env.NAVER_SEARCH_CLIENT_SECRET ?? "",
        },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ items: [] });
  }

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=3`,
    {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_SEARCH_CLIENT_ID ?? "",
        "X-Naver-Client-Secret": process.env.NAVER_SEARCH_CLIENT_SECRET ?? "",
      },
    },
  );

  if (!res.ok) {
    return Response.json({ items: [] }, { status: res.status });
  }

  const data = await res.json();

  const items = await Promise.all(
    (data.items ?? []).map(
      async (item: { title: string; category: string; roadAddress: string; address: string; mapx: string; mapy: string }) => {
        const name = cleanText(item.title);
        return {
          id: `${item.mapx}-${item.mapy}`,
          name,
          tag: cleanText(
            [item.category, item.roadAddress || item.address].filter(Boolean).join(" · "),
          ),
          mapx: Number(item.mapx),
          mapy: Number(item.mapy),
          image: await fetchThumbnail(name),
        };
      },
    ),
  );

  return Response.json({ items });
}
