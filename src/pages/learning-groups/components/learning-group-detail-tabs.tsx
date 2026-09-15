import { useState } from "react";
import { LearningGroupMembersList } from "./learning-group-members-list";
import { LearningGroupResourcesList } from "./learning-group-resources-list";
import { LearningGroupQuizSessionsList } from "./learning-group-quiz-sessions-list";
import { LearningGroupQuizzesList } from "./learning-group-quizzes-list";

export function LearningGroupDetailTabs({ groupId }: { groupId: string }) {
  const [activeTab, setActiveTab] = useState<"resources" | "members" | "quizzes" | "sessions">(
    "resources",
  );

  return (
    <section className="border-t border-slate-100 pt-6 dark:border-white/10">
      <div
        className="mb-5 flex w-full border-b border-slate-200 dark:border-white/10"
        role="tablist"
        aria-label="Detail grup pembelajaran"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "resources"}
          className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "resources"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("resources")}
        >
          Materi Belajar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "members"}
          className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("members")}
        >
          Anggota Grup
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "quizzes"}
          className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "quizzes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("quizzes")}
        >
          Kuis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sessions"}
          className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "sessions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("sessions")}
        >
          Riwayat Sesi & Nilai
        </button>
      </div>

      <div className="[&>section]:border-t-0 [&>section]:pt-0">
        {activeTab === "resources" ? (
          <LearningGroupResourcesList groupId={groupId} />
        ) : activeTab === "members" ? (
          <LearningGroupMembersList groupId={groupId} />
        ) : activeTab === "quizzes" ? (
          <LearningGroupQuizzesList groupId={groupId} />
        ) : (
          <LearningGroupQuizSessionsList groupId={groupId} />
        )}
      </div>
    </section>
  );
}
