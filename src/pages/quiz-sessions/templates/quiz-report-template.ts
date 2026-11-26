import { escapeHtml as html } from "@/lib/helper/html";
import {
  QUIZ_GRADE_COMPONENTS,
  formatGrade,
  getEffectiveWeights,
  getGradeComponentLabel,
  type QuizGradeWeights,
} from "@/lib/helper/quiz-grade";
import type { QuizResultSummary, StudentTranscript } from "../types";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  submitted: { label: "Selesai", tone: "present" },
  timeout: { label: "Waktu habis", tone: "late" },
  in_progress: { label: "Belum selesai", tone: "absent" },
  not_started: { label: "Tidak mengerjakan", tone: "absent" },
};

export const QUIZ_REPORT_STYLES = `
  .section-title { margin: 28px 0 8px; font-size: 18px; color: #1d4ed8 }
  .num { text-align: center; font-variant-numeric: tabular-nums }
  .final { font-weight: 700; color: #1e3a8a }
  .low { color: #dc2626; font-weight: 700 }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px }
  .info-card { border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px }
  .info-card span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .5px }
  .info-card strong { display: block; margin-top: 4px; font-size: 14px; color: #0f172a }
  .note { margin-top: 10px; font-size: 11px; color: #64748b; line-height: 1.6 }
  .grade-box { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px }
  .grade-box .info-card { min-width: 150px; text-align: center; background: #eff6ff }
  .grade-box .info-card strong { font-size: 22px; color: #1d4ed8 }
  .signature { display: flex; justify-content: flex-end; margin-top: 40px; font-size: 12px; color: #334155 }
  .signature div { width: 220px; text-align: center }
  .signature .line { margin-top: 64px; border-top: 1px solid #94a3b8; padding-top: 4px }
`;

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function gradeCell(score: number | null | undefined, className = "num") {
  const low = score != null && score < 55 ? " low" : "";
  return `<td class="${className}${low}">${formatGrade(score ?? null)}</td>`;
}

function statusBadge(status: string) {
  const meta = STATUS_LABELS[status] ?? { label: status, tone: "absent" };
  return `<span class="status status-${meta.tone}">${html(meta.label)}</span>`;
}

function infoCard(label: string, value: string) {
  return `<div class="info-card"><span>${html(label)}</span><strong>${value}</strong></div>`;
}

export function renderWeightNote(weights: QuizGradeWeights) {
  const parts = QUIZ_GRADE_COMPONENTS.map(({ key, label }) => `${label} ${weights[key]}`).join(" · ");
  return `<p class="note"><strong>Bobot nilai akhir:</strong> ${html(parts)}. Nilai tiap kuis dikonversi ke skala 0–100. Kuis yang tidak dikerjakan bernilai 0. Komponen tanpa kuis tidak dihitung dan bobotnya dibagi ke komponen lain. Predikat: A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, E &lt; 40.</p>`;
}

export function renderRecap(transcripts: StudentTranscript[], weights: QuizGradeWeights) {
  const rows = transcripts
    .map((student, index) => {
      const finished = student.entries.filter((entry) => ["submitted", "timeout"].includes(entry.status)).length;
      return `<tr>
        <td class="num">${index + 1}</td>
        <td>${html(student.name)}</td>
        <td>${html(student.learningGroupName)}</td>
        ${QUIZ_GRADE_COMPONENTS.map(({ key }) => gradeCell(student.componentAverages[key])).join("")}
        ${gradeCell(student.finalScore, "num final")}
        <td class="num final">${student.predicate}</td>
        <td class="num">${finished}/${student.entries.length}</td>
      </tr>`;
    })
    .join("");
  const finals = transcripts.map((student) => student.finalScore).filter((score): score is number => score != null);
  const classAverage = finals.length ? finals.reduce((total, score) => total + score, 0) / finals.length : null;
  return `<div class="info-grid">
      ${infoCard("Jumlah siswa", String(transcripts.length))}
      ${infoCard("Rata-rata nilai akhir", formatGrade(classAverage))}
      ${infoCard("Nilai akhir tertinggi", formatGrade(finals.length ? Math.max(...finals) : null))}
      ${infoCard("Nilai akhir terendah", formatGrade(finals.length ? Math.min(...finals) : null))}
    </div>
    <h2 class="section-title">Rekap Nilai Siswa</h2>
    <table class="student-summary"><thead><tr>
      <th class="num" style="width:4%">No</th><th>Nama Siswa</th><th>Grup Belajar</th>
      ${QUIZ_GRADE_COMPONENTS.map(({ label }) => `<th class="num" style="width:8%">${label}</th>`).join("")}
      <th class="num" style="width:9%">Nilai Akhir</th><th class="num" style="width:7%">Predikat</th><th class="num" style="width:8%">Kuis Selesai</th>
    </tr></thead><tbody>${rows || `<tr><td colspan="11">Tidak ada data nilai pada periode ini.</td></tr>`}</tbody></table>
    ${renderWeightNote(weights)}`;
}

