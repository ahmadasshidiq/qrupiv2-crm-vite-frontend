import { H5PEditorUI } from "@lumieducation/h5p-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { h5pService } from "@/services/h5p.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { H5PPlayer } from "@/components/h5p-player";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type H5PEditorHandle = {
  save: () => Promise<string | undefined>;
};

type H5PEditorProps = {
  contentId?: string;
  onSaved?: (contentId: string) => void;
  onDeleted?: () => void;
};

export const H5PEditor = forwardRef<H5PEditorHandle, H5PEditorProps>(
  ({ contentId = "new", onSaved, onDeleted }, ref) => {
    const [editorContentId, setEditorContentId] = useState(contentId || "new");
    const editorRef = useRef<H5PEditorUI>(null);
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [savedContentId, setSavedContentId] = useState(
      editorContentId !== "new" ? editorContentId : "",
    );
    const loadEditorContent = async (requestedContentId: string) => {
      try {
        return await h5pService.getEdit(requestedContentId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const missingContent =
          message.includes("content-file-missing") ||
          message.includes("content-missing") ||
          message.includes(" 404") ||
          message.includes(" 500");
        if (!missingContent || requestedContentId === "new") throw error;

        // The resource can still contain an old ID when its H5P was deleted
        // before the resource itself was saved. Start with a fresh editor.
        setSavedContentId("");
        setEditorContentId("new");
        onDeleted?.();
        return h5pService.getEdit("new");
      }
    };
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

    const deleteEditor = async () => {
      if (!savedContentId) return;
      setSaving(true);
      try {
        await h5pService.delete(savedContentId);
        setSavedContentId("");
        setDeleteOpen(false);
        onDeleted?.();
        toast.success("Media H5P berhasil dihapus.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Media H5P gagal dihapus.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950 sm:p-5">
        <H5PEditorUI
          ref={editorRef}
          // H5PEditorUI keeps its internal editor state after the initial
          // mount. Remount it when switching between a new/existing item so
          // the previous content type cannot leak into the next form.
          key={editorContentId}
          contentId={editorContentId}
          loadContentCallback={loadEditorContent}
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
            {savedContentId ? (
              <Button
                type="button"
                variant="outline"
                className="p-4 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                onClick={() => setDeleteOpen(true)}
              >
                Hapus Media H5P
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
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-5 px-6 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">Hapus Media H5P?</h2>
            <p className="text-sm text-slate-500">
              Konten H5P ini akan dihapus permanen dan tidak dapat dipulihkan.
              Simpan resource setelahnya agar relasinya ikut terhapus.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="p-4" onClick={() => setDeleteOpen(false)}>
                Batal
              </Button>
              <Button type="button" className="bg-red-600 p-4 text-white hover:bg-red-700" disabled={saving} onClick={() => void deleteEditor()}>
                {saving ? "Menghapus..." : "Hapus permanen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

H5PEditor.displayName = "H5PEditor";
