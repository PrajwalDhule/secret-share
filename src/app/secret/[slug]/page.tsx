"use client";

import Loader from "@/components/Loader";
import Message from "@/components/Message";
import { useSecret } from "@/hooks/useSecret";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";

export default function SecretPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session, status: sessionStatus } = useSession();

  const {
    isLoading,
    status,
    decrypted,
    decrypt,
    setPassword,
    password,
    hasPassword,
    error,
  } = useSecret(slug);

  if (isLoading) return <Loader />;
  if (status === "not_found") return <Message message="Secret not found" />;
  if (status === "viewed & consumed")
    return <Message message="Viewed already!" />;
  if (status === "expired")
    return <Message message="This secret has expired." />;

  if (sessionStatus !== "loading" && !session?.user) {
    redirect("/auth/sign-in");
  }

  if (decrypted) {
    return (
      <div className="lg:ml-[25vw] ml-[5vw] lg:w-[50vw] w-[90vw] bg-gray-200 rounded-lg">
        <h2 className="p-4 text-2xl font-bold bg-blue-300 rounded-t-lg">Secret:</h2>
        <pre className="p-4 break-words whitespace-pre-wrap rounded-b-lg">{decrypted}</pre>
      </div>
    );
  }

  return (
    <div className="grid place-items-center p-4 max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold">Reveal Secret</h1>
      {error && <p className="text-red-500">{error}</p>}
      {hasPassword && (
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-md py-2 px-4 w-full"
        />
      )}
      <button
        onClick={decrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
      >
        Decrypt
      </button>
    </div>
  );
}
