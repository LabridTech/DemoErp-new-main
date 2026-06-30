import React from "react";
import { getDrawers, PettyCashDrawer } from "@/lib/petty-cash-service";
import { DrawerCard } from "@/components/petty-cash/DrawerCard";

export const dynamic = "force-dynamic"; // Ensure server‑side fetch each request

export default async function PettyCashPage() {
  const drawers: PettyCashDrawer[] = await getDrawers();

  return (
    <section className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Petty Cash Drawers
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drawers.map((drawer) => (
          <DrawerCard key={drawer.id} drawer={drawer} />
        ))}
      </div>
    </section>
  );
}
