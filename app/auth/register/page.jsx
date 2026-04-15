import AuthNavbar from "@/components/AuthNavbar";
import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";
import BHLogo from "@/app/images/BH-logo.png";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <section className="fade-rise relative left-1/2 right-1/2 -mx-[50vw] min-h-[calc(100vh-73px)] w-screen overflow-hidden text-white pt-20">
      <style>{`
        body > main {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `}</style>
      <AuthNavbar page="register" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-80 w-80 rounded-full bg-[#0b4f8a]/35 blur-3xl" />
        <div className="absolute bottom-10 left-14 h-72 w-72 rounded-full bg-[#0f77c6]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,10,22,0.95),rgba(3,19,39,0.84))]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#0a1e35]/80 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          <div className="mx-auto mb-2 w-fit">
            <Image src={BHLogo} alt="Beyond Hangeul logo" width={84} height={84} className="object-contain" />
          </div>
          <div className="mb-3 text-center">
            <p className="text-2xl font-semibold text-white font-headline">Create Account</p>
            <p className="mt-1 text-sm text-white/70">Start your journey with Beyond Hangeul.</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </section>
  );
}
