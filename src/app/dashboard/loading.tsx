export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <div className="gx-skeleton h-8 w-64" />
        <div className="gx-skeleton mt-3 h-4 w-80" />
      </div>

      <div className="gx-skeleton h-20 w-full" />

      <div>
        <div className="gx-skeleton h-3 w-28" />
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gx-skeleton h-[104px] w-full" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="gx-skeleton h-72 w-full lg:col-span-2" />
        <div className="flex flex-col gap-6">
          <div className="gx-skeleton h-48 w-full" />
          <div className="gx-skeleton h-48 w-full" />
        </div>
      </div>
    </div>
  );
}