type NameParts = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
};

export function formatResidentName(resident: NameParts) {
  return [resident.firstName, resident.middleName, resident.lastName, resident.suffix]
    .filter(Boolean)
    .join(" ");
}

export function calculateAge(birthDate?: Date | string | null) {
  if (!birthDate) {
    return null;
  }

  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatDateForInput(date?: Date | string | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 10);
}
