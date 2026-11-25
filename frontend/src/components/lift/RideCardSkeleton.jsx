// Loading placeholder from the Figma "Skeleton/Ride Card" component
// (node 211:204), the same outline as the shared ride card.
const Block = ({ className }) => (
  <div className={`bg-surface-muted rounded animate-pulse ${className}`} />
);

export default function RideCardSkeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface border border-line rounded-lg p-5 flex flex-col gap-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Block className="w-24 h-6" />
          <Block className="w-16 h-2.5" />
        </div>
        <Block className="w-24 h-6 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Block className="w-40 h-5" />
        <Block className="w-[230px] max-w-full h-5" />
      </div>
      <div className="flex flex-col gap-3">
        <Block className="w-[120px] h-2.5" />
        <Block className="w-full h-control" />
      </div>
    </div>
  );
}
