import type { Metadata } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "MySocial — The MySpace of Web3",
  description: "Customizable profiles, Top 8 friends, bulletins & vibes — all on Base. Powered by THRYX.",
  metadataBase: new URL("https://mysocial.mom"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "MySocial — The MySpace of Web3",
    description: "Customizable profiles, Top 8 friends, bulletins & vibes — all on Base.",
    url: "https://mysocial.mom",
    siteName: "MySocial by THRYX",
    images: [{ url: "/thryx-logo.png", width: 512, height: 512 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MySocial — The MySpace of Web3",
    description: "Customizable profiles, Top 8 friends, bulletins & vibes — all on Base.",
    images: ["/thryx-logo.png"],
    site: "@THRYXAGI",
    creator: "@THRYXAGI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${vt323.variable} bg-[#030308] text-gray-200 min-h-screen antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
