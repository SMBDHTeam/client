import QuestionStep from "@/components/QuestionStep";

export default function AiStep2Page() {
  return (
    <QuestionStep
      uiStep={2}
      stepIndex={2}
      total={3}
      headerTitle="일정 스타일"
      title="선호하는 여행 일정은?"
      subtitle="일정 밀도와 이동 방식을 골라 주세요"
      nextHref="/trips/new/step3"
    />
  );
}
