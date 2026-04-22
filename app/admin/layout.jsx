import { AdminThemeOverride, AdminThemeProvider } from "@/components/theme/ThemeProvider";

export default function AdminLayout({ children }) {
  return (
    <AdminThemeProvider>
      <AdminThemeOverride />
      <style>{`
        header[data-global-navbar="true"] {
          display: none;
        }

        body > main {
          margin: 0 !important;
          max-width: none !important;
          min-height: 100vh;
          padding: 0 !important;
        }

        body {
          overflow-x: hidden;
        }
      `}</style>
      {children}
    </AdminThemeProvider>
  );
}
