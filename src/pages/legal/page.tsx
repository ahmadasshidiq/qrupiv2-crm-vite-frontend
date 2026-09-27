import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import qrupiLogo from "@/assets/qrupi-logo.png";
import qrupiLogoWhite from "@/assets/qrupi-logo-white.png";
import { apiRequest } from "@/lib/api/client";

type LegalSection = { title: string; paragraphs: string[] };
type PublishedLegalDocument = { title: string; content: string; version?: string; effective_date?: string };
type LegalListResponse = {
  data?: PublishedLegalDocument[] | { data?: PublishedLegalDocument[]; meta?: { totalData?: number } };
};

function normalizeLegalHtml(content: string) {
  const document = new DOMParser().parseFromString(content, "text/html");
  document.querySelectorAll("script, style, svg").forEach((node) => node.remove());
  document.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("style");
    node.removeAttribute("class");
    node.removeAttribute("onclick");
  });
  return document.body.innerHTML;
}

const termsSections: LegalSection[] = [
  {
    title: "1. Tentang Qrupi",
    paragraphs: [
      "Qrupi adalah platform pengelolaan ekosistem pendidikan yang membantu institusi mengelola pengguna, data institusi, grup belajar, materi pembelajaran, kuis, aktivitas, dan presensi melalui Qrupi CRM.",
      "Dengan menggunakan layanan Qrupi, Anda menyatakan bahwa Anda memiliki kewenangan untuk membuat akun atau menggunakan akun yang diberikan oleh institusi Anda.",
    ],
  },
  {
    title: "2. Akun dan keamanan",
    paragraphs: [
      "Anda bertanggung jawab menjaga kerahasiaan alamat email, kata sandi, dan kredensial lain yang digunakan untuk mengakses akun. Informasikan kepada administrator Qrupi apabila Anda mengetahui adanya penggunaan akun tanpa izin.",
      "Data akun harus akurat dan diperbarui apabila terjadi perubahan. Satu akun tidak boleh digunakan untuk mengakses data di luar kewenangan atau peran yang diberikan institusi.",
    ],
  },
  {
    title: "3. Penggunaan yang diperbolehkan",
    paragraphs: [
      "Anda boleh menggunakan layanan hanya untuk kebutuhan pendidikan dan administrasi institusi yang sah. Anda wajib menghormati hak pengguna lain dan memastikan data yang dimasukkan memiliki dasar penggunaan yang sesuai.",
      "Anda tidak boleh mengganggu keamanan atau kinerja layanan, mencoba memperoleh akses tanpa izin, mengunggah konten berbahaya, atau menggunakan layanan untuk melanggar hukum yang berlaku.",
    ],
  },
  {
    title: "4. Data dan konten institusi",
    paragraphs: [
      "Institusi dan pengguna tetap bertanggung jawab atas data, materi, hasil kuis, catatan presensi, serta konten lain yang dimasukkan ke dalam layanan. Pastikan Anda memiliki hak dan izin yang diperlukan sebelum mengunggahnya.",
      "Qrupi dapat memproses data tersebut untuk menyediakan, menjaga, dan meningkatkan fungsi layanan sesuai pengaturan akses dan instruksi institusi.",
    ],
  },
  {
    title: "5. Ketersediaan dan perubahan layanan",
    paragraphs: [
      "Kami berupaya menjaga layanan tetap aman dan tersedia, tetapi layanan dapat mengalami pemeliharaan, gangguan jaringan, atau perubahan fitur. Kami dapat memperbarui, menangguhkan, atau menghentikan bagian layanan dengan mempertimbangkan kebutuhan operasional dan keamanan.",
      "Ketentuan ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan disampaikan melalui layanan atau kanal komunikasi yang tersedia.",
    ],
  },
  {
    title: "6. Hubungi kami",
    paragraphs: [
      "Jika Anda memiliki pertanyaan tentang ketentuan ini atau menemukan masalah keamanan, hubungi administrator institusi atau kontak resmi Qrupi yang diberikan kepada Anda.",
    ],
  },
];

