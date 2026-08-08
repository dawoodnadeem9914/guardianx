export default function FamilyUpdatesLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <div className="gx-skeleton h-8 w-52" />
        <div className="gx-skeleton mt-3 h-4 w-80" />
      </div>

      <div>
        <div className="gx-skeleton h-3 w-40" />
        <div className="gx-skeleton mt-3 h-11 w-full" />
      </div>

      <div>
        <div className="gx-skeleton h-3 w-32" />
        <div className="mt-3 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="gx-skeleton h-20 w-full" />
          ))}
        </div>
      </div>

      <div>
        <div className="gx-skeleton h-3 w-44" />
        <div className="mt-3 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="gx-skeleton h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}