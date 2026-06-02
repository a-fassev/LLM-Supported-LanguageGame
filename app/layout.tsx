import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Language Game API",
  description: "Backend API for the language learning game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
