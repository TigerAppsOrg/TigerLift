import { useState, useEffect, useRef, useId } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import NotificationsModal from "./NotificationsModal";
import { buttonClasses } from "../styles/buttonClasses";
import {
  BellIcon,
  PersonIcon,
  RidesIcon,
  HomeIcon,
  PlusIcon,
} from "./NavIcons";
import useNotifications from "../utils/useNotifications";
import logo from "../assets/tlift-logo.png";

// Nav bar from Figma (TigerLift-Facelift): desktop component 56:833,
// mobile bottom tab bar 10:717. All colours, type and sizes are tokens
// from tailwind.config.js / src/styles/tokens.css.

const NAV_LINKS = [
  { to: "/allrides", label: "Home", Icon: HomeIcon },
  { to: "/myrides", label: "My Rides", Icon: RidesIcon },
];

// Every interactive element gets a visible keyboard focus ring.
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-inverse";

// Mobile tab bar background: subtle fill with a circular notch (38px radius)
// cut out of the top edge for the create button.
const TABBAR_NOTCH_STYLE = {
  background:
    "radial-gradient(circle 38px at 50% 0, transparent 38px, var(--color-bg-subtle) 38.5px)",
};

function UnreadDot({ ringClass }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0.5 right-[3px] h-2.5 w-2.5 rounded-full bg-status-danger ring-2 ${ringClass}`}
    />
  );
}

function ProfileMenuPanel({ id, displayname, className }) {
  return (
    <div
      id={id}
      role="menu"
      className={`z-30 min-w-[200px] p-4 bg-surface border border-line rounded-control shadow-elevation-2 flex flex-col gap-3 ${className}`}
    >
      {displayname && (
        <p className="text-desktop-small text-content-secondary">
          {displayname}
        </p>
      )}
      <a
        role="menuitem"
        href="/api/logout"
        className={`${buttonClasses({ variant: "secondary" })} w-full`}
      >
        Log out
      </a>
    </div>
  );
}

export default function Navbar({ user_info }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuId = useId();
  const desktopMenuId = `${menuId}-desktop`;
  const mobileMenuId = `${menuId}-mobile`;

  // Only one of the notifications panel or the profile menu is open at a time.
  const [openPanel, setOpenPanel] = useState(null); // "alerts" | "profile" | null
  const showNotifications = openPanel === "alerts";
  const showProfileMenu = openPanel === "profile";

  const desktopProfileButton = useRef(null);
  const mobileProfileButton = useRef(null);

  const {
    newNotifications,
    pastNotifications,
    isLoading,
    hasUnread,
    handleReadNotif,
    markAllRead,
    clearAll,
  } = useNotifications();

  // Close any open menu when the route changes.
  useEffect(() => {
    setOpenPanel(null);
  }, [location.pathname]);

  // Profile menu: close on outside click and on Escape (returning focus).
  useEffect(() => {
    if (!showProfileMenu) return;

    const handlePointerDown = (e) => {
      if (!e.target.closest("[data-profile-menu]")) {
        setOpenPanel(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenPanel(null);
        // Focus whichever profile button is currently visible.
        const visible = [desktopProfileButton, mobileProfileButton].find(
          (ref) => ref.current && ref.current.offsetParent !== null
        );
        visible?.current.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  const togglePanel = (panel) =>
    setOpenPanel((current) => (current === panel ? null : panel));

  const openCreateRide = () => {
    setOpenPanel(null);
    navigate("/allrides", { state: { openCreate: true } });
  };

  const onReadNotif = (notif) => {
    navigate("/myrides");
    setOpenPanel(null);
    handleReadNotif(notif);
  };

  const unreadCount = newNotifications.length;
  const bellLabel = hasUnread
    ? `Notifications, ${unreadCount} unread`
    : "Notifications";

  return (
    <>
      <NotificationsModal
        isOpen={showNotifications}
        isLoading={isLoading}
        onClose={() => setOpenPanel(null)}
        new_notifs={newNotifications}
        past_notifs={pastNotifications}
        handleReadNotif={onReadNotif}
        markAllRead={markAllRead}
        clearAll={clearAll}
      />

      {/* Desktop (md and up) */}
      <header className="hidden md:flex h-nav px-gutter items-center justify-between bg-surface border-b border-line">
        <nav aria-label="Primary" className="flex items-center gap-6">
          <Link
            to="/allrides"
            className={`shrink-0 rounded-control ${FOCUS_RING}`}
          >
            <img src={logo} width={66} height={38} alt="TigerLift home" />
          </Link>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-desktop-nav rounded-control transition-colors hover:text-content-primary ${FOCUS_RING} ${
                  isActive ? "text-content-primary" : "text-content-secondary"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 py-6">
          <button
            type="button"
            onClick={openCreateRide}
            className={buttonClasses({ variant: "primary" })}
          >
            Create a rideshare
          </button>

          <button
            type="button"
            onClick={() => togglePanel("alerts")}
            aria-label={bellLabel}
            aria-expanded={showNotifications}
            className={`relative z-[21] rounded-control transition-colors hover:text-icon-primary ${FOCUS_RING} ${
              showNotifications ? "text-icon-primary" : "text-icon-muted"
            }`}
          >
            <BellIcon size={32} />
            {hasUnread && <UnreadDot ringClass="ring-surface" />}
          </button>

          <div className="relative" data-profile-menu>
            <button
              ref={desktopProfileButton}
              type="button"
              onClick={() => togglePanel("profile")}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-controls={desktopMenuId}
              className={`block rounded-control transition-colors hover:text-icon-primary ${FOCUS_RING} ${
                showProfileMenu ? "text-icon-primary" : "text-icon-muted"
              }`}
            >
              <PersonIcon size={32} />
            </button>
            {showProfileMenu && (
              <ProfileMenuPanel
                id={desktopMenuId}
                displayname={user_info?.displayname}
                className="absolute right-0 top-full mt-2"
              />
            )}
          </div>
        </div>
      </header>

      {/* Mobile (below md): bottom tab bar */}
      <nav
        aria-label="Primary"
        style={TABBAR_NOTCH_STYLE}
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-tabbar pt-2 pb-8 flex gap-[10px]"
      >
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => {
              const active = isActive && !openPanel;
              return `flex-1 flex flex-col items-center justify-center text-mobile-label rounded-control ${FOCUS_RING} ${
                active
                  ? "text-content-primary hover:text-content-primary"
                  : "text-content-secondary hover:text-content-secondary"
              }`;
            }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={24}
                  className={
                    isActive && !openPanel ? "text-icon-primary" : "text-icon-muted"
                  }
                />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* Centre slot: the create button floats over the notch. */}
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={openCreateRide}
            aria-label="Create a rideshare"
            className={`absolute left-1/2 -translate-x-1/2 -top-10 h-fab w-fab rounded-full flex items-center justify-center bg-fill-accent text-content-on-accent shadow-elevation-2 transition-colors active:bg-fill-accent-pressed hover:bg-fill-accent-pressed ${FOCUS_RING}`}
          >
            <PlusIcon />
          </button>
        </div>

        <button
          type="button"
          onClick={() => togglePanel("alerts")}
          aria-label={bellLabel}
          aria-expanded={showNotifications}
          className={`flex-1 flex flex-col items-center justify-center text-mobile-label rounded-control ${FOCUS_RING} ${
            showNotifications ? "text-content-primary" : "text-content-secondary"
          }`}
        >
          <span className="relative">
            <BellIcon
              size={24}
              className={showNotifications ? "text-icon-primary" : "text-icon-muted"}
            />
            {hasUnread && <UnreadDot ringClass="ring-surface-subtle" />}
          </span>
          <span aria-hidden="true">Alerts</span>
        </button>

        <div className="flex-1 flex" data-profile-menu>
          <button
            ref={mobileProfileButton}
            type="button"
            onClick={() => togglePanel("profile")}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={showProfileMenu}
            aria-controls={mobileMenuId}
            className={`flex-1 flex flex-col items-center justify-center text-mobile-label rounded-control ${FOCUS_RING} ${
              showProfileMenu ? "text-content-primary" : "text-content-secondary"
            }`}
          >
            <PersonIcon
              size={24}
              className={showProfileMenu ? "text-icon-primary" : "text-icon-muted"}
            />
            <span aria-hidden="true">Profile</span>
          </button>
          {showProfileMenu && (
            <ProfileMenuPanel
              id={mobileMenuId}
              displayname={user_info?.displayname}
              className="fixed right-gutter-mobile bottom-[calc(theme(spacing.tabbar)+theme(spacing.2))]"
            />
          )}
        </div>
      </nav>
    </>
  );
}
