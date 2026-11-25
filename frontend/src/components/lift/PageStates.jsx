import LiftButton from "./LiftButton";

// Placeholder blocks shown while ride data loads.
export function RideCardSkeleton() {
  return (
    <div
      className="bg-lift-surface border border-lift-border rounded-lg p-5 flex flex-col gap-6 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-28 bg-lift-subtle rounded" />
          <div className="h-4 w-20 bg-lift-subtle rounded" />
        </div>
        <div className="h-9 w-24 bg-lift-subtle rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-7 w-40 bg-lift-subtle rounded" />
        <div className="h-7 w-52 bg-lift-subtle rounded" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-36 bg-lift-subtle rounded" />
        <div className="h-[52px] w-full bg-lift-subtle rounded" />
      </div>
    </div>
  );
}

// A friendly error with a retry button.
export function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-lift-surface border border-lift-border rounded-lg p-6 flex flex-col items-start gap-4"
    >
      <p className="font-semibold text-subhead-m md:text-subhead">
        Something went wrong
      </p>
      <p className="text-lift-secondary">{message}</p>
      {onRetry && (
        <LiftButton variant="outline" onClick={onRetry}>
          Try again
        </LiftButton>
      )}
    </div>
  );
}