const privacySections: LegalSection[] = [
  {
    title: "1. Ruang lingkup",
    paragraphs: [
      "Kebijakan ini menjelaskan bagaimana Qrupi memproses informasi saat Anda menggunakan Qrupi CRM dan fitur ekosistem pendidikan yang terhubung dengannya. Kebijakan ini berlaku untuk pengguna seperti administrator, guru, staf, dan peran lain yang diberi akses oleh institusi.",
    ],
  },
  {
    title: "2. Informasi yang kami proses",
    paragraphs: [
      "Informasi akun dapat mencakup nama, alamat email, peran, institusi, dan kredensial yang diperlukan untuk autentikasi. Dalam operasional pendidikan, layanan dapat memproses data grup belajar, anggota, materi, aktivitas, hasil kuis, serta catatan kehadiran yang dimasukkan oleh institusi atau pengguna berwenang.",
      "Kami juga dapat menerima informasi teknis seperti alamat IP, jenis perangkat, browser, waktu akses, dan catatan aktivitas yang diperlukan untuk keamanan, audit, dan pemecahan masalah.",
    ],
  },
  {
    title: "3. Tujuan penggunaan data",
    paragraphs: [
      "Data digunakan untuk menyediakan akses berbasis peran, menampilkan dan mengelola fitur CRM, menjalankan presensi dan pembelajaran, membuat laporan, menjaga keamanan akun, memberikan dukungan, serta meningkatkan keandalan layanan.",
      "Kami tidak menggunakan data pendidikan untuk tujuan yang tidak berkaitan dengan penyediaan layanan tanpa dasar atau izin yang sesuai.",
    ],
  },
  {
    title: "4. Akses dan pembagian informasi",
    paragraphs: [
      "Akses data dibatasi berdasarkan peran dan kewenangan institusi. Kami dapat membagikan informasi kepada penyedia layanan yang membantu operasional teknis Qrupi, dengan kewajiban menjaga keamanan dan kerahasiaannya, atau apabila diwajibkan oleh hukum.",
      "Qrupi tidak menjual informasi pribadi pengguna. Institusi Anda dapat memiliki kebijakan tambahan mengenai data yang mereka masukkan dan mengelola akses Anda ke dalam layanan.",
    ],
  },
  {
    title: "5. Penyimpanan dan keamanan",
    paragraphs: [
      "Kami menerapkan langkah teknis dan organisatoris yang wajar untuk melindungi data dari akses, perubahan, pengungkapan, atau penghancuran tanpa izin. Data disimpan selama diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, menyelesaikan sengketa, dan menegakkan perjanjian.",
      "Tidak ada sistem yang sepenuhnya bebas risiko. Gunakan kata sandi yang kuat dan segera laporkan aktivitas mencurigakan kepada administrator institusi atau Qrupi.",
    ],
  },
  {
    title: "6. Hak dan permintaan pengguna",
    paragraphs: [
      "Sesuai peraturan yang berlaku, Anda dapat meminta informasi mengenai data pribadi Anda, melakukan koreksi, atau menyampaikan keberatan dan permintaan penghapusan melalui administrator institusi atau kontak resmi Qrupi. Kami mungkin perlu memverifikasi identitas dan kewenangan sebelum memenuhi permintaan.",
    ],
  },
  {
    title: "7. Perubahan kebijakan",
    paragraphs: [
      "Kami dapat memperbarui kebijakan ini untuk mencerminkan perubahan layanan, hukum, atau praktik pemrosesan data. Versi terbaru akan ditampilkan pada halaman ini beserta tanggal berlakunya.",
    ],
  },
];

export default function LegalPage() {
  void termsSections;
  void privacySections;
  const isPrivacy = useLocation().pathname === "/privacy";
  const slug = isPrivacy ? "privacy" : "terms";
  const fallbackTitle = isPrivacy ? "Kebijakan Privasi" : "Ketentuan Layanan";
  const sections: LegalSection[] = [];
  const [document, setDocument] = useState<PublishedLegalDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<LegalListResponse>(
      `/legal-documents?slug=${slug}&status=published&limit=1`,
      { authenticated: false },
    ).then((response) => {
      const rows = Array.isArray(response.data) ? response.data : response.data?.data;
      const result = rows?.[0];
      if (active && result?.content) setDocument(result);
    }).catch(() => undefined).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  const title = document?.title ?? fallbackTitle;
  const updatedDate = document?.effective_date
    ? new Date(document.effective_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "24 September 2026";

  return (
    <main className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-[#0b1928] dark:text-zinc-100">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0b1928]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/login" aria-label="Kembali ke halaman login">
            <img src={qrupiLogo} alt="Qrupi" className="w-24 dark:hidden" />
            <img src={qrupiLogoWhite} alt="Qrupi" className="hidden w-24 dark:block" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="size-4" /> Kembali ke login
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-700 px-6 py-8 text-white shadow-lg shadow-blue-900/10 sm:px-10 sm:py-10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/12 p-3">
              <ShieldCheck className="size-7 text-blue-100" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-blue-100">
                Qrupi · QR untuk pelajar Indonesia
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm text-blue-100">
                Terakhir diperbarui {updatedDate}{document?.version ? ` · Versi ${document.version}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className={sections.length > 0 ? "grid items-start gap-8 lg:grid-cols-[190px_minmax(0,760px)] lg:justify-center lg:gap-12" : "mx-auto max-w-[760px]"}>
          {sections.length > 0 && <aside className="hidden lg:sticky lg:top-8 lg:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Daftar isi
            </p>
            <nav className="space-y-2 border-l border-zinc-200 pl-4 dark:border-zinc-800">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title}`}
                  className="block text-xs leading-5 text-zinc-500 transition hover:text-blue-700 dark:hover:text-blue-400"
                >
                  {section.title.replace(/^\d+\. /, "")}
                </a>
              ))}
            </nav>
          </aside>}
          <article className="rounded-3xl border border-zinc-200/80 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900">
            {loading ? (
              <p className="text-sm text-zinc-500">Memuat dokumen...</p>
            ) : document?.content ? (
              <div className="legal-content text-sm leading-7 text-zinc-600 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: normalizeLegalHtml(document.content) }} />
            ) : (
              <div className="py-12 text-center">
                <p className="font-medium text-zinc-700 dark:text-zinc-200">Dokumen belum tersedia</p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Dokumen ini belum dipublikasikan.</p>
              </div>
            )}
          </article>
        </div>
        <nav className="mt-8 flex justify-center gap-5 text-sm text-zinc-500">
          <Link className="hover:text-blue-700" to="/terms">
            Ketentuan Layanan
          </Link>
          <span>·</span>
          <Link className="hover:text-blue-700" to="/privacy">
            Kebijakan Privasi
          </Link>
        </nav>
      </div>
    </main>
  );
}
