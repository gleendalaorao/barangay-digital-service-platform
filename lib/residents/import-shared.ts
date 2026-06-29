export type ResidentImportRow = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  contactNumber?: string | null;
  occupation?: string | null;
  citizenship: string;
  addressLine: string;
  addressBarangay?: string | null;
  city?: string | null;
  province?: string | null;
  purok?: string | null;
};

export type ResidentImportField = keyof ResidentImportRow;
export type MappingStatus = "auto" | "saved" | "manual" | "unmapped";

export type ResidentImportColumnMapping = {
  columnIndex: number;
  originalHeader: string;
  sampleValue: string;
  systemField: ResidentImportField | "";
  status: MappingStatus;
};

export const residentImportFields: { value: ResidentImportField; label: string }[] = [
  { value: "firstName", label: "First Name" },
  { value: "middleName", label: "Middle Name" },
  { value: "lastName", label: "Last Name" },
  { value: "suffix", label: "Suffix" },
  { value: "birthDate", label: "Birth Date" },
  { value: "gender", label: "Gender" },
  { value: "civilStatus", label: "Civil Status" },
  { value: "contactNumber", label: "Contact Number" },
  { value: "occupation", label: "Occupation" },
  { value: "citizenship", label: "Citizenship" },
  { value: "purok", label: "Purok" },
  { value: "addressLine", label: "Address Line" },
  { value: "addressBarangay", label: "Address Barangay" },
  { value: "city", label: "City" },
  { value: "province", label: "Province" },
];
