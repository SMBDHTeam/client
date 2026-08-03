import type { LocationSearchResponse } from "@/types/api";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function cleanText(text: string) {
  return text
    .replace(/<\/?b>/g, "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => ENTITIES[entity]);
}

type NaverLocalItem = {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();
  const size = Number(searchParams.get("size") ?? 5);
  const display = Math.min(Math.max(size, 1), 5);

  if (!keyword) {
    return Response.json({ items: [] } satisfies LocationSearchResponse);
  }

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(keyword)}&display=${display}`,
    {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_SEARCH_CLIENT_ID ?? "",
        "X-Naver-Client-Secret": process.env.NAVER_SEARCH_CLIENT_SECRET ?? "",
      },
    },
  );

  if (!res.ok) {
    return Response.json({ items: [] } satisfies LocationSearchResponse, {
      status: res.status,
    });
  }

  const data: { items?: NaverLocalItem[] } = await res.json();

  const items: LocationSearchResponse["items"] = (data.items ?? []).map((item) => ({
    name: cleanText(item.title),
    address: cleanText(item.roadAddress || item.address) || null,
    longitude: Number(item.mapx) / 1e7,
    latitude: Number(item.mapy) / 1e7,
    externalId: `${item.mapx}-${item.mapy}`,
    source: "NAVER_LOCAL",
  }));

  return Response.json({ items } satisfies LocationSearchResponse);
}
