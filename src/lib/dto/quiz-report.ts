export type QuizQuestionDto = {
  question_text?: string;
  points?: number;
};

export type QuizReportQuizDto = {
  id: string;
  title?: string;
  type?: string;
  start_time?: string;
  learning_group_id?: string;
  learning_group_name?: string;
  quiz_questions?: QuizQuestionDto[];
};

export type QuizReportSessionDto = {
  id: string;
  quiz_id: string;
  user_id: string;
  user_name?: string;
  status?: string;
  score?: number;
  cheating_count?: number;
  start_time?: string;
};

export type QuizReportMemberDto = {
  user_id: string;
  user_name?: string;
  learning_group_id?: string;
  learning_group_name?: string;
};
