import type { SVGProps } from "react";

function base(p: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...p,
  };
}

export const IconBox = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 8.2 12 3.5 3 8.2v7.6l9 4.7 9-4.7V8.2Z" />
    <path d="M3.4 8.4 12 12.8l8.6-4.4" />
    <path d="M12 12.8V20" />
  </svg>
);

export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" />
    <path d="M8 15.5v-4M12 15.5V7.5M16 15.5v-6" />
  </svg>
);

export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4M12 16.8v.01" />
  </svg>
);

export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);

export const IconScan = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </svg>
);

export const IconSheet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 13h7M8.5 16.5h7M12 13v6.5" />
  </svg>
);

export const IconIn = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v10" />
    <path d="m8 9.5 4 4 4-4" />
    <path d="M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
  </svg>
);

export const IconOut = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 13V3" />
    <path d="m8 6.5 4-4 4 4" />
    <path d="M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
  </svg>
);

export const IconAdjust = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="8" cy="16" r="2" />
  </svg>
);
