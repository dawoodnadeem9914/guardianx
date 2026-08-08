export default function FamilyRelationshipDetailLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <div className="gx-skeleton h-4 w-40" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="gx-skeleton h-8 w-48" />
          <div className="gx-skeleton h-6 w-20 rounded-full" />
        </div>
      </div>

      <div>
        <div className="gx-skeleton h-3 w-36" />
        <div className="gx-skeleton mt-3 h-32 w-full" />
      </div>

      <div>
        <div className="gx-skeleton h-3 w-32" />
        <div className="gx-skeleton mt-3 h-64 w-full" />
      </div>
    </div>
  );
}