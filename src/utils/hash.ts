import * as argon2 from 'argon2';

const argon2Options: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,  
  timeCost: 3,  
  parallelism: 4,  
  hashLength: 32
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password, argon2Options);
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}