import arrowIcon from "../../assets/figma/arrow.svg";
import arrowLargeIcon from "../../assets/figma/arrow-40.svg";

// Arrow artwork from Figma at its native sizes: the 33×15 arrow sits next to
// 24–28px type (ride cards, mobile), the 34×29 one next to the 40px Ride
// Details heading on desktop.
const SmallArrow = ({ className = "" }) => (
  <img
    src={arrowIcon}
    alt="to"
    width="33"
    height="14.7279"
    className={`inline align-middle ${className}`}
  />
);

const LargeArrow = ({ className = "" }) => (
  <img
    src={arrowLargeIcon}
    alt="to"
    width="34"
    height="29.4558"
    className={`inline align-middle ${className}`}
  />
);

// "Princeton →" on the first line and the destination on the second, as in
// the Figma ride card and Ride Details header. The arrow stays on the same
// line as the origin's last word when a long name wraps.
// arrow="large" uses the large artwork from the md breakpoint up.
export default function RouteHeading({
  from,
  to,
  arrow = "default",
  className = "",
  as: Tag = "p",
}) {
  const words = from.split(" ");
  const lastWord = words.pop();

  return (
    <Tag className={`text-lift-ink break-words ${className}`}>
      <span className="block">
        {words.length > 0 && `${words.join(" ")} `}
        <span className="whitespace-nowrap">
          {lastWord}{" "}
          {arrow === "large" ? (
            <>
              <SmallArrow className="md:hidden" />
              <LargeArrow className="hidden md:inline" />
            </>
          ) : (
            <SmallArrow />
          )}
        </span>
      </span>
      <span className="block">{to}</span>
    </Tag>
  );
}
