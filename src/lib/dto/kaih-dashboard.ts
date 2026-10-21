export const KAIH_CATEGORIES = [
  "Bangun Pagi",
  "Beribadah",
  "Bermasyarakat",
  "Berolahraga",
  "Gemar Belajar",
  "Makan Sehat dan Bergizi",
  "Tidur Cepat",
] as const;

export type KaihCategory = (typeof KAIH_CATEGORIES)[number];

export type KaihDashboardQueryDto = {
  start_date: string;
  end_date: string;
  learning_group_id?: string | null;
};

export type KaihDashboardStudentDto = {
  no: number;
  user_id: string;
  nama: string;
  kategori: Partial<Record<KaihCategory, number>>;
  rata_rata_nilai: number;
  predikat: string;
};

export type KaihDashboardResponseDto = {
  start_date: string;
  end_date: string;
  jumlah_hari: number;
  minimum_per_kategori: number;
  students: KaihDashboardStudentDto[];
};
