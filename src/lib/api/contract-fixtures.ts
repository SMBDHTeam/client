import type { LocationInput } from "@/types/api/common";
import type { PlaceSearchItem } from "@/types/api/place";
import type { TripQuestion } from "@/types/api/question";

export const CONTRACT_QUESTIONS: TripQuestion[] = [
  {
    id: "COMPANION",
    text: "누구와 여행하나요?",
    type: "SINGLE_CHOICE",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    uiStep: 1,
    displayOrder: 1,
    answers: ["혼자", "친구와", "배우자·연인과", "아이와", "부모님과", "기타"].map(
      (label, index) => ({
        id: `COMPANION_${["SOLO", "FRIENDS", "COUPLE", "FAMILY_WITH_CHILD", "PARENTS", "OTHER"][index]}`,
        label,
        displayOrder: index + 1,
      }),
    ),
  },
  {
    id: "MOBILITY",
    text: "이동할 때 고려할 점이 있나요?",
    type: "SINGLE_CHOICE",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    uiStep: 1,
    displayOrder: 2,
    answers: [
      { id: "MOBILITY_NORMAL", label: "특별히 없어요", displayOrder: 1 },
      { id: "MOBILITY_LOW_WALK", label: "걷는 구간을 줄여주세요", displayOrder: 2 },
    ],
  },
  {
    id: "PACE",
    text: "하루 일정을 어떻게 구성할까요?",
    type: "SINGLE_CHOICE",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    uiStep: 2,
    displayOrder: 3,
    answers: [
      { id: "PACE_PACKED", label: "빼곡하고 알찬 일정", displayOrder: 1 },
      { id: "PACE_RELAXED", label: "널널하고 여유로운 일정", displayOrder: 2 },
    ],
  },
  {
    id: "TRANSIT",
    text: "대중교통은 어떻게 이용할까요?",
    type: "SINGLE_CHOICE",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    uiStep: 2,
    displayOrder: 4,
    answers: [
      { id: "TRANSIT_SIMPLE", label: "환승은 적게", displayOrder: 1 },
      { id: "TRANSIT_FAST", label: "빠른 이동 우선", displayOrder: 2 },
    ],
  },
  {
    id: "THEME",
    text: "어떤 여행을 선호하나요?",
    type: "MULTIPLE_CHOICE",
    required: true,
    minSelections: 1,
    maxSelections: 3,
    uiStep: 3,
    displayOrder: 5,
    answers: ["맛집", "자연", "문화·역사", "바다", "쇼핑", "휴식"].map(
      (label, index) => ({
        id: `THEME_${["FOOD", "NATURE", "HISTORY_CULTURE", "SEA", "SHOPPING", "HEALING"][index]}`,
        label,
        displayOrder: index + 1,
      }),
    ),
  },
];

export const CONTRACT_LOCATIONS: LocationInput[] = [
  { name: "부산역", address: "부산 동구 중앙대로 206", longitude: 129.0403, latitude: 35.1151 },
  { name: "김해국제공항", address: "부산 강서구 공항진입로 108", longitude: 128.9485, latitude: 35.1732 },
  { name: "해운대 숙소", address: "부산 해운대구 해운대해변로", longitude: 129.158, latitude: 35.159 },
  { name: "남포동 숙소", address: "부산 중구 남포동", longitude: 129.032, latitude: 35.1 },
];

export const CONTRACT_PLACES: PlaceSearchItem[] = [
  {
    placeId: 101,
    source: "TOUR_API",
    externalId: "126508",
    name: "광안리해수욕장",
    category: "관광지",
    categoryLabel: "관광지",
    address: "부산광역시 수영구 광안해변로",
    longitude: 129.1186,
    latitude: 35.1532,
    primaryImageUrl: null,
    resolved: true,
  },
  {
    placeId: 205,
    source: "TOUR_API",
    externalId: "tour-gamcheon",
    name: "감천문화마을",
    category: "문화시설",
    categoryLabel: "문화시설",
    address: "부산광역시 사하구 감내2로 203",
    longitude: 129.0107,
    latitude: 35.0975,
    primaryImageUrl: null,
    resolved: true,
  },
  {
    placeId: null,
    source: "KAKAO_LOCAL",
    externalId: "kakao-sea-cafe",
    name: "광안리 바다 카페",
    category: "카페",
    categoryLabel: "카페",
    address: "부산광역시 수영구 광안동",
    longitude: 129.1202,
    latitude: 35.1541,
    primaryImageUrl: null,
    placeUrl: "https://place.map.kakao.com/",
    resolved: false,
  },
];
