"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
      className="text-sm text-red-500 hover:underline"
    >
      Logout
    </button>
  );
}