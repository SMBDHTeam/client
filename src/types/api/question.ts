export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export type TripQuestionAnswer = {
  id: string;
  label: string;
  displayOrder: number;
};

export type TripQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  uiStep: 1 | 2 | 3;
  displayOrder: number;
  answers: TripQuestionAnswer[];
};

export type TripQuestionsResponse = {
  items: TripQuestion[];
};
