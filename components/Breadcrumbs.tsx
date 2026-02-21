"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="ms-breadcrumbs">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="ms-breadcrumb-sep">&gt;</span>}
          {item.href ? (
            <Link href={item.href} className="ms-breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            <span className="ms-breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
