import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import MySpaceHeader from "@/components/MySpaceHeader";
import MySpaceFooter from "@/components/MySpaceFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "MySocial — a place for friends",
  description: "The social network rebuilt on Base. Customize your profile, find your Top 8, post bulletins, blog, and optionally tokenize your content.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="ms-shell">
            <MySpaceHeader />
            <main className="ms-content">
              {children}
            </main>
            <MySpaceFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
