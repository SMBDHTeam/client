export type MockPlace = {
  id: number;
  name: string;
  address: string;
  category: string;
};

export type MockTrip = {
  id: number;
  title: string;
  date: string;
  places: string;
  duration: string;
  status: "진행 임박" | "예정" | "임시저장" | "완료";
  gradient: string;
  placeList: MockPlace[];
};

export const ALL_TRIPS: MockTrip[] = [
  {
    id: 1,
    title: "제주도 힐링 여행",
    date: "8.14 - 8.16",
    places: "14곳",
    duration: "2박3일",
    status: "진행 임박",
    gradient: "from-[#2E7DF2] to-[#17B89B]",
    placeList: [
      { id: 101, name: "성산일출봉", address: "제주 서귀포시 성산읍", category: "자연" },
      { id: 102, name: "협재해수욕장", address: "제주 제주시 한림읍", category: "자연" },
      { id: 103, name: "카멜리아힐", address: "제주 서귀포시 안덕면", category: "자연" },
      { id: 104, name: "올레시장", address: "제주 제주시 이도이동", category: "쇼핑" },
      { id: 105, name: "흑돼지거리", address: "제주 제주시 연동", category: "음식" },
    ],
  },
  {
    id: 2,
    title: "부산 미식 투어",
    date: "9.05 - 9.06",
    places: "8곳",
    duration: "1박2일",
    status: "예정",
    gradient: "from-[#F7A18E] to-[#F16E5E]",
    placeList: [
      { id: 201, name: "해운대 해수욕장", address: "부산 해운대구 우동", category: "자연" },
      { id: 202, name: "광안리 해수욕장", address: "부산 수영구 광안동", category: "자연" },
      { id: 203, name: "자갈치시장", address: "부산 중구 남포동", category: "쇼핑" },
      { id: 204, name: "감천문화마을", address: "부산 사하구 감천동", category: "문화" },
      { id: 205, name: "태종대", address: "부산 영도구 동삼동", category: "자연" },
    ],
  },
  {
    id: 3,
    title: "경주 역사 산책",
    date: "10.12",
    places: "6곳",
    duration: "당일",
    status: "임시저장",
    gradient: "from-[#8B7DF2] to-[#5B5EE8]",
    placeList: [
      { id: 301, name: "불국사", address: "경북 경주시 불국로", category: "역사" },
      { id: 302, name: "석굴암", address: "경북 경주시 불국로", category: "역사" },
      { id: 303, name: "첨성대", address: "경북 경주시 인왕동", category: "역사" },
      { id: 304, name: "동궁과 월지", address: "경북 경주시 원화로", category: "역사" },
    ],
  },
];

export const PAST_TRIPS: MockTrip[] = [
  {
    id: 4,
    title: "여수 밤바다 여행",
    date: "6.21 - 6.22",
    places: "10곳",
    duration: "1박2일",
    status: "완료",
    gradient: "from-[#5AA9F0] to-[#3B7DE0]",
    placeList: [
      { id: 401, name: "오동도", address: "전남 여수시 수정동", category: "자연" },
      { id: 402, name: "돌산공원", address: "전남 여수시 돌산읍", category: "자연" },
      { id: 403, name: "여수 밤바다", address: "전남 여수시 중앙동", category: "문화" },
      { id: 404, name: "향일암", address: "전남 여수시 돌산읍", category: "역사" },
    ],
  },
];
