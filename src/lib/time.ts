export function startOfSevenDayWindow() {
  const since = new Date(Date.now() - 6 * 86_400_000);
  since.setHours(0, 0, 0, 0);
  return since;
}
