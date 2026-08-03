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
  category: string;
  roadAddress: string;
  address: string;
  mapx: string;
  mapy: string;
  link?: string;
};

/**
 * 네이버 지역검색은 전국을 대상으로 하므로 부산 밖 결과가 섞인다.
 * 일정은 부산 안에서만 생성되니 여기서 걸러 사용자가 담지 못하게 한다.
 */
function isInBusan(item: NaverLocalItem) {
  const address = `${item.roadAddress ?? ""} ${item.address ?? ""}`;
  return address.includes("부산");
}

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

  // 네이버 지역검색은 전국 대상이고 최대 5건만 준다. "카페"처럼 일반적인 검색어는
  // 상위 5건이 전부 수도권이라 부산 필터를 거치면 아무것도 남지 않는다.
  // 검색어에 지역을 붙여 5건 자체가 부산 결과로 채워지게 한다.
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
      { message: "장소를 검색하지 못했습니다." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { items?: NaverLocalItem[] };
  const items = (data.items ?? []).filter(isInBusan).map((item) => {
    const category = cleanText(item.category ?? "");
    return {
      placeId: null,
      // 네이버는 안정적인 장소 ID를 주지 않으므로 좌표로 키를 만든다.
      // 서버의 POST /places/resolve가 같은 규칙으로 중복 등록을 막는다.
      externalId: `${item.mapx}-${item.mapy}`,
      source: "NAVER_LOCAL" as const,
      name: cleanText(item.title),
      category,
      categoryLabel: category,
      address: cleanText(item.roadAddress || item.address),
      longitude: Number(item.mapx) / 10_000_000,
      latitude: Number(item.mapy) / 10_000_000,
      primaryImageUrl: null,
      placeUrl: item.link ?? null,
      resolved: false,
    };
  });

  return Response.json({ items });
}
