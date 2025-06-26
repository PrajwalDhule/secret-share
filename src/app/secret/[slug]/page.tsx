// src/app/secret/[slug]/page.tsx
import SecretPageClient from "./SecretPageClient";

export default function SecretPage({ params }: { params: { slug: string } }) {
  return <SecretPageClient slug={params.slug} />;
}