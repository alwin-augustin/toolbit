/**
 * Loading Fallback Component
 * Shown while lazy-loaded components are being loaded
 */
export function LoadingFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-muted"></div>
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Full Page Loading Component
 * Shown during initial app load or route transitions
 */
export function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted"></div>
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-muted-foreground">Loading Toolbit...</p>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader Component
 * Generic skeleton loader for content placeholders
 */
export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
        </div>
      ))}
    </div>
  );
}
