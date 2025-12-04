type CountryCode = string | null | undefined;

const COUNTRY_TZ_MAP: Record<string, string> = {
  in: "Asia/Kolkata",
  us: "America/New_York",
  ca: "America/Toronto",
  gb: "Europe/London",
  au: "Australia/Sydney",
};

export const pickTimeZone = (country?: CountryCode) => {
  if (!country) return undefined;
  return COUNTRY_TZ_MAP[country.toLowerCase()] ?? undefined;
};

/**
 * Format a UTC timestamp into a target timezone (or browser-local by default),
 * including a short timezone label.
 */
export const formatLocalTime = (value?: string | null, timeZone?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
    ...(timeZone ? { timeZone } : {}),
  };

  try {
    return date.toLocaleString(undefined, opts);
  } catch (_err) {
    return date.toLocaleString();
  }
};
