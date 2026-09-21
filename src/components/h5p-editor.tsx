import { H5PEditorUI } from "@lumieducation/h5p-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { h5pService } from "@/services/h5p.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { H5PPlayer } from "@/components/h5p-player";

export type H5PEditorHandle = {
  save: () => Promise<string | undefined>;
};

type H5PEditorProps = {
  contentId?: string;
  onSaved?: (contentId: string) => void;
};

export const H5PEditor = forwardRef<H5PEditorHandle, H5PEditorProps>(
  ({ contentId = "new", onSaved }, ref) => {
    const editorRef = useRef<H5PEditorUI>(null);
    const [saving, setSaving] = useState(false);
    const [savedContentId, setSavedContentId] = useState(
      contentId !== "new" ? contentId : "",
    );
    const saveEditor = async () => {
      setSaving(true);
      try {
        const result = await editorRef.current?.save();
        if (result?.contentId) {
          setSavedContentId(result.contentId);
          // H5PEditorUI emits `onSaved`; the parent owns the single success toast.
        } else {
          toast.error("Media H5P belum valid. Periksa field yang masih merah.");
        }
        return result?.contentId;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Media H5P gagal disimpan.",
        );
        return undefined;
      } finally {
        setSaving(false);
      }
    };
    useImperativeHandle(ref, () => ({ save: saveEditor }));

    return (
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950 sm:p-5">
        <H5PEditorUI
          ref={editorRef}
          contentId={contentId}
          loadContentCallback={h5pService.getEdit}
          saveContentCallback={h5pService.save}
          onSaved={(newContentId) => {
            setSavedContentId(newContentId);
            onSaved?.(newContentId);
          }}
          onSaveError={() => toast.error("Media H5P gagal disimpan.")}
        />
        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
          <div className="flex gap-2">
            {savedContentId ? (
              <Button
                className="p-4"
                type="button"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("h5p-preview")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Preview
              </Button>
            ) : null}
            <Button
              className="bg-green-600 p-4 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
              type="button"
              disabled={saving}
              onClick={() => void saveEditor()}
            >
              {saving ? "Menyimpan media..." : "Simpan Media H5P"}
            </Button>
          </div>
        </div>
        {savedContentId ? (
          <div
            id="h5p-preview"
            className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10"
          >
            <p className="mb-3 text-sm font-semibold">
              Preview media interaktif
            </p>
            <H5PPlayer contentId={savedContentId} />
          </div>
        ) : null}
      </div>
    );
  },
);

H5PEditor.displayName = "H5PEditor";
