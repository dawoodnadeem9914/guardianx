export default function HistoryLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <div className="gx-skeleton h-8 w-56" />
        <div className="gx-skeleton mt-3 h-4 w-72" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="gx-skeleton h-[76px] w-full" />
        ))}
      </div>
    </div>
  );
}