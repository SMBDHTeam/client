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

/**
 * 화면 칩·부제에 쓸 분류 이름.
 *
 * 서버가 이름을 주면 그대로 쓴다. 없으면 저장된 원본에서 만든다. 원본은 출처마다 모양이 다르다.
 * - TourAPI: "A01011600" 같은 분류 코드. 이름으로 바꾸고, 바꾸지 못한 코드(숙박 B·추천코스 C 등)는 null.
 * - 카카오·네이버: "여행 > 관광,명소 > 해수욕장,해변" 같은 경로. 가장 구체적인 분류의 첫 이름("해수욕장").
 */
export function placeCategoryDisplay(
  category: string | null | undefined,
  categoryLabel?: string | null,
): string | null {
  // 이름이 경로 모양이면 서버가 아직 변환하지 않은 값이라 아래에서 다시 만든다.
  if (categoryLabel && !categoryLabel.includes(">")) return categoryLabel;
  const raw = categoryLabel || category;
  if (!raw) return null;
  const leaf = raw.split(">").pop()?.split(",")[0]?.trim();
  const label = placeCategoryLabel(leaf || raw);
  return !label || /^[A-C]\d+$/.test(label) ? null : label;
}

export function placeCategoryLabel(category: string) {
  if (!category) return "여행지";
  if (!/^A\d+$/.test(category)) return category;

  const prefix = Object.keys(CATEGORY_LABELS)
    .toSorted((left, right) => right.length - left.length)
    .find((key) => category.startsWith(key));
  return prefix ? CATEGORY_LABELS[prefix] : "관광지";
}
