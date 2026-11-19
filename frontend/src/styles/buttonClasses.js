// Design-system button styles (Figma component 10:574), shared by
// <Button variant=...> and any <Link>/<a> that should look like a button.
// Every value comes from the shared tokens in tailwind.config.js and
// src/styles/tokens.css.
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
  // Figma "Small" (4 + 14px line + 4 = 22px tall, from padding alone)
  sm: { primary: "min-w-control px-2 py-1 text-mobile-xs" },
  // Figma "Default" / "Variant2" (desktop uses the bolder Desktop-Button style)
  md: {
    primary: "h-control min-w-control px-6 py-2 text-mobile-button md:text-desktop-button",
    secondary: "h-control min-w-control px-4 py-2 text-mobile-button",
  },
  // Figma "v" (16 + 20px line + 16 = 52px tall, from padding alone)
  lg: { primary: "min-h-control min-w-control px-8 py-4 text-desktop-button" },
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
