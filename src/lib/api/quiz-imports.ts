import { apiRequest } from "@/lib/api/client";
import type { QuizImportResultDto } from "@/lib/dto/quiz-import";

export async function importQuizQuestions(files: File[], defaultPoints: number) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("default_points", String(defaultPoints));
  const response = await apiRequest<{ data?: QuizImportResultDto }>(
    "/quizzes/import-questions",
    { method: "POST", body: formData },
  );
  return {
    questions: response.data?.questions ?? [],
    warnings: response.data?.warnings ?? [],
    total_pages: response.data?.total_pages ?? 0,
    ocr_pages: response.data?.ocr_pages ?? 0,
  } satisfies QuizImportResultDto;
}
