// src/components/DashboardClient.tsx
"use client";

import { signOut } from "next-auth/react";

type Props = {
  name: string | null;
};

export default function DashboardClient({ name }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome, {name}</h1>

      <button
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        onClick={() => alert("View secrets (coming soon)")}
      >
        📂 View My Secrets
      </button>

      <button
        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        onClick={() => alert("Create a secret (coming soon)")}
      >
        ✏️ Create a Secret
      </button>

      <button
        className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
      >
        🚪 Logout
      </button>
    </div>
  );
}