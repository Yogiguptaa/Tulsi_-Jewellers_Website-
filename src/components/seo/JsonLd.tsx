/**
 * Serialises structured data into a <script type="application/ld+json">.
 * Server-rendered, so the markup is in the initial HTML where crawlers read it.
 */
export default function JsonLd({ data }: { data: string }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built by lib/seo.ts from typed objects, never from user input.
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}
