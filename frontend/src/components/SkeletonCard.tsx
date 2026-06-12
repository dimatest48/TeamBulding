export function SkeletonCard() {
    return (
        <div className="card animate-pulse">
            <div className="mb-4 h-6 w-1/2 rounded-lg bg-white/10"></div>

            <div className="mb-2 h-4 w-full rounded-lg bg-white/10"></div>

            <div className="mb-2 h-4 w-5/6 rounded-lg bg-white/10"></div>

            <div className="h-4 w-2/3 rounded-lg bg-white/10"></div>
        </div>
    );
}