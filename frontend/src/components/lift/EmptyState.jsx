import { Link } from "react-router-dom";
import { buttonClasses } from "../../styles/buttonClasses";

// Empty state from the Figma "Empty State" component (node 210:193): an icon
// in a circle, a title, a line of body text and an optional button.
//   icon    image URL (e.g. an imported Figma SVG)
//   action  { label, to } for a link or { label, onClick } for a button
export default function EmptyState({ icon, title, body, action }) {
  const actionClasses = `${buttonClasses({ variant: "primary" })} md:h-auto md:px-8 md:py-4`;
  return (
    <div className="bg-surface border border-line-strong rounded-lg flex flex-col items-center justify-center gap-4 text-center px-6 py-10 md:px-8 md:py-16">
      {icon && (
        <div className="size-12 md:size-14 rounded-full bg-surface-subtle flex items-center justify-center">
          <img src={icon} alt="" width="24" height="24" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-mobile-button md:text-desktop-subhead text-content-primary">
          {title}
        </p>
        {body && (
          <p className="text-mobile-small md:text-desktop-small text-content-secondary">
            {body}
          </p>
        )}
      </div>
      {action &&
        (action.to ? (
          <Link to={action.to} className={actionClasses}>
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={actionClasses}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
