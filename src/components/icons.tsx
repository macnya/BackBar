import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(p: P): P {
  return {
    width: 20,
    height: 20,
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

export const Logo = ({ className = "h-9 w-9" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect x="1" y="1" width="30" height="30" rx="8" fill="#ab4e0e" />
    <path d="M8.5 9.5h15l-7.5 8.2-7.5-8.2Z" fill="#fffcf6" />
    <path d="M16 17.7V25" stroke="#fffcf6" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M11 25h10" stroke="#fffcf6" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="21.8" cy="6.4" r="1.9" fill="#f6e0c8" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </svg>
);

export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 8.2 12 3.5 3 8.2v7.6l9 4.7 9-4.7V8.2Z" />
    <path d="M3.4 8.4 12 12.8l8.6-4.4" />
    <path d="M12 12.8V20" />
  </svg>
);

export const IconScan = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </svg>
);

export const IconQr = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17.5 20.5h3" />
  </svg>
);

export const IconSheet = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 13h7M8.5 16.5h7M12 13v6.5" />
  </svg>
);

export const IconCup = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
    <path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M7.5 4.5c0-.8.7-1 .7-1.8M11 4.5c0-.8.7-1 .7-1.8" />
  </svg>
);

export const IconTruck = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 5.5h11v11h-11z" />
    <path d="M13.5 9.5H18l3.5 3.5v3.5h-8" />
    <circle cx="6.5" cy="18.5" r="1.8" />
    <circle cx="17.5" cy="18.5" r="1.8" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" />
    <path d="M8 15.5v-4M12 15.5V7.5M16 15.5v-6" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4l11-11a2.1 2.1 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconPrinter = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V3.5h10V8" />
    <rect x="4" y="8" width="16" height="8" rx="1.5" />
    <path d="M7 13.5h10V20H7z" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5a2 2 0 0 1 2-2h1.5L9 4.5h6l1.5 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
    <path d="m16 8 4 4-4 4M20 12H10" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4M12 16.8v.01" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconIn = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v10" />
    <path d="m8 9.5 4 4 4-4" />
    <path d="M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
  </svg>
);

export const IconOut = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 13V3" />
    <path d="m8 6.5 4-4 4 4" />
    <path d="M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11" />
    <path d="m7.5 11 4.5 4.5L16.5 11" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V4" />
    <path d="M7.5 8 12 3.5 16.5 8" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10v9.5h16V10" />
    <path d="M3.5 5.5 5 4h14l1.5 1.5a2.3 2.3 0 0 1-4 1.7 2.3 2.3 0 0 1-4.1 0 2.3 2.3 0 0 1-4.1 0 2.3 2.3 0 0 1-4-1.7Z" />
    <path d="M9.5 19.5V14h5v5.5" />
  </svg>
);

export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8L21 12l-8.5 8.5-9-8Z" />
    <circle cx="8" cy="8" r="1.2" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.4 3.7-5 7-5s6.2 1.6 7 5" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </svg>
);

export const IconBottle = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 2.5h4M10.5 2.5v4l-2.4 3A3 3 0 0 0 7.5 11.6V19a2.5 2.5 0 0 0 2.5 2.5h4A2.5 2.5 0 0 0 16.5 19v-7.4a3 3 0 0 0-.6-2.1l-2.4-3v-4" />
    <path d="M7.5 13.5h9" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9.5" />
    <path d="M20 5v4.5h-4.5" />
    <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4 14.5" />
    <path d="M4 19v-4.5h4.5" />
  </svg>
);
