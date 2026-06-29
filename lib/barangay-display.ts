export function formatBarangayDisplayName(name?: string | null) {
  if (!name) {
    return "Barangay Workspace";
  }

  const trimmedName = name.trim();
  return trimmedName.toLowerCase().startsWith("barangay ") ? trimmedName : `Barangay ${trimmedName}`;
}

export function formatBarangayShortName(name?: string | null) {
  if (!name) {
    return "Barangay";
  }

  return name.trim().replace(/^barangay\s+/i, "");
}

export function getBarangayInitials(name?: string | null) {
  return (
    formatBarangayShortName(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BD"
  );
}
