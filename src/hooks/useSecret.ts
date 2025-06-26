// src/hooks/useSecret.ts
"use client";

import { api } from "@/utils/api";
import { decryptAES, importKey } from "@/utils/crypto";
import { TRPCClientError } from "@trpc/client";
import { useEffect, useState } from "react";

export function useSecret(slug: string) {
  const [key, setKey] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = api.secrets.getBySlug.useQuery(slug);
  const markViewed = api.secrets.markViewed.useMutation();

  // get key from url fragment like url.com/secret#abcd1234
  useEffect(() => {
    const fragment = window.location.hash.substring(1);
    if (fragment) setKey(fragment);
  }, []);

  const verifyMutation = api.secrets.verifySecretPassword.useMutation({
    onSuccess: async () => {
      if (data && data.status === "available" && key) {
        try {
          const cryptoKey = await importKey(key);
          const plain = await decryptAES(
            data.secret.ciphertext,
            cryptoKey,
            data.secret.iv
          );
          setDecrypted(plain);

          if (data.secret.oneTime) await markViewed.mutateAsync(slug);
        } catch (err) {
          setError((err as Error).message || "Decryption failed after successful verification");
        }
      }
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        setError(err.message); 
      } else {
        setError("An unexpected error occurred during verification.");
      }
    },
  });

  async function decrypt() {
    if (!data || data.status !== "available" || !key) return;

    setError(null); 

    if (data.secret.hasPassword) { 
        verifyMutation.mutate({ slug, password });
    } else {
        try {
            const cryptoKey = await importKey(key);
            const plain = await decryptAES(
                data.secret.ciphertext,
                cryptoKey,
                data.secret.iv
            );
            setDecrypted(plain);

            if (data.secret.oneTime) await markViewed.mutateAsync(slug);
        } catch (err) {
            setError((err as Error).message || "Decryption failed");
        }
    }
  }

  return {
    isLoading,
    status: data?.status,
    decrypted,
    decrypt,
    setPassword,
    password,
    error,
  };
}