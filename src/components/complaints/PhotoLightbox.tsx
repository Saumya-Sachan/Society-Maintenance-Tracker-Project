import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function PhotoLightbox({ urls }: { urls: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (urls.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((u, i) => (
          <button
            key={i} type="button" onClick={() => setOpenIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img src={u} alt={`Complaint photo ${i + 1}`} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {openIndex !== null && (
            <img src={urls[openIndex]} alt="Complaint attachment"
              className="max-h-[85vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
