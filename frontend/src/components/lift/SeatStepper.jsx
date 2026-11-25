import minusIcon from "../../assets/figma/minus.svg";
import plusIcon from "../../assets/figma/plus.svg";

// Seat stepper from the Figma Schedule a Ride screens: "Seats open" on the
// left, then Icon/Minus, the value and Icon/Plus on the right.
const STEP =
  "flex items-center justify-center rounded-full size-8 max-md:size-11 hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-line-inverse";

export default function SeatStepper({
  value,
  onChange,
  min = 1,
  max,
  label = "Seats open",
  helper,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <p className="text-mobile-body md:text-desktop-body-xl text-content-primary">
          {label}
        </p>
        {helper && (
          <p className="text-mobile-small-bold text-content-secondary">
            {helper}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          className={STEP}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label="Fewer seats"
        >
          <img src={minusIcon} alt="" width="24" height="24" />
        </button>
        <span
          aria-live="polite"
          aria-label={`${value} ${value === 1 ? "seat" : "seats"} open`}
          className="min-w-6 text-center text-mobile-body md:text-desktop-body-xl text-content-primary"
        >
          {value}
        </span>
        <button
          type="button"
          className={STEP}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label="More seats"
        >
          <img src={plusIcon} alt="" width="24" height="24" />
        </button>
      </div>
    </div>
  );
}
