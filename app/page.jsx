import Image from "next/image";
import LandingNavbar from "@/components/LandingNavbar";
import sampleLogo from "@/app/images/sample_logo.jpg";
import ConnectInquiryForm from "@/components/ConnectInquiryForm";
import { FaEnvelope, FaFacebookF, FaTiktok } from "react-icons/fa";

export default function LandingPage() {
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] min-h-screen w-screen overflow-hidden bg-[#05111f] pt-20 text-white">
      <style>{`
        header[data-global-navbar="true"] {
          display: none;
        }

        body {
          margin: 0;
          min-height: 100vh;
          background: #05111f;
          color: #ffffff;
          font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
        }

        body > main {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button, input, textarea, select {
          font: inherit;
        }

        .text-white {
          color: #ffffff !important;
        }

        .bg-[#05111f] {
          background-color: #05111f !important;
        }
      `}</style>

      <LandingNavbar />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-80 w-80 rounded-full bg-[#0b4f8a]/35 blur-3xl" />
        <div className="absolute bottom-10 left-14 h-72 w-72 rounded-full bg-[#0f77c6]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,10,22,0.95),rgba(3,19,39,0.84))]" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div id="home" data-scroll-section className="fade-rise relative mx-auto grid min-h-[calc(100vh-82px)] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 2xl:max-w-[92rem]">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-white/30 bg-black/25 px-3 py-1 text-xs tracking-wider text-white">
            Korean Language E-learning
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-6xl [font-family:var(--font-headline)]">
            Your <span className="text-[#FFBF00]">Korean</span>
            <br />
            Journey Starts
            <br />
            Here!
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
            Whether you are into K-dramas, K-pop, or traveling to Korea, we help you understand
            and speak naturally. Start with Hangeul, build real conversations, and gain confidence step by step.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <a
              href="https://www.facebook.com/share/1CMDGjEwfr/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook page"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6b21f] text-[#07223a] transition hover:brightness-110"
            >
              <FaFacebookF size={22} />
            </a>
            <a
              href="https://www.tiktok.com/@languagecourses1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok page"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <FaTiktok size={20} />
            </a>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-[560px] lg:block">
          <div className="rounded-3xl border border-white/25 bg-[#06172b]/55 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <Image
              src={sampleLogo}
              alt="Beyond Hangeul brand logo"
              priority
              className="h-auto w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      </div>

      <div className="relative h-px w-full bg-white/20" />

      <section id="about" data-scroll-section className="fade-rise relative mx-auto mt-14 w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 2xl:max-w-[92rem]">
        <div className="rounded-3xl border border-white/20 bg-[#071629]/70 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
          <p className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300">
            ABOUT BEYOND HANGEUL
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white [font-family:var(--font-headline)]">Our Identity</h2>
          <div className="mt-5 space-y-5">
            <p className="max-w-5xl leading-8 text-slate-200">
              Beyond Hangeul was established in March 2026 as a response to the cluttered world of language learning.
              We do not just teach characters; we curate communication.
            </p>
            <p className="max-w-5xl leading-8 text-slate-200">
              Born from a background in Accountancy, Business, and Management (ABM), our philosophy is built on
              efficiency, logic, and aesthetic precision. We view the Korean language not just as a subject, but as a
              strategic asset for the modern professional and the aesthetic-focused learner.
            </p>
          </div>

          <div className="my-10 h-px w-full bg-white/15" />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5">
              <h3 className="text-xl font-bold text-amber-300 [font-family:var(--font-headline)]">The Vision</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                To move Beyond the basics. While others stop at grammar, we dive into the nuance of social layers,
                professional context, and the noir side of language, the quiet, sophisticated mastery of K-culture.
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5 lg:col-span-2">
              <h3 className="text-xl font-bold text-amber-300 [font-family:var(--font-headline)]">The Methodology</h3>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-200">
                <p>
                  <span className="font-semibold text-white">Selective Curation:</span> We skip the fluff. Every
                  lesson is hand-picked to ensure it is high-impact and immediately applicable.
                </p>
                <p>
                  <span className="font-semibold text-white">Structural Logic:</span> Using business-level
                  organization to break down complex Korean phonetics and grammar.
                </p>
                <p>
                  <span className="font-semibold text-white">Noir Aesthetic:</span> We believe that a focused,
                  minimalist environment leads to deeper retention. Our design is intentional; our content is
                  essential.
                </p>
              </div>
            </article>
          </div>

          <div className="my-10 h-px w-full bg-white/15" />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5">
              <h3 className="text-xl font-bold text-amber-300 [font-family:var(--font-headline)]">Meet the Curator</h3>
              <p className="mt-2 text-sm font-semibold text-white">Bless | Founder & Lead Strategist</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                With six years of experience in high-level networking and a foundation in business management, Bless
                founded Beyond Hangeul to redefine how we interact with foreign languages. By merging professional
                discipline with a passion for Korean culture, she has created a showcase that is as functional as it
                is beautiful.
              </p>
              <p className="mt-3 text-sm italic text-amber-200">
                &quot;Language is the ultimate investment. We are here to ensure your returns are limitless.&quot;
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5">
              <h3 className="text-xl font-bold text-amber-300 [font-family:var(--font-headline)]">
                Development & Digital Architecture
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                The Beyond Hangeul digital experience was engineered by Jefferson Feliciano.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                With a focus on seamless navigation and minimalist UX, the site was built to reflect the structural
                logic and premium aesthetic of the brand.
              </p>
            </article>
          </div>
        </div>
      </section>

      <div className="relative h-px w-full bg-white/20" />

      <section id="reviews" data-scroll-section className="fade-rise relative mx-auto mt-14 w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 2xl:max-w-[92rem]">
        <div className="rounded-3xl border border-white/20 bg-[#071629]/70 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
          <h2 className="text-4xl font-bold text-[#FFBF00] [font-family:var(--font-headline)]">
            Validated Progress. Curated Success.
          </h2>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-200">
            &quot;See how our logic-based approach helps modern learners master Korean with precision.&quot;
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 border-l-4 border-l-[#FFBF00] bg-[#1A1A1C] p-5">
              <p className="text-base font-semibold text-white">1. The Strategic Learner</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Beyond Hangeul stripped away the fluff. The focus on high-impact vocabulary and professional
                context allowed me to level up my conversational skills faster than any traditional classroom.&quot;
              </p>
              <p className="mt-4 text-sm font-semibold text-amber-200">- Marc G., Operations Manager</p>
            </article>

            <article className="rounded-2xl border border-white/10 border-l-4 border-l-[#FFBF00] bg-[#1A1A1C] p-5">
              <p className="text-base font-semibold text-white">2. The Visual Thinker</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Finally, a platform that understands aesthetic immersion. The minimalist design does not just look
                good; it removes the mental clutter, making the Hangul characters much easier to retain.&quot;
              </p>
              <p className="mt-4 text-sm font-semibold text-amber-200">- Sienna L., Brand Designer</p>
            </article>

            <article className="rounded-2xl border border-white/10 border-l-4 border-l-[#FFBF00] bg-[#1A1A1C] p-5">
              <p className="text-base font-semibold text-white">3. The Career Focused</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Coming from a business background, I appreciate the logical structure of these lessons. It is
                organized, efficient, and fits perfectly into a high-speed lifestyle.&quot;
              </p>
              <p className="mt-4 text-sm font-semibold text-amber-200">- Aaron V., ABM Specialist</p>
            </article>
          </div>
        </div>
      </section>

      <div className="relative h-px w-full bg-white/20" />

      <section id="contact" data-scroll-section className="fade-rise relative mx-auto mt-14 w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 2xl:max-w-[92rem]">
        <div className="rounded-3xl border border-white/20 bg-[#071629]/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-8">
          <h2 className="text-3xl font-bold text-[#FFBF00] [font-family:var(--font-headline)] sm:text-4xl">
            Start the Conversation.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg">
            &quot;Whether you have a business inquiry, a technical question, or feedback on our curated lessons, our
            doors are open.&quot;
          </p>

          <div className="my-8 h-px w-full bg-white/15" />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 min-w-0">
              <article className="w-full max-w-full min-w-0 rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5 sm:p-6">
                <h3 className="text-2xl font-bold text-white [font-family:var(--font-headline)]">
                  Direct Channels
                </h3>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
                  <div className="w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-[#0f1725]/70 p-4">
                    <p className="font-semibold text-amber-300">General Inquiries</p>
                    <a
                      href="mailto:jffrsnfeliciano0000@gmail.com"
                      className="mt-2 flex flex-wrap w-full items-center gap-2 break-words text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
                    >
                      <FaEnvelope size={14} />
                      jffrsnfeliciano0000@gmail.com
                    </a>
                  </div>
                </div>
              </article>

              <article className="w-full max-w-full min-w-0 rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5 sm:p-6">
                <h3 className="text-2xl font-bold text-white [font-family:var(--font-headline)]">
                  Socials
                </h3>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
                  <div className="w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-[#0f1725]/70 p-4">
                    <p className="font-semibold text-amber-300">Connect on socials</p>
                    <ul className="mt-4 space-y-3">
                      <li className="w-full max-w-full min-w-0 rounded-xl border border-white/15 bg-[#1A1A1C] p-4">
                        <a
                          href="https://www.tiktok.com/@languagecourses1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-wrap items-center gap-2 break-all text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
                        >
                          <FaTiktok size={14} />
                          www.tiktok.com/@languagecourses1
                        </a>
                      </li>
                      <li className="w-full max-w-full min-w-0 rounded-xl border border-white/15 bg-[#1A1A1C] p-4">
                        <a
                          href="https://www.facebook.com/share/18j3WAH3Ho/?mibextid=wwXIfr"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-wrap items-center gap-2 break-all text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
                        >
                          <FaFacebookF size={14} />
                          https://www.facebook.com/share/18j3WAH3Ho/?mibextid=wwXIfr
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>

            <article className="w-full max-w-full min-w-0 rounded-2xl border border-white/15 bg-[#0c213a]/70 p-5 sm:p-6">
              <h3 className="text-2xl font-bold text-white [font-family:var(--font-headline)]">
                The Inquiry Form
              </h3>
              <ConnectInquiryForm />
            </article>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/15 px-4 py-8 text-center text-sm text-slate-300 sm:px-6 lg:px-8">
        <p>&copy; 2026 Beyond Hangeul. Curated by Bless.</p>
        <p className="mt-1">Architected by Jefferson Feliciano.</p>
      </footer>
    </section>
  );
}
