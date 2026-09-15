export type QuizRankingItemDto = {
  user_id?: string;
  user_name?: string;
  name?: string;
  score?: number;
  average_score?: number;
  total_score?: number;
  quiz_count?: number;
  completed_quizzes?: number;
};

export type QuizRankingResponseDto = {
  rankings?: QuizRankingItemDto[];
  data?: QuizRankingItemDto[];
};
