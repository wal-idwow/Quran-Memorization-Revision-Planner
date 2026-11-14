import React from 'react';

export function RubElHizbIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="1.5"
        transform="rotate(45 16 16)"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="16" cy="16" r="2.75" fill="currentColor" />
    </svg>
  );
}
