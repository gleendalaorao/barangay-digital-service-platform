import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}
