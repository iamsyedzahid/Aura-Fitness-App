import type { Metadata } from "next";
import "../styles/globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "AuraFit — Train Smarter",
  description: "Your intelligent fitness companion. Track workouts, monitor progress, reach goals.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
