"use client"

import Message from "@/components/Message";
import { useSecret } from "@/hooks/useSecret";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";

export default function SecretPage() {
  const { slug } = useParams<{ slug: string }>();
  if(!slug) {
    return <Message message="Invalid url" />;
  }
  const { data: session, status: sessionStatus } = useSession();
  if (sessionStatus !== "loading" && !session?.user) {
    redirect("/auth/sign-in");
  }

  const {
    isLoading,
    status,
    decrypted,
    decrypt,
    setPassword,
    password,
    error,
  } = useSecret(slug);

  if (isLoading) return <Message message="Loading secret..." />;
  if (status === "not_found") return <Message message="Secret not found" />;
  if (status === "viewed & consumed") return <Message message="Viewed already!" />;
  if (status === "expired") return <Message message="This secret has expired." />;

  if (decrypted) {
    return (
      <div className="p-4 bg-gray-800 rounded text-white">
        <h2 className="text-lg mb-2">Secret:</h2>
        <pre className="break-words whitespace-pre-wrap">{decrypted}</pre>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold">Reveal Secret</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="password"
        placeholder="Enter password (if required)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
      />
      <button
        onClick={decrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Decrypt
      </button>
    </div>
  );
}
