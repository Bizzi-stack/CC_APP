export default function ItemCardSkeleton() {
  return (
    <div
      className="border border-[#333333] bg-black p-4 flex flex-col items-center animate-pulse"
      style={{ width: '100%', aspectRatio: '1/1.2' }}
    >
      {/* Title skeleton */}
      <div className="h-3 w-3/4 bg-[#222] rounded mb-2"></div>

      {/* Image skeleton */}
      <div className="w-full aspect-square bg-[#222] mb-2"></div>

      {/* Footer skeleton */}
      <div className="w-full flex items-center justify-between mt-auto pt-2">
        <div className="h-4 w-16 bg-[#222] rounded"></div>
        <div className="h-4 w-4 bg-[#222] rounded"></div>
      </div>
    </div>
  )
}
