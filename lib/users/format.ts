import { Role } from "@prisma/client";

export function formatRole(role: Role) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
