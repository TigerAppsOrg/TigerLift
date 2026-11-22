import alertIcon from "../../assets/figma/alert-circle.svg";

// Error banner from the Figma "Error State" component (node 214:909): an
// alert icon, the message and an optional ghost "Retry" button.
export default function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Retry",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`bg-status-danger-bg rounded-lg pl-4 pr-3 py-3 flex items-center gap-3 ${className}`}
    >
      <img
        src={alertIcon}
        alt=""
        width="24"
        height="24"
        className="shrink-0"
      />
      <p className="flex-1 text-desktop-small text-status-danger-text">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 min-h-control max-md:min-h-11 px-6 py-2 rounded-control text-mobile-button text-content-primary hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-line-inverse"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
