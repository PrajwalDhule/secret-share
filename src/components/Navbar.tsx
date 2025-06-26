// src/app/dashboard/page.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [loggedIn, setLoggedIn] = useState(true);
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    setLoggedIn(!!session?.user);
  }, [session, status]);  

  return (
    <div className="flex items-center py-6 px-6 space-y-4">
      <h1 className="font-semibold text-2xl">
        <Link
          href="/"
        >
          Secret Share
        </Link>
      </h1>
      <div className="ml-auto mr-0 flex justify-end items-center gap-2">
        {loggedIn && (
          <>
            <Link
              href="/secret/create"
              className=" bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 grid place-items-center h-fit"
            >
              Create a Secret
            </Link>
            <button
              className=" bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 grid place-items-center h-fit cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
            >
              Logout
            </button>
          </>
        )}

        {!loggedIn && (
          <Link
            href="/auth/sign-in"
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
