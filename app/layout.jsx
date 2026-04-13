import { Inter, Montserrat, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${montserrat.variable}`}
      data-profile-theme="dark"
      data-scroll-behavior="smooth"
      style={{ fontSize: "100%" }}
      suppressHydrationWarning
    >
      <body className="text-foreground [font-family:var(--font-body)]">
        <Script id="bh-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var theme = localStorage.getItem('bh-theme-mode');
                var font = localStorage.getItem('bh-font-size');
                var normalizedTheme = theme === 'light' || theme === 'dark' ? theme : 'dark';
                document.documentElement.setAttribute('data-profile-theme', normalizedTheme);
                var parsed = Number(font);
                if (!Number.isNaN(parsed) && parsed >= 90 && parsed <= 120) {
                  document.documentElement.style.fontSize = parsed + '%';
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
