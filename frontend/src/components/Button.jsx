import { buttonClasses } from "../styles/buttonClasses";
import { statusPillStyling } from "../utils/utils";

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

  const buttonStyling = statusPillStyling[status]
    ? `px-3 rounded-full ${statusPillStyling[status]}`
    : "";
  // real actions get a 44px tap target on phones; status pills and empty
  // placeholder buttons keep their size
  const isAction = !status && Boolean(children);

  const disabledStyling =
    "bg-zinc-100 text-zinc-400 hover:text-zinc-400 hover:bg-zinc-100";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`py-1.5 px-3 font-medium ${
        buttonStyling ? buttonStyling : "px-2.5 rounded-md"
      } ${isAction ? "max-md:min-h-11" : ""} ${className} ${
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
