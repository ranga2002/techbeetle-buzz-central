const normalizeTitle = (title?: string) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getDateKey = (item: any) => {
  const rawDate = item?.published_at || item?.publishedAt || item?.created_at;
  if (!rawDate) return "";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

/**
 * Remove duplicate news stories by slug/id and normalized title per day.
 * Keeps the first instance (usually the most recent because lists are sorted).
 */
export const dedupeNewsItems = <T extends { [key: string]: any }>(items: T[]): T[] => {
  const seenSlugs = new Set<string>();
  const seenTitleByDay = new Set<string>();
  const seenTitleNoDate = new Set<string>();

  return items.reduce<T[]>((acc, item) => {
    const slugKey = (item?.slug || item?.id)?.toString();
    const titleKey = normalizeTitle(item?.title);
    const dateKey = getDateKey(item);
    const titleDayKey = titleKey && dateKey ? `${titleKey}:${dateKey}` : "";

    const isDuplicate =
      (slugKey && seenSlugs.has(slugKey)) ||
      (titleDayKey && seenTitleByDay.has(titleDayKey)) ||
      (!dateKey && titleKey && seenTitleNoDate.has(titleKey));

    if (isDuplicate) {
      return acc;
    }

    if (slugKey) seenSlugs.add(slugKey);
    if (titleDayKey) {
      seenTitleByDay.add(titleDayKey);
    } else if (titleKey) {
      // If no usable date exists, still dedupe by normalized title.
      seenTitleNoDate.add(titleKey);
    }

    acc.push(item);
    return acc;
  }, []);
};
