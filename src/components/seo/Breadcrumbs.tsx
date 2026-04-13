import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="px-4 py-2 font-body text-sm text-retro-text-secondary">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link to={item.href} className="underline hover:text-retro-text">
                {item.label}
              </Link>
            ) : (
              <span className="text-retro-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
