import QuestionStep from "@/components/trip/QuestionStep";

export default function TripPreferenceStepOnePage() {
  return (
    <QuestionStep
      uiStep={1}
      stepIndex={1}
      total={3}
      headerTitle="여행 취향"
      title="누구와 떠나나요?"
      subtitle="여행 취향에 맞춰 코스를 짜드려요"
      nextHref="/trips/new/step2"
    />
  );
}
