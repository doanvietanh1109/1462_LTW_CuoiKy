import React from "react";
import { Link } from "react-router-dom";

/** Shared RIPT Rental house mark and wordmark for light and dark surfaces. */
export const BrandLogo = ({ variant = "light", className = "" }) => (
  <Link
    to="/"
    className={`brand-logo brand-logo--${variant} ${className}`.trim()}
    aria-label="RIPT Rental — Trang chủ"
  >
    <svg className="brand-logo__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M6.5 41V21.7L23.5 7.5l17 14.2V41" />
      <path className="brand-logo__roof-accent" d="M33.5 11.8h6.7v6.7" />
      <path className="brand-logo__house-accent" d="m18.8 28.4 4.7-3.8 4.7 3.8v7.4h-9.4z" />
    </svg>
    <span className="brand-logo__name">RIPT Rental</span>
  </Link>
);
