// Converting between instants and Eastern-time wall clocks, which is how
// rides are picked and shown.
const EASTERN = "America/New_York";

// "YYYY-MM-DDTHH:mm:ss" wall-clock time in Eastern time for an instant
export const toEasternWallTime = (instant) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
};

// The instant at which Eastern clocks read `wallTime` ("YYYY-MM-DDTHH:mm:ss"),
// whatever the browser's time zone. Pickers show ET, so posts and edits are
// stored as ET too.
export const fromEasternWallTime = (wallTime) => {
  const asUtc = Date.parse(`${wallTime}Z`);
  const offset = (instant) =>
    Date.parse(`${toEasternWallTime(instant)}Z`) - instant;
  // second pass settles the offset when DST changes between the guesses
  const guess = asUtc - offset(asUtc);
  return new Date(asUtc - offset(guess));
};
