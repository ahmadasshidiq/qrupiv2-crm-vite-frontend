import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RichTextEditorProps = { name: string; value?: string; disabled?: boolean };

export function RichTextEditor({
  name,
  value = "",
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value)
      editorRef.current.innerHTML = value;
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

  function addImage() {
    const url = window.prompt("Masukkan URL gambar");
    if (url) run("insertImage", url);
  }

  function setFontSize(size: string) {
    const value = Math.min(300, Math.max(8, Number(size) || 16));
    editorRef.current?.focus();
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((element) => {
      (element as HTMLElement).removeAttribute("size");
      (element as HTMLElement).style.fontSize = `${value}px`;
    });
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-white dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2 border-b border-input bg-slate-50 p-3 dark:bg-white/[0.04]">
        <Select defaultValue="16" onValueChange={(size) => setFontSize(size ?? "16")} disabled={disabled}>
          <SelectTrigger aria-label="Ukuran font dalam pixel" className="h-8 w-16 px-2 text-xs" title="Ukuran font (px)">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
          {[
            8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 80, 96, 120,
            144, 180, 220, 260, 300,
          ].map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground mr-2">px</span>
        <Select defaultValue="Arial" onValueChange={(font) => font && run("fontName", font)} disabled={disabled}>
          <SelectTrigger aria-label="Jenis font" className="h-8 w-28 px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="Tahoma">Tahoma</SelectItem>
          </SelectContent>
        </Select>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("bold")}
          disabled={disabled}
          title="Tebal"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("italic")}
          disabled={disabled}
          title="Miring"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("underline")}
          disabled={disabled}
          title="Garis bawah"
        >
          <Underline className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("insertUnorderedList")}
          disabled={disabled}
          title="Daftar"
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("insertOrderedList")}
          disabled={disabled}
          title="Daftar bernomor"
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={addLink}
          disabled={disabled}
          title="Tautan"
        >
          <Link className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={addImage}
          disabled={disabled}
          title="Gambar"
        >
          <ImagePlus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => run("removeFormat")}
          disabled={disabled}
          title="Hapus format"
        >
          <RemoveFormatting className="size-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("justifyLeft")} disabled={disabled} title="Rata kiri"><AlignLeft className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("justifyCenter")} disabled={disabled} title="Rata tengah"><AlignCenter className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("justifyRight")} disabled={disabled} title="Rata kanan"><AlignRight className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => run("justifyFull")} disabled={disabled} title="Rata kiri-kanan"><AlignJustify className="size-4" /></Button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-label="Isi dokumen"
        onInput={(event) => setHtml(event.currentTarget.innerHTML)}
        className="rich-text-editor-content min-h-56 px-3 py-3 text-sm leading-7 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        data-placeholder="Tulis isi dokumen di sini..."
      />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
