export default function Loading() {
  return (
    <div aria-busy="true" aria-label="טוען…" className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded-[6px] bg-surface-2" />
      <div className="mb-4 h-28 rounded-[6px] bg-surface-2" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-[6px] bg-surface-2/70" />
        ))}
      </div>
    </div>
  );
}
