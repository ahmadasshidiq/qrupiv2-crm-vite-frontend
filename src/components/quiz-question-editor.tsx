import { useState } from "react";
import { CirclePlus, FileUp, ImageOff, Trash2, TriangleAlert, X } from "@/lib/icons";
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
import {
  QuizImportDialog,
  type QuizImportMode,
} from "@/components/quiz-import-dialog";
import type {
  QuizImportResultDto,
  QuizQuestionDto,
  QuizQuestionTypeDto as QuizQuestionType,
} from "@/lib/dto/quiz-import";

type QuizQuestion = Omit<QuizQuestionDto, "points"> & { points: number | "" };

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
    const source =
      question && typeof question === "object"
        ? (question as Partial<QuizQuestion>)
        : {};
    const type: QuizQuestionType = [
      "multiple_choice",
      "true_false",
      "fill_blank",
      "essay",
    ].includes(String(source.type))
      ? (String(source.type) as QuizQuestionType)
      : "multiple_choice";
    const defaultOptions =
      type === "true_false"
        ? [
            { label: "Benar", value: "true" },
            { label: "Salah", value: "false" },
          ]
        : createQuestion().options;
    const options =
      type === "fill_blank" || type === "essay"
        ? []
        : Array.isArray(source.options) && source.options.length >= 2
          ? source.options.map((option, index) => ({
              label: String(option?.label ?? ""),
              value: String(option?.value ?? String.fromCharCode(65 + index)),
            }))
          : defaultOptions;
    return {
      question_text: String(source.question_text ?? ""),
      type,
      options,
      correct_answer: String(source.correct_answer ?? options[0]?.value ?? "A"),
      points: Number(source.points ?? 1),
      ...(source.image_url ? { image_url: String(source.image_url) } : {}),
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
  const [importOpen, setImportOpen] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const applyImport = (result: QuizImportResultDto, mode: QuizImportMode) => {
    const imported = normalizeQuestions(result.questions);
    setQuestions((current) => {
      const hasContent = current.some((question) => question.question_text.trim());
      return mode === "replace" || !hasContent ? imported : [...current, ...imported];
    });
    setImportWarnings(result.warnings);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...updates } : question,
      ),
    );
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    label: string,
  ) => {
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

  const changeQuestionType = (
    questionIndex: number,
    type: QuizQuestionType,
  ) => {
    const options =
      type === "true_false"
        ? [
            { label: "Benar", value: "true" },
            { label: "Salah", value: "false" },
          ]
        : type === "multiple_choice"
          ? createQuestion().options
          : [];
    updateQuestion(questionIndex, {
      type,
      options,
      correct_answer:
        type === "true_false" ? "true" : type === "multiple_choice" ? "A" : "",
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(
          questions.map((question) => ({
            ...question,
            points: Number(question.points),
          })),
        )}
        required={required}
      />
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">Punya soal dalam bentuk PDF atau scan?</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Import untuk mengisi soal, tipe, pilihan jawaban, poin, dan gambar secara otomatis.
          </p>
        </div>
        <Button type="button" variant="outline" className="shrink-0" onClick={() => setImportOpen(true)}>
          <FileUp className="size-4" /> Import dari PDF/Scan
        </Button>
      </div>
      {importWarnings.length ? (
        <div className="relative rounded-xl border border-amber-200 bg-amber-50/60 p-4 pr-10 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <p className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="size-4" /> Periksa hasil import
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {importWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label="Tutup peringatan"
            onClick={() => setImportWarnings([])}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}
      {importOpen ? (
        <QuizImportDialog open onOpenChange={setImportOpen} onImported={applyImport} />
      ) : null}
      {questions.map((question, questionIndex) => (
        <article
          key={questionIndex}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Soal {questionIndex + 1}</h4>
            {questions.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                onClick={() =>
                  setQuestions((current) =>
                    current.filter((_, index) => index !== questionIndex),
                  )
                }
              >
                <Trash2 className="size-3.5" /> Hapus soal
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4">
            <div className="grid gap-1.5 sm:max-w-sm">
              <Label>Tipe soal</Label>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  changeQuestionType(questionIndex, value as QuizQuestionType)
                }
              >
                <SelectTrigger className="!h-9 !w-full !bg-white dark:!bg-white/[0.03]">
                  <span className="flex-1 text-left text-xs font-normal">
                    {
                      {
                        multiple_choice: "Pilihan ganda",
                        true_false: "Benar / Salah",
                        fill_blank: "Isian",
                        essay: "Essay",
                      }[question.type]
                    }
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Pilihan ganda</SelectItem>
                  <SelectItem value="true_false">Benar / Salah</SelectItem>
                  <SelectItem value="fill_blank">Isian</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`quiz-question-${questionIndex}`}>
                Pertanyaan
              </Label>
              <Textarea
                id={`quiz-question-${questionIndex}`}
                className="min-h-20 bg-white text-sm dark:bg-white/[0.03]"
                placeholder="Tulis pertanyaan soal"
                value={question.question_text}
                required={required}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    question_text: event.target.value,
                  })
                }
              />
            </div>
            {question.image_url ? (
              <div className="grid gap-1.5">
                <Label>Gambar soal</Label>
                <div className="flex items-start gap-2">
                  <img
                    src={question.image_url}
                    alt={`Gambar soal ${questionIndex + 1}`}
                    className="max-h-56 max-w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-white/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                    onClick={() => updateQuestion(questionIndex, { image_url: undefined })}
                  >
                    <ImageOff className="size-3.5" /> Hapus gambar
                  </Button>
                </div>
              </div>
            ) : null}
            {question.options.length > 0 ? (
              <div className="grid gap-2">
                <Label>Pilihan jawaban</Label>
                {question.options.map((option, optionIndex) => (
                  <div key={option.value} className="flex items-center gap-2">
                    {question.type === "true_false" ? (
                      <div className="flex h-10 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                        <span
                          className={`mr-2 size-2 rounded-full ${option.value === "true" ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                        {option.label}
                      </div>
                    ) : (
                      <>
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {option.value}
                        </span>
                        <Input
                          className="h-9 bg-white text-sm dark:bg-white/[0.03]"
                          placeholder={`Pilihan ${option.value}`}
                          value={option.label}
                          required={required}
                          onChange={(event) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              event.target.value,
                            )
                          }
                        />
                      </>
                    )}
                    {question.options.length > 2 &&
                    question.type === "multiple_choice" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600"
                        aria-label={`Hapus pilihan ${option.value}`}
                        onClick={() => {
                          const options = question.options.filter(
                            (_, index) => index !== optionIndex,
                          );
                          updateQuestion(questionIndex, {
                            options,
                            correct_answer: options.some(
                              (item) => item.value === question.correct_answer,
                            )
                              ? question.correct_answer
                              : (options[0]?.value ?? ""),
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {question.type === "multiple_choice" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => {
                      const value = String.fromCharCode(
                        65 + question.options.length,
                      );
                      updateQuestion(questionIndex, {
                        options: [...question.options, { label: "", value }],
                      });
                    }}
                  >
                    <CirclePlus className="size-3.5" /> Tambah pilihan
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>
                  Jawaban benar
                  {!question.correct_answer ? (
                    <span className="ml-1 text-xs font-normal text-red-600 dark:text-red-400">
                      (belum diisi)
                    </span>
                  ) : null}
                </Label>
                {question.options.length > 0 ? (
                  <Select
                    value={question.correct_answer}
                    onValueChange={(value) =>
                      updateQuestion(questionIndex, {
                        correct_answer: value ?? "",
                      })
                    }
                  >
                    <SelectTrigger className="!h-9 !w-full !bg-white dark:!bg-white/[0.03]">
                      <span className="flex-1 text-left text-xs font-normal">
                        {question.options.find(
                          (option) => option.value === question.correct_answer,
                        )?.label || "Pilih jawaban"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {question.type === "true_false"
                            ? option.label
                            : `${option.value}. ${option.label || `Pilihan ${option.value}`}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={question.correct_answer}
                    placeholder={
                      question.type === "essay"
                        ? "Masukkan kunci/rubrik jawaban"
                        : "Masukkan jawaban yang benar"
                    }
                    required={required}
                    className="h-9 bg-white text-sm dark:bg-white/[0.03]"
                    onChange={(event) =>
                      updateQuestion(questionIndex, {
                        correct_answer: event.target.value,
                      })
                    }
                  />
                )}
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
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      points:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        </article>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setQuestions((current) => [...current, createQuestion()])
        }
      >
        <CirclePlus className="size-4" /> Tambah soal
      </Button>
    </div>
  );
}
