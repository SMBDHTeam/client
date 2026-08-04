import haeundaeImg from "@/assets/images/haeundae.jpg";
import gwanganImg from "@/assets/images/gwangan.jpg";
import gamcheonImg from "@/assets/images/gamcheon.jpg";
import templeImg from "@/assets/images/temple.jpg";
import parkImg from "@/assets/images/hwamyeong.jpg";
import park2Img from "@/assets/images/samnak.jpg";

export const TEXTURE_MAP: Record<string, string> = {
  해운대구: haeundaeImg.src,
  수영구: gwanganImg.src,
  사하구: gamcheonImg.src,
  기장군: templeImg.src,
  북구: parkImg.src,
  사상구: park2Img.src,
};

export const DISTRICT_COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#38bdf8", "#fb923c", "#4ade80",
  "#e879f9", "#facc15", "#2dd4bf", "#818cf8", "#f87171", "#a3e635", "#fb7185", "#c084fc",
];

export const CENTERS: Record<string, { lat: number; lng: number }> = {
  "21010": { lat: 35.0979, lng: 129.0328 },
  "21020": { lat: 35.0969, lng: 129.0054 },
  "21030": { lat: 35.1235, lng: 129.044 },
  "21040": { lat: 35.0896, lng: 129.0694 },
  "21050": { lat: 35.1619, lng: 129.0536 },
  "21060": { lat: 35.2056, lng: 129.0836 },
  "21070": { lat: 35.1349, lng: 129.0837 },
  "21080": { lat: 35.2368, lng: 128.9992 },
  "21090": { lat: 35.163, lng: 129.1652 },
  "21100": { lat: 35.0895, lng: 128.9745 },
  "21110": { lat: 35.2458, lng: 129.0924 },
  "21120": { lat: 35.1432, lng: 128.9216 },
  "21130": { lat: 35.1763, lng: 129.0814 },
  "21140": { lat: 35.1555, lng: 129.1136 },
  "21150": { lat: 35.1498, lng: 128.9937 },
  "21310": { lat: 35.2447, lng: 129.2171 },
};

export const LANDMARK_MAP: Record<string, string> = {
  '중구': '용두산공원 · 부산타워',
  '서구': '송도 구름산책로',
  '동구': '이바구길 168계단',
  '영도구': '태종대',
  '부산진구': '서면',
  '동래구': '동래읍성',
  '남구': '오륙도',
  '북구': '화명 생태공원',
  '해운대구': '해운대 해수욕장',
  '사하구': '감천문화마을',
  '금정구': '범어사',
  '강서구': '을숙도',
  '연제구': '부산시청',
  '수영구': '광안대교',
  '사상구': '삼락생태공원',
  '기장군': '해동용궁사',
};
