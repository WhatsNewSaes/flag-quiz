import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface DropdownItem {
  label: string;
  href: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <nav ref={navRef} aria-label="Breadcrumb" className="px-1 py-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isHome = i === 0 && (item.label === 'Home' || item.href === '/');
          const label = isHome ? (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">🏠</span>
              <span>Home</span>
            </span>
          ) : (
            item.label
          );

          const chipBase =
            'font-retro text-[10px] md:text-[11px] uppercase tracking-wider border-2 border-retro-border shadow-pixel-sm px-2.5 py-1 transition-all';
          const linkChip = `${chipBase} bg-retro-surface text-retro-text hover:translate-y-0.5 hover:shadow-none hover:bg-retro-accent/40`;
          const currentChip = `${chipBase} bg-retro-neon-green text-white`;

          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="font-retro text-[10px] text-retro-neon-green select-none"
                >
                  ▶
                </span>
              )}

              {item.dropdown && item.dropdown.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    aria-expanded={openIndex === i}
                    aria-haspopup="menu"
                    className={`${isLast ? currentChip : linkChip} flex items-center gap-1.5`}
                  >
                    {label}
                    <ChevronDown open={openIndex === i} />
                  </button>
                  {openIndex === i && (
                    <ul
                      role="menu"
                      className="absolute top-full left-0 mt-1 bg-retro-surface border-2 border-retro-border shadow-pixel z-40 min-w-[10rem] py-1"
                    >
                      {item.href && (
                        <li role="none">
                          <Link
                            to={item.href}
                            role="menuitem"
                            onClick={() => setOpenIndex(null)}
                            className="block font-body text-sm px-3 py-1.5 hover:bg-retro-accent/30 transition-colors font-semibold text-retro-neon-blue"
                          >
                            All {item.label} →
                          </Link>
                        </li>
                      )}
                      {item.dropdown.map((d) => (
                        <li key={d.href} role="none">
                          <Link
                            to={d.href}
                            role="menuitem"
                            onClick={() => setOpenIndex(null)}
                            className="block font-body text-sm px-3 py-1.5 hover:bg-retro-accent/30 transition-colors"
                          >
                            {d.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : item.href && !isLast ? (
                <Link to={item.href} className={linkChip}>
                  {label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={currentChip}>
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
