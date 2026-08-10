import QuestionStep from "@/components/trip/QuestionStep";

export default function TripPreferenceStepThreePage() {
  return (
    <QuestionStep
      uiStep={3}
      stepIndex={3}
      total={3}
      headerTitle="여행 테마"
      title="어떤 여행을 원하세요?"
      subtitle="가장 끌리는 테마 하나를 골라 주세요"
      nextHref="/trips/new/places"
      buttonLabel="장소 선택하기 →"
    />
  );
}
