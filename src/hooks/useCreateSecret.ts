// src/hooks/useCreateSecret.ts
import { api } from "@/utils/api";
import { encryptAES, generateKey, exportKey } from "@/utils/crypto";

export function useCreateEncryptedSecret() {
  const mutation = api.secrets.create.useMutation();

  const create = async (
    secretText: string,
    expiresIn: number,
    oneTime: boolean,
    password?: string,
    storeKey?: boolean
  ) => {
    const key = await generateKey();
    const exportedKey = await exportKey(key);
    const { ciphertext, iv } = await encryptAES(secretText, key);

    const { slug } = await mutation.mutateAsync({
      ciphertext,
      iv,
      expiresIn,
      oneTime,
      password,
      encryptionKey: storeKey ? exportedKey : undefined,
    });

    return `${window.location.origin}/secret/${slug}#${exportedKey}`;
  };

  return { create, ...mutation };
}