import type { Role, User } from "@prisma/client";
import { SectionCard } from "@/components/ui/section-card";
import { barangayUserRoles } from "@/lib/validation/user-management";
import { formatRole } from "@/lib/users/format";

type UserFormProps = {
  user?: Pick<User, "name" | "email" | "role" | "isActive">;
  action: (formData: FormData) => void | Promise<void>;
  mode: "create" | "edit";
};

export function UserForm({ user, action, mode }: UserFormProps) {
  return (
    <form action={action} className="space-y-6">
      <SectionCard
        title={mode === "create" ? "User account" : "Account details"}
        description={
          mode === "create"
            ? "Create a barangay staff account with a temporary password."
            : "Update profile, role, status, or set a new password."
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" defaultValue={user?.name} required />
          <Field label="Email" name="email" type="email" defaultValue={user?.email} required disabled={mode === "edit"} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              name="role"
              defaultValue={user?.role ?? "STAFF"}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
            >
              {barangayUserRoles.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role as Role)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Barangay admins cannot create platform super admins.</p>
          </label>
          {mode === "create" ? (
            <Field label="Temporary password" name="temporaryPassword" type="password" required helper="Minimum 8 characters." />
          ) : (
            <Field label="Reset password" name="resetPassword" type="password" helper="Leave blank to keep the current password." />
          )}
          <label className="flex h-11 items-center gap-3 self-end rounded-md border border-slate-200 px-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user?.isActive ?? true}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Active account
          </label>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <a href="/users" className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Cancel
        </a>
        <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  disabled,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        disabled={disabled}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 disabled:bg-slate-50 disabled:text-slate-500"
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}
