import React from "react";

/** Green dashboard mark: a rental home paired with a compact management checklist. */
export const LandlordBrandLogo = ({ showText = true }) => (
  <span className="landlord-brand-logo">
    <svg
      className="landlord-brand-logo__mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="landlord-brand-logo__house"
        d="M5.5 21.2 23 7.5l17.5 13.7v19.3H8.2V21.2"
      />
      <path className="landlord-brand-logo__roof" d="m4.5 21.5 18.6-15 8.2 6.6" />
      <path className="landlord-brand-logo__chimney" d="M34.2 10.9h5.1v7.2" />
      <path className="landlord-brand-logo__window" d="M17.4 17.7h4v4h-4zm7.2 0h4v4h-4zm-7.2 6.5h4v4h-4zm7.2 0h4v4h-4z" />
      <rect className="landlord-brand-logo__checklist" x="13.8" y="27" width="26" height="17" rx="4" />
      <path className="landlord-brand-logo__check" d="m17.1 32.2 1.8 1.8 3.1-3.3m-4.9 7.2 1.8 1.8 3.1-3.3" />
      <path className="landlord-brand-logo__lines" d="M25.2 32.9h10.4m-10.4 5.8h10.4" />
    </svg>
    {showText && <span className="landlord-brand-logo__name">RIPT Rental</span>}
  </span>
);
