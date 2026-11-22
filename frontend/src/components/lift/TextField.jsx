import { forwardRef, useId } from "react";

// Text input from the Figma "Text Input" component (node 205:159): a label,
// a single-line or text-area field, and a helper line that turns into the
// error message. Pass `counter` to show "n/max" on the right of the helper
// line (needs maxLength).
const FIELD =
  "w-full bg-surface border rounded-lg text-mobile-body md:text-desktop-body text-content-primary placeholder:text-content-placeholder outline-none transition-colors disabled:bg-surface-subtle disabled:border-line disabled:text-content-disabled";

const TextField = forwardRef(function TextField(
  {
    label,
    helper,
    error,
    counter = false,
    multiline = false,
    id,
    className = "",
    value = "",
    maxLength,
    ...inputProps
  },
  ref,
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const helperId = `${fieldId}-helper`;
  const showHelperLine = Boolean(error || helper || counter);

  const stateClasses = error
    ? "border-2 border-status-danger"
    : "border-line-strong focus:border-2 focus:border-line-inverse";

  const Field = multiline ? "textarea" : "input";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-mobile-small-bold text-content-primary"
        >
          {label}
        </label>
      )}
      <Field
        ref={ref}
        id={fieldId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={showHelperLine ? helperId : undefined}
        className={`${FIELD} ${stateClasses} ${
          multiline ? "h-20 p-4 resize-none max-md:h-28" : "h-control px-4"
        }`}
        {...inputProps}
      />
      {showHelperLine && (
        <div
          id={helperId}
          className="flex items-start justify-between gap-3 text-mobile-small"
        >
          <p
            className={
              error ? "text-status-danger-text" : "text-content-secondary"
            }
          >
            {error || helper}
          </p>
          {counter && maxLength && (
            <p className="shrink-0 text-content-secondary">
              {value.length}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default TextField;
