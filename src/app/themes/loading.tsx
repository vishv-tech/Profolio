export default function ThemesLoading() {
  return (
    <main className="grid min-h-[70svh] place-items-center bg-muted/30 p-8 text-center">
      <div>
        <div className="mx-auto size-9 animate-pulse rounded-xl bg-muted" />
        <p className="mt-3 text-sm font-medium">Opening your Theme Store</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Loading the selected private draft.
        </p>
      </div>
    </main>
  );
}
