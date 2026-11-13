// Button from the Figma "Button" component (node 10:574).
//   primary:  dark fill (Default); semibold on mobile, bold on desktop as in
//             the Mobile-Button / Desktop-Button type styles
//   outline:  dark border (Variant2)
//   disabled: grey fill, e.g. "Full" (disabled)
const VARIANTS = {
  primary:
    "bg-lift-inverse text-lift-on-inverse hover:bg-lift-inverse-pressed font-semibold md:font-bold",
  outline:
    "border border-lift-inverse text-lift-ink hover:bg-lift-subtle font-semibold",
  disabled:
    "bg-lift-placeholder text-lift-secondary font-semibold cursor-not-allowed",
};

export const liftButtonClasses = (variant = "primary", className = "") =>
  `inline-flex items-center justify-center min-h-[42px] min-w-[42px] px-6 py-2 rounded text-base leading-5 transition-colors ${VARIANTS[variant]} ${className}`;

export default function LiftButton({
  variant = "primary",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={liftButtonClasses(
        disabled ? "disabled" : variant,
        `${loading ? "cursor-progress opacity-70" : ""} ${className}`
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
