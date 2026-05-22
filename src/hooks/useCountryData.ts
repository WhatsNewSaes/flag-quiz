import { useEffect, useState } from 'react';
import type { FlagDescription } from '../data/flagDescriptions';
import type { CountryFacts } from '../data/countryFacts';

const descCache = new Map<string, FlagDescription | null>();
const factsCache = new Map<string, CountryFacts | null>();

// Prerendered HTML inlines the current page's data so initial render has it
// without a fetch. Read it once at module init and prime the cache.
if (typeof document !== 'undefined') {
  try {
    const el = document.getElementById('__flag_data__');
    if (el?.textContent) {
      const data = JSON.parse(el.textContent) as {
        code: string;
        description?: FlagDescription;
        facts?: CountryFacts;
      };
      if (data.code) {
        if (data.description) descCache.set(data.code.toUpperCase(), data.description);
        if (data.facts) factsCache.set(data.code.toUpperCase(), data.facts);
      }
    }
  } catch {
    // ignore — fall back to fetching
  }
}

async function fetchJson<T>(url: string, cache: Map<string, T | null>, code: string): Promise<T | null> {
  const cached = cache.get(code);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(code, null);
      return null;
    }
    const data = (await res.json()) as T;
    cache.set(code, data);
    return data;
  } catch {
    cache.set(code, null);
    return null;
  }
}

export function useFlagDescription(code: string | undefined): FlagDescription | null | undefined {
  const [data, setData] = useState<FlagDescription | null | undefined>(() =>
    code ? descCache.get(code.toUpperCase()) : null,
  );

  useEffect(() => {
    if (!code) {
      setData(null);
      return;
    }
    const upper = code.toUpperCase();
    const cached = descCache.get(upper);
    if (cached !== undefined) {
      setData(cached);
      return;
    }
    let cancelled = false;
    fetchJson<FlagDescription>(`/data/flag-descriptions/${upper}.json`, descCache, upper).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return data;
}

export function useCountryFacts(code: string | undefined): CountryFacts | null | undefined {
  const [data, setData] = useState<CountryFacts | null | undefined>(() =>
    code ? factsCache.get(code.toUpperCase()) : null,
  );

  useEffect(() => {
    if (!code) {
      setData(null);
      return;
    }
    const upper = code.toUpperCase();
    const cached = factsCache.get(upper);
    if (cached !== undefined) {
      setData(cached);
      return;
    }
    let cancelled = false;
    fetchJson<CountryFacts>(`/data/country-facts/${upper}.json`, factsCache, upper).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return data;
}
