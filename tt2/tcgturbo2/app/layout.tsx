import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'TCG Turbo | Next-Gen Tactical Ascension Web TCG',
  description:
    'Next-Generation Hybrid Trading Card Game featuring 3D holographic foils, local couch co-op with privacy shield, tactical in-place ascension mechanics, and smart AI duelists.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#080911] text-slate-100 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
