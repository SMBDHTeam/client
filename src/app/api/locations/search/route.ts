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

  // 지역검색은 전국 대상이고 최대 5건만 반환하므로, 검색어에 지역을 붙여
  // 그 5건이 부산 결과로 채워지게 한다.
  const query = keyword.includes("부산") ? keyword : `${keyword} 부산`;

  const response = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`,
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
  const items = (data.items ?? [])
    // 부산 여행의 출발 지점이므로 부산 밖 결과는 고를 수 없게 한다.
    .filter((item) => `${item.roadAddress ?? ""} ${item.address ?? ""}`.includes("부산"))
    .map((item) => ({
      name: cleanText(item.title),
      address: cleanText(item.roadAddress || item.address),
      longitude: Number(item.mapx) / 10_000_000,
      latitude: Number(item.mapy) / 10_000_000,
      externalId: `${item.mapx}-${item.mapy}`,
      source: "NAVER_LOCAL",
    }));

  return Response.json({ items });
}
