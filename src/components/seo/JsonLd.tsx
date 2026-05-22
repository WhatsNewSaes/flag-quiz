import { useEffect } from 'react';

interface JsonLdProps {
  id: string;
  data: object;
}

export function JsonLd({ id, data }: JsonLdProps) {
  useEffect(() => {
    const selector = `script[data-jsonld="${id}"]`;
    let el = document.head.querySelector<HTMLScriptElement>(selector);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-jsonld', id);
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      el?.remove();
    };
  }, [id, data]);

  return null;
}

const SITE_URL = 'https://flagarcade.com';

export interface BreadcrumbCrumb {
  name: string;
  url?: string;
}

export function breadcrumbListSchema(crumbs: BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.url ? { item: c.url.startsWith('http') ? c.url : `${SITE_URL}${c.url}` } : {}),
    })),
  };
}
