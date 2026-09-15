import { useState } from "react";
import { CirclePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type QuizOption = { label: string; value: string };
type QuizQuestion = {
  question_text: string;
  type: "multiple_choice";
  options: QuizOption[];
  correct_answer: string;
  points: number;
};

const createQuestion = (): QuizQuestion => ({
  question_text: "",
  type: "multiple_choice",
  options: [
    { label: "", value: "A" },
    { label: "", value: "B" },
  ],
  correct_answer: "A",
  points: 1,
});

function normalizeQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || !value.length) return [createQuestion()];

  return value.map((question) => {
    const source = question && typeof question === "object" ? question as Partial<QuizQuestion> : {};
    const options = Array.isArray(source.options) && source.options.length >= 2
      ? source.options.map((option, index) => ({
          label: String(option?.label ?? ""),
          value: String(option?.value ?? String.fromCharCode(65 + index)),
        }))
      : createQuestion().options;
    return {
      question_text: String(source.question_text ?? ""),
      type: "multiple_choice",
      options,
      correct_answer: String(source.correct_answer ?? options[0]?.value ?? "A"),
      points: Number(source.points ?? 1),
    };
  });
}

export function QuizQuestionEditor({
  name,
  required,
  initialQuestions,
}: {
  name: string;
  required?: boolean;
  initialQuestions?: unknown;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    normalizeQuestions(initialQuestions),
  );

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...updates } : question,
      ),
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, label: string) => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, label } : option,
          ),
        };
      }),
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <input type="hidden" name={name} value={JSON.stringify(questions)} required={required} />
      {questions.map((question, questionIndex) => (
        <article key={questionIndex} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Soal {questionIndex + 1}</h4>
            {questions.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}
              >
                <Trash2 className="size-3.5" /> Hapus soal
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`quiz-question-${questionIndex}`}>Pertanyaan</Label>
              <Textarea
                id={`quiz-question-${questionIndex}`}
                className="min-h-20 bg-white text-sm dark:bg-white/[0.03]"
                placeholder="Tulis pertanyaan soal"
                value={question.question_text}
                required={required}
                onChange={(event) => updateQuestion(questionIndex, { question_text: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Pilihan jawaban</Label>
              {question.options.map((option, optionIndex) => (
                <div key={option.value} className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {option.value}
                  </span>
                  <Input
                    className="h-9 bg-white text-sm dark:bg-white/[0.03]"
                    placeholder={`Pilihan ${option.value}`}
                    value={option.label}
                    required={required}
                    onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                  />
                  {question.options.length > 2 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600"
                      aria-label={`Hapus pilihan ${option.value}`}
                      onClick={() => {
                        const options = question.options.filter((_, index) => index !== optionIndex);
                        updateQuestion(questionIndex, {
                          options,
                          correct_answer: options.some((item) => item.value === question.correct_answer)
                            ? question.correct_answer
                            : options[0]?.value ?? "",
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  const value = String.fromCharCode(65 + question.options.length);
                  updateQuestion(questionIndex, {
                    options: [...question.options, { label: "", value }],
                  });
                }}
              >
                <CirclePlus className="size-3.5" /> Tambah pilihan
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Jawaban benar</Label>
                <Select
                  value={question.correct_answer}
                  onValueChange={(value) => updateQuestion(questionIndex, { correct_answer: value ?? "" })}
                >
                  <SelectTrigger className="!h-9 !w-full !bg-white dark:!bg-white/[0.03]">
                    <span className="flex-1 text-left text-xs font-normal">
                      {question.options.find((option) => option.value === question.correct_answer)?.label || "Pilih jawaban"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value}. {option.label || `Pilihan ${option.value}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`quiz-points-${questionIndex}`}>Poin</Label>
                <Input
                  id={`quiz-points-${questionIndex}`}
                  type="number"
                  min="1"
                  className="h-9 bg-white text-sm dark:bg-white/[0.03]"
                  value={question.points}
                  required={required}
                  onChange={(event) => updateQuestion(questionIndex, { points: Number(event.target.value) })}
                />
              </div>
            </div>
          </div>
        </article>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => setQuestions((current) => [...current, createQuestion()])}
      >
        <CirclePlus className="size-4" /> Tambah soal
      </Button>
    </div>
  );
}
