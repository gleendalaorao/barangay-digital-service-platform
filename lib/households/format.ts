export function formatHouseholdAddress(household: {
  addressLine: string;
  addressBarangay?: string | null;
  city?: string | null;
  province?: string | null;
}) {
  return [household.addressLine, household.addressBarangay, household.city, household.province]
    .filter(Boolean)
    .join(", ");
}
