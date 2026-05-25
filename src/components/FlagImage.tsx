import { countries } from '../data/countries';
import { territories } from '../data/territories';
import { getFlagEmoji } from '../utils/flagEmoji';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SLUG_BY_CODE = new Map<string, string>();
for (const c of countries) SLUG_BY_CODE.set(c.code.toUpperCase(), slugify(c.name));
for (const t of territories) SLUG_BY_CODE.set(t.code.toUpperCase(), slugify(t.name));

type Props = {
  code: string;
  name?: string;
  alt?: string;
  className?: string;
  title?: string;
};

export function FlagImage({ code, name, alt, className = '', title }: Props) {
  const slug = name ? slugify(name) : SLUG_BY_CODE.get(code.toUpperCase());
  if (!slug) {
    return (
      <span className={className} role="img" aria-label={alt ?? `Flag of ${name ?? code}`} title={title}>
        {getFlagEmoji(code)}
      </span>
    );
  }
  return (
    <img
      src={`/flag-images/flag-${slug}.svg`}
      alt={alt ?? `Flag of ${name ?? code}`}
      title={title}
      loading="lazy"
      className={`inline-block ${className}`}
      style={{ height: '1em', width: 'auto', verticalAlign: '-0.15em' }}
    />
  );
}
