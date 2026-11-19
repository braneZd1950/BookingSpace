/**
 * Shared stroke icons for marketing pages (Home / Features).
 * Pass className to match page styles; id selects the glyph.
 */
export default function StrokeIcon({ id, className }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  if (id === 'booking') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M12 8.2v4.1l2.7 1.6" />
      </svg>
    );
  }

  if (id === 'calendar' || id === 'organize') {
    return (
      <svg {...common}>
        <rect x="4.5" y="5.5" width="15" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M8 3.9v3M16 3.9v3M4.5 10.2h15M9 14h6M9 17h3.5" />
      </svg>
    );
  }

  if (id === 'booking-check') {
    return (
      <svg {...common}>
        <rect x="4.5" y="5.5" width="15" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M8 3.9v3M16 3.9v3M4.5 10.2h15" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="m9.2 14.4 1.8 1.8 3.8-3.8" />
      </svg>
    );
  }

  if (id === 'members') {
    return (
      <svg {...common}>
        <circle cx="9" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.2" cy="9.6" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M4.8 18.2c.9-2.6 2.7-3.9 4.2-3.9s3.3 1.3 4.2 3.9M13.4 14.8c1.1-.5 2.4-.5 3.6.2 1.1.7 1.9 1.9 2.3 3.2" />
      </svg>
    );
  }

  if (id === 'overview') {
    return (
      <svg {...common}>
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M5 18.2V9.5M10.2 18.2V6.2M15.4 18.2v-5.2M20 18.2V8.4" />
      </svg>
    );
  }

  if (id === 'settings' || id === 'fit') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          d="M12 4.6v1.7M12 17.7v1.7M4.6 12h1.7M17.7 12h1.7M6.6 6.6l1.2 1.2M16.2 16.2l1.2 1.2M17.4 6.6l-1.2 1.2M7.8 16.2l-1.2 1.2"
        />
      </svg>
    );
  }

  // site / default
  return (
    <svg {...common}>
      <rect x="3.8" y="5" width="16.4" height="14" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M3.8 9.2h16.4M8 5v4.2" />
    </svg>
  );
}
