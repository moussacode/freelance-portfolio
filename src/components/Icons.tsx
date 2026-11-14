import type { SVGProps } from 'react';

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

type P = SVGProps<SVGSVGElement>;

export const Sun = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);
export const Moon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
  </svg>
);
export const Burger = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const External = (p: P) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M8 16 16.5 7.5M9.5 7h7.5v7.5" />
  </svg>
);
export const Eye = (p: P) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);
export const Back = (p: P) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M10 6l-6 6 6 6M4 12h16" />
  </svg>
);
export const Arrow = (p: P) => (
  <svg {...base} strokeWidth={2.2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const Chat = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5Z" />
  </svg>
);
export const Check = (p: P) => (
  <svg {...base} width={16} height={16} strokeWidth={2.4} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const Mail = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="3" />
    <path d="M4 8l8 5.5L20 8" />
  </svg>
);
