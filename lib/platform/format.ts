export function formatPlatformDate(date: Date) {
  return date.toLocaleDateString("en-PH", { dateStyle: "medium" });
}

export function formatPlatformAddress(input: {
  municipality: string;
  province: string;
  region: string;
}) {
  return [input.municipality, input.province, input.region].filter(Boolean).join(", ");
}
