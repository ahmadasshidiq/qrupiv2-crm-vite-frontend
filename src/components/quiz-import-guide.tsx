import type { ReactElement } from "react";
import { CheckCircle2, XCircle } from "@/lib/icons";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const EXAMPLE_DOCUMENT = `A. Pilihan Ganda
1. Ibu kota Indonesia adalah ...
   A. Bandung
   B. Jakarta
   C. Surabaya
   D. Medan
   Jawaban: B

B. Benar atau Salah
2. Matahari terbit dari barat.
   Jawaban: Salah

C. Isian
3. 5 + 7 = ...
   Jawaban: 12

D. Uraian
4. Jelaskan proses fotosintesis!`;

const DO_LIST = [
  "Setiap soal diawali nomor (1. 2. 3.) dan pilihan diawali huruf (A. B. C.).",
  "Pisahkan tipe soal dengan judul bagian: Pilihan Ganda, Benar atau Salah, Isian, Uraian.",
  'Tulis kunci di bawah soal (Jawaban: B) atau di halaman "Kunci Jawaban".',
  "Gunakan PDF asli hasil Word/Docs jika ada — paling akurat.",
  "Foto/scan tegak lurus, terang, satu halaman per foto.",
];

const DONT_LIST = [
  "Foto miring, buram, gelap, atau terpotong.",
  "Tulisan tangan atau coretan di atas soal.",
  "Soal dalam bentuk tabel kompleks atau dua kolom yang rapat.",
  "Dokumen yang bukan soal (cover, materi, daftar nilai).",
];

type QuizImportGuideProps = {
  trigger: ReactElement;
};

export function QuizImportGuide({ trigger }: QuizImportGuideProps) {
  return (
    <Popover>
      <PopoverTrigger openOnHover delay={150} render={trigger} />
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-[calc(100vw-2rem)] gap-3 overflow-y-auto sm:w-[30rem] p-5"
      >
        <PopoverHeader>
          <PopoverTitle>Panduan format dokumen</PopoverTitle>
          <PopoverDescription>
            Ikuti format ini agar soal, tipe, pilihan, dan jawaban terbaca
            dengan benar.
          </PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-3 text-sm">
          <div>
            <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
              Contoh isi dokumen
            </p>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {EXAMPLE_DOCUMENT}
            </pre>
          </div>
          <ul className="space-y-1.5">
            {DO_LIST.map((tip) => (
              <li
                key={tip}
                className="flex gap-2 text-slate-600 dark:text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {tip}
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
              Hindari
            </p>
            <ul className="space-y-1.5">
              {DONT_LIST.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 text-slate-600 dark:text-slate-300"
                >
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
