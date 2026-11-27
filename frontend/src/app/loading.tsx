export default function RouteLoading() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy="true">
      <div className="h-16 w-64 animate-pulse rounded-2xl bg-[#F7F5EF]/50" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[128px] animate-pulse rounded-[24px] bg-[#F7F5EF]/45"
          />
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded-[24px] bg-[#F7F5EF]/45" />
    </div>
  );
}
