import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ausgaben-Tracker",
  description:
    "Ausgaben in CHF erfassen, Fremdwährungen zum EZB-Kurs umrechnen und pro Monat auswerten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // lang="de": the whole product is German, and a screen reader reads the page
  // in the language declared here.
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
