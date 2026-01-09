import { useEffect } from "react";

interface JsonLdProps {
  data: object | object[];
}

/**
 * Component to inject JSON-LD schema into the document head
 */
export function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    const schemas = Array.isArray(data) ? data : [data];
    const scripts: HTMLScriptElement[] = [];

    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [data]);

  return null;
}
