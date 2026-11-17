// Design-system button styles (Figma component 10:574). Every value comes
// from the shared tokens in tailwind.config.js / src/styles/tokens.css.
const BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-control text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-inverse";

const VARIANTS = {
  // Figma "Default". hover:text-* is needed so the global a:hover rule in
  // index.css does not recolour the label when this is rendered as a link.
  primary:
    "bg-fill-primary text-content-on-inverse hover:bg-fill-primary-pressed hover:text-content-on-inverse active:bg-fill-primary-pressed",
  // Figma "Variant2"
  secondary:
    "bg-transparent text-content-primary border border-line-inverse hover:bg-surface-subtle hover:text-content-primary active:bg-surface-subtle",
};

const SIZES = {
  // Figma "Small"
  sm: { primary: "h-[22px] px-2 py-1 text-mobile-xs" },
  // Figma "Default" / "Variant2" (desktop uses the bolder Desktop-Button style)
  md: {
    primary: "h-control min-w-control px-6 py-2 text-mobile-button md:text-desktop-button",
    secondary: "h-control min-w-control px-4 py-2 text-mobile-button",
  },
  // Figma "v"
  lg: { primary: "h-[52px] min-w-control px-8 py-4 text-desktop-button" },
};

const DISABLED =
  "bg-surface-placeholder text-content-secondary hover:bg-surface-placeholder hover:text-content-secondary cursor-not-allowed";

/**
 * Class string for a design-system button. Use it directly on a <Link> or
 * <a> that should look like a button.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  disabled = false,
} = {}) {
  const sizeSet = SIZES[size] || SIZES.md;
  const sizeClasses = sizeSet[variant] || sizeSet.primary;
  return [BASE, sizeClasses, disabled ? DISABLED : VARIANTS[variant]].join(
    " "
  );
}

export default function Button({
  onClick,
  loading,
  disabled,
  className = "",
  children,
  status = "",
  variant,
  size,
  type,
  ...rest
}) {
  // Design-system path: only used when a variant is passed, so every
  // existing call site keeps its exact legacy output below.
  if (variant) {
    return (
      <button
        type={type || "button"}
        onClick={onClick}
        className={`${buttonClasses({
          variant,
          size,
          disabled: disabled || loading,
        })} ${loading ? "cursor-progress" : ""} ${className}`}
        disabled={loading || disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  let buttonStyling = "";
  if (status === "pending") {
    buttonStyling = "px-3 rounded-full bg-theme_light_2 text-theme_dark_2";
  } else if (status === "rejected") {
    buttonStyling = "px-3 rounded-full bg-red-100 text-red-500";
  } else if (status === "removed") {
    buttonStyling = "px-3 rounded-full bg-zinc-200 text-zinc-600";
  } else if (status === "accepted") {
    buttonStyling =
      "px-3 rounded-full bg-theme_light_green text-theme_dark_green";
  }

  const disabledStyling =
    "bg-zinc-100 text-zinc-400 hover:text-zinc-400 hover:bg-zinc-100";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`py-1.5 px-3 font-medium ${
        buttonStyling ? buttonStyling : "px-2.5 rounded-md"
      } ${className} ${
        disabled
          ? `${disabledStyling}
           cursor-not-allowed hover:bg-zinc-100`
          : ""
      } ${
        loading ? `${disabledStyling} cursor-progress hover:bg-zinc-100` : ""
      }`}
      disabled={loading || disabled}
    >
      {children}
    </button>
  );
}
