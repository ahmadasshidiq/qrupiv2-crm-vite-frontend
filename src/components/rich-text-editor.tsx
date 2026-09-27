import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link, List, ListOrdered, RemoveFormatting, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";

type RichTextEditorProps = { name: string; value?: string; disabled?: boolean };

export function RichTextEditor({ name, value = "", disabled = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Masukkan URL tautan");
    if (url) run("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-white dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-slate-50 p-2 dark:bg-white/[0.04]">
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("formatBlock", "p")} disabled={disabled} title="Paragraf">P</Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("formatBlock", "h2")} disabled={disabled} title="Judul">H</Button>
        <select
          aria-label="Ukuran font"
          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          defaultValue="3"
          onChange={(event) => run("fontSize", event.target.value)}
          disabled={disabled}
        >
          <option value="2">Kecil</option>
          <option value="3">Normal</option>
          <option value="4">Besar</option>
          <option value="5">Sangat besar</option>
        </select>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("bold")} disabled={disabled} title="Tebal"><Bold className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("italic")} disabled={disabled} title="Miring"><Italic className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("underline")} disabled={disabled} title="Garis bawah"><Underline className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("insertUnorderedList")} disabled={disabled} title="Daftar"><List className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("insertOrderedList")} disabled={disabled} title="Daftar bernomor"><ListOrdered className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={addLink} disabled={disabled} title="Tautan"><Link className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("removeFormat")} disabled={disabled} title="Hapus format"><RemoveFormatting className="size-4" /></Button>
      </div>
      <div ref={editorRef} contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-label="Isi dokumen" onInput={(event) => setHtml(event.currentTarget.innerHTML)} className="rich-text-editor-content min-h-56 px-3 py-3 text-sm leading-7 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]" data-placeholder="Tulis isi dokumen di sini..." />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
