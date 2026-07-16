const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function cleanText(value: string) {
  return value
    .replace(/<\/?b>/g, "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_ENTITIES[entity]);
}

type NaverLocalItem = {
  title: string;
  roadAddress: string;
  address: string;
  mapx: string;
  mapy: string;
};

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim();
  if (!keyword) return Response.json({ items: [] });

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json(
      { message: "네이버 검색 API 설정이 필요합니다." },
      { status: 503 },
    );
  }

  const response = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(keyword)}&display=10`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: request.signal,
    },
  );

  if (!response.ok) {
    return Response.json(
      { message: "네이버 장소 검색에 실패했습니다." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { items?: NaverLocalItem[] };
  const items = (data.items ?? []).map((item) => ({
    name: cleanText(item.title),
    address: cleanText(item.roadAddress || item.address),
    longitude: Number(item.mapx) / 10_000_000,
    latitude: Number(item.mapy) / 10_000_000,
  }));

  return Response.json({ items });
}
