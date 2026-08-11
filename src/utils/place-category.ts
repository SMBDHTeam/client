const CATEGORY_LABELS: Record<string, string> = {
  A0101: "자연 관광지",
  A0102: "관광 자원",
  A0201: "역사 관광지",
  A0202: "휴양 관광지",
  A0203: "체험 관광지",
  A0207: "축제·공연",
  A0208: "공연·행사",
  A0302: "레포츠",
  A0401: "쇼핑",
  A0502: "음식점",
};

export function placeCategoryLabel(category: string) {
  if (!category) return "여행지";
  if (!/^A\d+$/.test(category)) return category;

  const prefix = Object.keys(CATEGORY_LABELS)
    .toSorted((left, right) => right.length - left.length)
    .find((key) => category.startsWith(key));
  return prefix ? CATEGORY_LABELS[prefix] : "관광지";
}
