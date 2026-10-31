import { Outlet } from "react-router-dom";

import { Sidebar } from "./sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-muted/30 p-8">
        <Outlet />
      </main>
    </div>
  );
}
