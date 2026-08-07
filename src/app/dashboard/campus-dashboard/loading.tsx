export default function CampusDashboardLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <div className="gx-skeleton h-8 w-56" />
        <div className="gx-skeleton mt-3 h-4 w-72" />
      </div>

      <div className="gx-skeleton h-16 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="gx-skeleton h-[104px] w-full" />
        ))}
      </div>

      <div className="gx-skeleton h-40 w-full" />
      <div className="gx-skeleton h-40 w-full" />
      <div className="gx-skeleton h-56 w-full" />
    </div>
  );
}