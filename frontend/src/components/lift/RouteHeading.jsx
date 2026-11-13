import arrowIcon from "../../assets/figma/arrow.svg";

// "Princeton →" on the first line and the destination on the second, as in
// the Figma ride card. The arrow artwork is used at its native 33×15 size and
// stays on the same line as the origin's last word when a long name wraps.
export default function RouteHeading({
  from,
  to,
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
          <img
            src={arrowIcon}
            alt="to"
            width="33"
            height="14.7279"
            className="inline align-middle"
          />
        </span>
      </span>
      <span className="block">{to}</span>
    </Tag>
  );
}
