import QuestionStepPage from "@/components/QuestionStepPage";

export default function TripPreferenceStepOnePage() {
  return (
    <QuestionStepPage
      step={1}
      nextHref="/trips/new/step2"
      title="어떤 여행을 원하세요?"
      subtitle=""
    />
  );
}
