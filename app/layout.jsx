import { Inter, Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import NavigationLoadingOverlay from "@/components/NavigationLoadingOverlay";
import PWARegister from "@/components/PWARegister";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const poppins = Poppins({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["700"],
});

const montserrat = Montserrat({
  variable: "--font-nav",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata = {
  title: "Beyond Hangeul",
  description: "Learn Korean with structured lessons, vocabulary, and progress tracking.",
};

export const viewport = {
  themeColor: "#0b1728",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${montserrat.variable}`}
      data-scroll-behavior="smooth"
      style={{ fontSize: "100%" }}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0b1728" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Beyond Hangeul" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/maskable-icon-512.png" color="#0b1728" />
      </head>
      <body className="text-foreground [font-family:var(--font-body)]">
        <ThemeProvider>
          <NavigationLoadingOverlay />
          <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
