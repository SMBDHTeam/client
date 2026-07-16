import QuestionStepPage from "@/components/QuestionStepPage";

export default function TripPreferenceStepThreePage() {
  return (
    <QuestionStepPage
      step={3}
      nextHref="/trips/new/places"
      title="내가 선호하는 여행 스타일은?"
      subtitle="여러 개 선택할 수 있어요"
      layout="chips"
      centered
      buttonLabel="장소 선택하기 →"
    />
  );
}
