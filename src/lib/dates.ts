const FR_DATE: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Paris",
};

export function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", FR_DATE).format(date);
}
