export type QuizQuestionTypeDto =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "essay";

export type QuizOptionDto = { label: string; value: string };

export type QuizQuestionDto = {
  question_text: string;
  type: QuizQuestionTypeDto;
  options: QuizOptionDto[];
  correct_answer: string;
  points: number;
  image_url?: string;
};

export type QuizImportResultDto = {
  questions: QuizQuestionDto[];
  warnings: string[];
  total_pages: number;
  ocr_pages: number;
};
