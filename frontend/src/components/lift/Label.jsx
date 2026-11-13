// Pill label from the Figma "Label" component (node 23:1399).
//   default: e.g. "2 seats open" (smaller on mobile)
//   chip:    quick-filter chips on Home (wider padding on desktop)
//   small:   compact status pills
const SIZES = {
  default: "px-6 py-2 text-label-m md:text-label",
  chip: "px-6 py-2 md:px-12 md:py-3 text-label-m md:text-label",
  small: "px-3 py-1 text-sm leading-5",
};

const TONES = {
  neutral: "bg-lift-subtle text-lift-ink",
  secondary: "bg-lift-subtle text-lift-secondary",
  success: "bg-lift-success-bg text-lift-success-text",
  danger: "bg-lift-danger-bg text-lift-danger-text",
  active: "bg-lift-inverse text-lift-on-inverse",
};

export default function Label({
  size = "default",
  tone = "neutral",
  className = "",
  children,
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
