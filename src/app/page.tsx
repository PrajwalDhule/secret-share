"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";
import { importKey, decryptAES } from "@/utils/crypto";
import Link from "next/link";

type SecretEntry = {
  id: string;
  slug: string;
  createdAt: Date;
  expiresAt: Date;
  oneTime: boolean;
  hasPassword: boolean;
  status: "active" | "expired" | "viewed & consumed";
  encryptedText: string;
  encryptionKey?: string;
  iv: string;
};

export default function Home() {
  const { data: session, status } = useSession();

  const [search, setSearch] = useState("");
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const {
    data: secrets,
    isLoading,
    refetch,
  } = api.secrets.listByUser.useQuery(undefined, { enabled: !!session?.user });

  const [filtered, setFiltered] = useState<typeof secrets>([]);

  const deleteMutation = api.secrets.deleteBySlug.useMutation({
    onSuccess: () => refetch(),
  });

  const decryptedMatch = async (secret: SecretEntry) => {
    if (!secret.encryptionKey) {
      return false;
    }
    const keyFragment = secret.encryptionKey;
    const key = await importKey(keyFragment);
    const plain = await decryptAES(secret.encryptedText, key, secret.iv);
    return plain?.toLowerCase().includes(search.toLowerCase());
  };

  useEffect(() => {
    if (!secrets) return;

    const filterSecrets = async () => {
      const results = await Promise.all(
        secrets.map(async (s) => {
          const url = s.encryptionKey
            ? `${window.location.origin}/secret/${s.slug}#${s.encryptionKey}`
            : "";

          const matches =
            url.toLowerCase().includes(search.toLowerCase()) ||
            (await decryptedMatch(s));

          return { match: matches, secret: s };
        })
      );

      setFiltered(results.filter((r) => r.match).map((r) => r.secret));
    };

    filterSecrets();
  }, [secrets, search, revealed]);

  const handleReveal = async (s: SecretEntry) => {
    if (!s.encryptionKey) {
      alert("This secret does not have an encryption key stored.");
      return;
    }
    try {
      console.log(!!revealed[s.slug]);
      if (revealed[s.slug]) {
        setRevealed((prev) => ({ ...prev, [s.slug]: "" }));
        return;
      }
      const keyFragment = s.encryptionKey;
      const key = await importKey(keyFragment);
      const plain = await decryptAES(s.encryptedText, key, s.iv);
      setRevealed((prev) => ({ ...prev, [s.slug]: plain }));
    } catch (err) {
      console.error("Decryption failed", err);
      alert("Decryption failed");
    }
  };

  const handleToggleAll = async () => {
    if (!secrets) return;
    if (revealAll) {
      setRevealed({});
      setRevealAll(false);
      return;
    }

    try {
      const all: Record<string, string> = {};
      for (const s of secrets) {
        if (!s.encryptionKey) {
          continue;
        }
        const keyFragment = s.encryptionKey;
        console.log("Revealing secret:", s.slug);
        const key = await importKey(keyFragment);
        const plain = await decryptAES(s.encryptedText, key, s.iv);
        all[s.slug] = plain;
      }
      setRevealed(all);
      setRevealAll(true);
    } catch (err) {
      alert("Bulk decryption failed");
    }
  };

  if (status !== "loading" && !session?.user) {
    return (
      <div className="flex flex-col items-center h-[10vh] w-full mt-16 gap-4 ">
        <h2 className="text-3xl font-bold w-fit">Welcome to SecretShare</h2>
        <p className="text-lg w-fit">Login to your account to create and access your secrets.</p>
        <Link
          href="/auth/sign-in"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 mt-4 rounded-lg transition-colors duration-200 w-fit"
        >
          Login
        </Link>
      </div>
    );
  }

  if (status === "loading" || isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📂 My Secrets</h1>

      <input
        type="text"
        placeholder="Search by link or content..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 border p-2 rounded"
      />

      <button
        onClick={handleToggleAll}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        👁️ Reveal All Secrets
      </button>

      {filtered?.length ? (
        <ul className="space-y-4">
          {filtered.map((secret) => {
            const url = secret.encryptionKey
              ? `${window.location.origin}/secret/${secret.slug}#${secret.encryptionKey}`
              : "";
            return (
              <li
                key={secret.slug}
                className="border p-4 rounded shadow flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm break-all">
                    {secret.encryptionKey ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                        link
                      </a>
                    ) : <p>link not available</p>}
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      secret.status === "expired"
                        ? "bg-gray-200 text-gray-600"
                        : secret.status === "viewed & consumed"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {secret.status}
                  </span>
                </div>

                <div className="bg-gray-100 p-2 rounded text-sm font-mono whitespace-pre-wrap">
                  {revealed[secret.slug]?.length > 0
                    ? revealed[secret.slug]
                    : "•••••••••• (hidden)"}
                </div>

                <div className="flex gap-2">
                  {secret.encryptionKey && (
                    <button
                      onClick={() => handleReveal(secret)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Reveal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this secret?")) {
                        deleteMutation.mutate(secret.slug);
                      }
                    }}
                    className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-600">No secrets found.</p>
      )}
    </div>
  );
}
