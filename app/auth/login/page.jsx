import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <section className="fade-rise relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden text-white">
      <style>{`
        body > main {
          min-height: calc(100vh - 73px);
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-80 w-80 rounded-full bg-[#0b4f8a]/35 blur-3xl" />
        <div className="absolute bottom-10 left-14 h-72 w-72 rounded-full bg-[#0f77c6]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,10,22,0.95),rgba(3,19,39,0.84))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] bg-size-[42px_42px] opacity-15" />

      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-md -translate-y-6 rounded-2xl border border-white/20 bg-[#0a1e35]/75 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}