function renderTranscript(student: StudentTranscript, weights: QuizGradeWeights) {
  const shares = getEffectiveWeights(student.componentAverages, weights);
  const quizRows = student.entries
    .map((entry, index) => `<tr>
      <td class="num">${index + 1}</td>
      <td>${html(entry.title)}</td>
      <td>${getGradeComponentLabel(entry.component)}</td>
      <td>${formatDate(entry.date)}</td>
      <td>${statusBadge(entry.status)}</td>
      <td class="num">${entry.rawScore}/${entry.maxPoints || "-"}</td>
      ${gradeCell(entry.score, "num final")}
    </tr>`)
    .join("");
  const componentRows = QUIZ_GRADE_COMPONENTS.map(({ key, label }) => {
    const share = shares[key];
    const value = student.componentAverages[key];
    return `<tr>
      <td>${label}</td>
      <td class="num">${student.entries.filter((entry) => entry.component === key).length}</td>
      ${gradeCell(value)}
      <td class="num">${weights[key]}${share != null ? ` (${formatGrade(share * 100)}%)` : ""}</td>
      <td class="num">${share != null && value != null ? formatGrade(value * share) : "-"}</td>
    </tr>`;
  }).join("");
  return `<div class="info-grid">
      ${infoCard("Nama siswa", html(student.name))}
      ${infoCard("Grup belajar", html(student.learningGroupName))}
      ${infoCard("Jumlah kuis", String(student.entries.length))}
      ${infoCard("Kuis selesai", String(student.entries.filter((entry) => ["submitted", "timeout"].includes(entry.status)).length))}
    </div>
    <h2 class="section-title">Hasil Penilaian</h2>
    <table class="attendance-detail"><thead><tr>
      <th class="num" style="width:4%">No</th><th>Kuis</th><th style="width:9%">Jenis</th><th style="width:12%">Tanggal</th>
      <th style="width:14%">Status</th><th class="num" style="width:9%">Poin</th><th class="num" style="width:9%">Nilai</th>
    </tr></thead><tbody>${quizRows || `<tr><td colspan="7">Belum ada kuis pada periode ini.</td></tr>`}</tbody></table>
    <h2 class="section-title">Perhitungan Nilai Akhir</h2>
    <table class="attendance-detail"><thead><tr>
      <th>Komponen</th><th class="num">Jumlah Kuis</th><th class="num">Rata-rata</th><th class="num">Bobot</th><th class="num">Kontribusi</th>
    </tr></thead><tbody>${componentRows}</tbody></table>
    <div class="grade-box">
      ${infoCard("Nilai akhir", formatGrade(student.finalScore))}
      ${infoCard("Predikat", student.predicate)}
    </div>
    ${renderWeightNote(weights)}
    <div class="signature"><div>Guru / Wali Kelas<div class="line">&nbsp;</div></div></div>`;
}

export function renderTranscripts(transcripts: StudentTranscript[], weights: QuizGradeWeights) {
  if (transcripts.length === 0) return `<p class="note">Tidak ada siswa pada periode ini.</p>`;
  return transcripts.map((student) => renderTranscript(student, weights)).join('<div class="page-break"></div>');
}

function renderQuizResult(result: QuizResultSummary) {
  const rows = result.participants
    .map((participant, index) => `<tr>
      <td class="num">${index + 1}</td>
      <td>${html(participant.name)}</td>
      <td>${statusBadge(participant.status)}</td>
      <td class="num">${participant.rawScore}/${result.maxPoints || "-"}</td>
      ${gradeCell(participant.score, "num final")}
      <td class="num">${participant.cheatingCount || "-"}</td>
    </tr>`)
    .join("");
  return `<h2 class="section-title">${html(result.title)}</h2>
    <p>${html(result.learningGroupName)} · ${getGradeComponentLabel(result.component)} · ${formatDate(result.date)} · Poin maksimal ${result.maxPoints || "-"}</p>
    <div class="info-grid">
      ${infoCard("Selesai", `${result.finishedCount}/${result.participants.length}`)}
      ${infoCard("Rata-rata", formatGrade(result.average))}
      ${infoCard("Tertinggi", formatGrade(result.highest))}
      ${infoCard("Terendah", formatGrade(result.lowest))}
    </div>
    <table class="attendance-detail"><thead><tr>
      <th class="num" style="width:5%">Peringkat</th><th>Nama Siswa</th><th style="width:16%">Status</th>
      <th class="num" style="width:10%">Poin</th><th class="num" style="width:10%">Nilai</th><th class="num" style="width:10%">Peringatan</th>
    </tr></thead><tbody>${rows || `<tr><td colspan="6">Belum ada peserta.</td></tr>`}</tbody></table>`;
}

export function renderQuizResults(results: QuizResultSummary[]) {
  if (results.length === 0) return `<p class="note">Tidak ada kuis pada periode ini.</p>`;
  return results.map(renderQuizResult).join('<div class="page-break"></div>');
}
