export const ALL_TRIPS = [
    {
        id: 1,
        title: "제주도 힐링 여행",
        date: "8.14 - 8.16",
        places: "14곳",
        duration: "2박3일",
        status: "진행 임박" as const,
        gradient: "from-[#2E7DF2] to-[#17B89B]",
    },
    {
        id: 2,
        title: "부산 미식 투어",
        date: "9.05 - 9.06",
        places: "8곳",
        duration: "1박2일",
        status: "예정" as const,
        gradient: "from-[#F7A18E] to-[#F16E5E]",
    },
    {
        id: 3,
        title: "경주 역사 산책",
        date: "10.12",
        places: "6곳",
        duration: "당일",
        status: "임시저장" as const,
        gradient: "from-[#8B7DF2] to-[#5B5EE8]",
    },
];

export const PAST_TRIPS = [
    {
        id: 4,
        title: "여수 밤바다 여행",
        date: "6.21 - 6.22",
        places: "10곳",
        duration: "1박2일",
        status: "완료" as const,
        gradient: "from-[#5AA9F0] to-[#3B7DE0]",
    },
];
