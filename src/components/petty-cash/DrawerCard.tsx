// src/components/petty-cash/DrawerCard.tsx
import React from "react";
import { PettyCashDrawer } from "@/lib/petty-cash-service";
import Link from "next/link";

interface Props {
  drawer: PettyCashDrawer;
}

export const DrawerCard: React.FC<Props> = ({ drawer }) => {
  const warning = drawer.balance < drawer.threshold;
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform transition hover:scale-105 backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{drawer.name}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Balance: <span className={warning ? "text-red-600" : "text-green-600"}>${drawer.balance.toFixed(2)}</span>
      </p>
      <p className="text-sm text-gray-500">Threshold: ${drawer.threshold}</p>
      <Link href={`/petty-cash/drawer/${drawer.id}`}> 
        <a className="mt-3 inline-block text-indigo-600 hover:underline">View details →</a>
      </Link>
    </div>
  );
};
