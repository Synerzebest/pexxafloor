function Skeleton({ className }: { className?: string }) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      />
    );
  }

export default function ProductCardSkeleton() {
    return (
      <div className="p-4 border border-gray-300 rounded-xl bg-white space-y-4">
        <Skeleton className="w-full h-48 rounded-lg" />
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-5" />
      </div>
    );
  }
