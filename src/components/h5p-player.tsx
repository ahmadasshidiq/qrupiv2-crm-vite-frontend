import { H5PPlayerUI } from "@lumieducation/h5p-react";
import type { IPlayerModel } from "@lumieducation/h5p-server";
import { h5pService } from "@/services/h5p.service";

export function H5PPlayer({ contentId }: { contentId: string }) {
  return (
    <div className="min-h-32 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
      <H5PPlayerUI
        contentId={contentId}
        loadContentCallback={(id): Promise<IPlayerModel> =>
          h5pService.getPlay(id)
        }
        readOnlyState
      />
    </div>
  );
}
