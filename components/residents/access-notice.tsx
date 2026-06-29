export function ResidentAccessNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      {message}
    </div>
  );
}
