export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="טוען">
      <div className="h-10 w-64 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-[6px] bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
