export function formatDate(date: Date | string) {
  if (typeof date === "string") {
    date = new Date(date);
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
  return formattedDate;
}
