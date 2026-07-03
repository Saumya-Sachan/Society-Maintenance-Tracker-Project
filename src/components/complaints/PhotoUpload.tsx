import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function PhotoUpload({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ACCEPT.includes(f.type)) { setError("Only JPG, PNG, or WEBP images are supported."); continue; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Images must be under ${MAX_SIZE_MB}MB.`); continue; }
      valid.push(f);
    }
    const merged = [...files, ...valid].slice(0, MAX_FILES);
    onChange(merged);
  };

  const remove = (idx: number) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-elevated px-6 py-8 text-center transition-colors hover:border-secondary hover:bg-primary-soft/40",
          files.length >= MAX_FILES && "pointer-events-none opacity-60",
        )}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          {files.length >= MAX_FILES ? "Maximum photos reached" : "Click to upload or drag & drop"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP · up to {MAX_SIZE_MB}MB · max {MAX_FILES} photos</p>
        <input
          ref={inputRef} type="file" accept={ACCEPT.join(",")} multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <img src={url} alt={file.name} className="h-full w-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                <Button
                  type="button" size="icon" variant="destructive"
                  className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 transition group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); remove(idx); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-[10px] text-white">
                  <ImageIcon className="h-3 w-3" />
                  <span className="truncate">{file.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
