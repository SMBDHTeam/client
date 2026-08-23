export type MockWishlistPlace = {
  id: number;
  name: string;
  address: string;
  category: string;
  gradient: string;
};

export const WISHLIST_PLACES: MockWishlistPlace[] = [
  { id: 1, name: "해운대 해수욕장", address: "부산 해운대구 우동", category: "자연", gradient: "from-[#2E7DF2] to-[#17B89B]" },
  { id: 2, name: "광안리 해수욕장", address: "부산 수영구 광안동", category: "자연", gradient: "from-[#5AA9F0] to-[#3B7DE0]" },
  { id: 3, name: "감천문화마을", address: "부산 사하구 감천동", category: "문화", gradient: "from-[#F7A18E] to-[#F16E5E]" },
  { id: 4, name: "자갈치시장", address: "부산 중구 남포동", category: "쇼핑", gradient: "from-[#F7AC6E] to-[#F16E5E]" },
  { id: 5, name: "태종대", address: "부산 영도구 동삼동", category: "자연", gradient: "from-[#17B89B] to-[#2E9A6D]" },
  { id: 6, name: "송정해수욕장", address: "부산 해운대구 송정동", category: "자연", gradient: "from-[#8B7DF2] to-[#5B5EE8]" },
  { id: 7, name: "오륙도 스카이워크", address: "부산 남구 용호동", category: "자연", gradient: "from-[#5AA9F0] to-[#3B7DE0]" },
  { id: 8, name: "부산타워", address: "부산 중구 광복동", category: "문화", gradient: "from-[#2E7DF2] to-[#17B89B]" },
];
