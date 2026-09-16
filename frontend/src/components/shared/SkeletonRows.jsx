'use client';

export function SkeletonRows({ count = 3, height = 'h-9' }) {
  return (
    <div className="p-6 space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${height} bg-slate-50 rounded animate-pulse`} />
      ))}
    </div>
  );
}

export default SkeletonRows;
