const UNIT_MAP: Record<string, string> = {
  s: "s", sec: "s", secs: "s", second: "s", seconds: "s",
  m: "m", min: "m", mins: "m", minute: "m", minutes: "m",
  h: "h", hr: "h", hrs: "h", hour: "h", hours: "h",
  d: "d", day: "d", days: "d",
  w: "w", wk: "w", wks: "w", week: "w", weeks: "w",
};

const VALID_UNITS_REGEX = new RegExp(
  `^(\\d+)\\s*(${Object.keys(UNIT_MAP).join("|")})$`,
  "i" // case-insensitive
);

export function validateDuration(input: string): boolean {
  return VALID_UNITS_REGEX.test(input.trim());
}

export function parseDuration(input: string): string | null {
  const match = input.trim().toLowerCase().match(VALID_UNITS_REGEX);
  if (!match) return null;

  const [, value, unitRaw] = match;
  const unitKey = Object.keys(UNIT_MAP).find(key => unitRaw.startsWith(key));
  if (!unitKey) return null;

  return `${value}${UNIT_MAP[unitKey]}`;
}

export function separateUnit(input: string): { value: string, unit: string } | null {
  const parsed = parseDuration(input);
  if (!parsed) return null;
  const value = parsed.slice(0, -1);
  const unit = parsed.slice(-1);
  return { value, unit };
}

export function prettifyDuration(input: string): string | null {
  const parsed = parseDuration(input);
  if (!parsed) return null;

  const value = parsed.slice(0, -1);
  const unit = parsed.slice(-1);

  switch (unit) {
  case "s": return `${value} second${value === "1" ? "" : "s"}`;
  case "m": return `${value} minute${value === "1" ? "" : "s"}`;
  case "h": return `${value} hour${value === "1" ? "" : "s"}`;
  case "d": return `${value} day${value === "1" ? "" : "s"}`;
  case "w": return `${value} week${value === "1" ? "" : "s"}`;
  default: return null;
  }
}

export function durationToMS(input: string): number | null {
  const parsed = parseDuration(input);
  if (!parsed) return null;

  const value = parseInt(parsed.slice(0, -1));
  const unit = parsed.slice(-1);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 60 * 60_000,
    d: 24 * 60 * 60_000,
  };

  return value * (multipliers[unit] ?? 0);
}