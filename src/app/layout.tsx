import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BackBar — Inventory for restaurants & bars",
  description:
    "Register your restaurant or bar, scan stock with your phone, import from Excel, and never run dry again.",
  icons: {
    icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="8" fill="#ab4e0e"/><path d="M8.5 9.5h15l-7.5 8.2-7.5-8.2Z" fill="#fffcf6"/><path d="M16 17.7V25" stroke="#fffcf6" stroke-width="2.2" stroke-linecap="round"/><path d="M11 25h10" stroke="#fffcf6" stroke-width="2.2" stroke-linecap="round"/><circle cx="21.8" cy="6.4" r="1.9" fill="#f6e0c8"/></svg>'),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
