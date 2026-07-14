export type ItineraryPlace = {
    id: string;
    order: number;
    time: string;
    title: string;
    subtitle: string;
    gradient: string;
    lat: number;
    lng: number;
    color: string;
};

export type ItineraryDay = {
    day: number;
    distanceKm: number;
    places: ItineraryPlace[];
};

const DEFAULT_ITINERARY: ItineraryDay[] = [
    {
        day: 1,
        distanceKm: 18,
        places: [
            {
                id: "d1-1",
                order: 1,
                time: "10:00",
                title: "부산역 도착",
                subtitle: "KTX 도착 · 렌터카 픽업",
                gradient: "from-[#2E7DF2] to-[#17B89B]",
                lat: 35.1151,
                lng: 129.0413,
                color: "#17B89B",
            },
            {
                id: "d1-2",
                order: 2,
                time: "11:30",
                title: "감천문화마을",
                subtitle: "감성 · 골목 산책 · ★4.6",
                gradient: "from-[#F7A18E] to-[#F16E5E]",
                lat: 35.0975,
                lng: 129.0107,
                color: "#F16E5E",
            },
            {
                id: "d1-3",
                order: 3,
                time: "14:00",
                title: "자갈치시장",
                subtitle: "맛집 · 회 · 점심",
                gradient: "from-[#8B7DF2] to-[#5B5EE8]",
                lat: 35.0966,
                lng: 129.0306,
                color: "#2E7DF2",
            },
            {
                id: "d1-4",
                order: 4,
                time: "16:00",
                title: "광안리 해변 카페",
                subtitle: "감성 · 오션뷰",
                gradient: "from-[#5AA9F0] to-[#3B7DE0]",
                lat: 35.1532,
                lng: 129.1186,
                color: "#2E7DF2",
            },
            {
                id: "d1-5",
                order: 5,
                time: "18:30",
                title: "해운대 흑돼지 맛집",
                subtitle: "맛집 · 저녁",
                gradient: "from-[#F7A18E] to-[#F16E5E]",
                lat: 35.162,
                lng: 129.163,
                color: "#17B89B",
            },
        ],
    },
    {
        day: 2,
        distanceKm: 14,
        places: [
            {
                id: "d2-1",
                order: 1,
                time: "09:30",
                title: "해운대 해수욕장",
                subtitle: "해변 · 산책",
                gradient: "from-[#2E7DF2] to-[#17B89B]",
                lat: 35.1587,
                lng: 129.1604,
                color: "#17B89B",
            },
            {
                id: "d2-2",
                order: 2,
                time: "12:00",
                title: "동백섬",
                subtitle: "자연 · 포토스팟",
                gradient: "from-[#5AA9F0] to-[#3B7DE0]",
                lat: 35.1533,
                lng: 129.152,
                color: "#2E7DF2",
            },
            {
                id: "d2-3",
                order: 3,
                time: "15:00",
                title: "더베이101",
                subtitle: "카페 · 야경 명소",
                gradient: "from-[#F7A18E] to-[#F16E5E]",
                lat: 35.1543,
                lng: 129.1585,
                color: "#F16E5E",
            },
            {
                id: "d2-4",
                order: 4,
                time: "18:00",
                title: "광안대교 야경",
                subtitle: "야경 · 산책",
                gradient: "from-[#8B7DF2] to-[#5B5EE8]",
                lat: 35.147,
                lng: 129.129,
                color: "#2E7DF2",
            },
        ],
    },
    {
        day: 3,
        distanceKm: 9,
        places: [
            {
                id: "d3-1",
                order: 1,
                time: "10:30",
                title: "태종대",
                subtitle: "자연 · 절경",
                gradient: "from-[#5AA9F0] to-[#3B7DE0]",
                lat: 35.0537,
                lng: 129.0876,
                color: "#2E7DF2",
            },
            {
                id: "d3-2",
                order: 2,
                time: "13:00",
                title: "국제시장",
                subtitle: "쇼핑 · 먹거리",
                gradient: "from-[#F7A18E] to-[#F16E5E]",
                lat: 35.101,
                lng: 129.026,
                color: "#F16E5E",
            },
            {
                id: "d3-3",
                order: 3,
                time: "15:00",
                title: "부산역 출발",
                subtitle: "렌터카 반납 · KTX 탑승",
                gradient: "from-[#2E7DF2] to-[#17B89B]",
                lat: 35.1151,
                lng: 129.0413,
                color: "#17B89B",
            },
        ],
    },
];

export const TRIP_ITINERARY: Record<string, ItineraryDay[]> = {
    "1": DEFAULT_ITINERARY,
};

export function getItinerary(id: string): ItineraryDay[] {
    return TRIP_ITINERARY[id] ?? DEFAULT_ITINERARY;
}
