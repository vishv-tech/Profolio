import { LoaderCircle, Palette } from "lucide-react";

export default function ThemesLoading() {
  return (
    <main className="grid min-h-[70svh] place-items-center bg-[#fffdf8] p-8 text-center text-[#17372e]">
      <div className="rounded-3xl border border-[#17372e]/15 bg-white/80 px-10 py-9 shadow-[0_22px_60px_rgba(23,55,46,0.08)]">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#dce6d7]">
          <Palette aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-5 font-serif text-xl font-semibold tracking-tight">
          Opening your Theme Store
        </p>
        <p className="mt-2 text-xs text-[#607168]">
          Preparing your private portfolio previews.
        </p>
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto mt-5 size-4 animate-spin text-[#b85d43]"
        />
      </div>
    </main>
  );
}
