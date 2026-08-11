export const COMMUNITY_TAGS = [
  { id: "food", label: "맛집", emoji: "🍜" },
  { id: "cafe", label: "카페", emoji: "☕" },
  { id: "healing", label: "힐링", emoji: "🌿" },
  { id: "activity", label: "액티비티", emoji: "🏄" },
  { id: "shopping", label: "쇼핑", emoji: "🛍️" },
  { id: "night", label: "야경", emoji: "🌉" },
  { id: "nature", label: "자연", emoji: "🏔️" },
  { id: "history", label: "역사", emoji: "🏛️" },
] as const;

export type CommunityTagId = typeof COMMUNITY_TAGS[number]["id"];
