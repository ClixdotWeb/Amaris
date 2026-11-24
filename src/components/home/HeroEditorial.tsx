"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cloudImage, LOGO_WIDTH } from "@/lib/images";

export type EditorialSlide = {
  /** Left headline word (italic serif) */
  left: string;
  /** Right headline word(s) (light sans) */
  right: string;
  /** Show a small "&" between the two sides */
  amp?: boolean;
  tagline: string;
  description: string;
  href: string;
  /** Always present: shown while the video loads, or on its own if there is no video */
  poster: string;
  posterPosition?: string;
  /** Optional portrait poster for phones (e.g. the uncropped tall photo) */
  posterMobile?: string;
  /** Optional: portrait photos shown side by side on wide screens instead of the poster (phones use the poster) */
  panels?: string[];
  video?: string;
  videoMobile?: string;
};

export type EditorialFeature = { href: string; label: string; sub: string; image: string };

/** Time each slide stays before the next one wipes in (no visible progress indicator). */
const SLIDE_MS = 4000;
const EASE = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const INTRO_MAX_MS = 9000;
const INTRO_BG = "#ece2d1";

/** Intro plays on every full page load / reload, not when returning to Home via in-site navigation. */
let introPlayedThisLoad = false;

type Phase = "check" | "intro" | "slides";

/**
 * Full-screen editorial video slider.
 * Incoming slide reveals bottom-up (clip-path) while its media scales 1.15 → 1; headline words slide out/in
 * through masks; tagline/description/button fade up; the active dot fills over 5s and advances the slide.
 * Advances every SLIDE_MS without pausing. Arrow keys + swipe. Reduced motion: crossfades only.
 * Slides without a video file fall back to their poster image (with a slow zoom).
 */
export function HeroEditorial({
  slides,
  feature,
  introVideo,
}: {
  slides: EditorialSlide[];
  feature?: EditorialFeature;
  introVideo?: string;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(introVideo ? "check" : "slides");
  const [introShown, setIntroShown] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [revealFirst, setRevealFirst] = useState(false);
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [mobile, setMobile] = useState(false);
  const activationKey = useRef<Record<number, number>>({ 0: 0 });
  const introRef = useRef<HTMLVideoElement>(null);
  const introEnded = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Tell the header whether it sits over dark footage (white) or the cream intro (dark text)
  useEffect(() => {
    document.documentElement.dataset.heroTone = phase === "slides" ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.heroTone;
    };
  }, [phase]);

  // Decide on the intro (client only)
  useEffect(() => {
    if (phase !== "check") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introPlayedThisLoad || reduced) {
      setPhase("slides");
      return;
    }
    introPlayedThisLoad = true;
    setIntroShown(true);
    setPhase("intro");
  }, [phase]);

  const endIntro = useCallback(() => {
    if (introEnded.current) return;
    introEnded.current = true;
    setRevealFirst(true); // slide 1 wipes up over the intro
    setPhase("slides");
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;
    introRef.current?.play().catch(endIntro);
    const t = window.setTimeout(endIntro, INTRO_MAX_MS);
    return () => window.clearTimeout(t);
  }, [phase, endIntro]);

  const go = useCallback(
    (n: number) => {
      const next = (n + slides.length) % slides.length;
      if (next === i) return;
      const k = tick + 1;
      activationKey.current[next] = k;
      setPrev(i);
      setI(next);
      setTick(k);
    },
    [i, tick, slides.length],
  );

  // Auto-advance, always (also while the pointer rests on the hero). Restarts after every change (incl. arrows/swipe).
  useEffect(() => {
    if (phase !== "slides" || slides.length < 2) return;
    const t = window.setTimeout(() => go(i + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [phase, i, tick, go, slides.length]);

  // Arrow keys while the hero is mostly on screen
  useEffect(() => {
    if (phase !== "slides") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      const r = sectionRef.current?.getBoundingClientRect();
      if (!r || r.bottom < window.innerHeight * 0.5) return;
      if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, go, i]);

  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || phase !== "slides") return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? i + 1 : i - 1);
  };

  const s = slides[i];
  const next = slides[(i + 1) % slides.length];
  const nextVideo = mobile ? next.videoMobile ?? next.video : next.video;
  const layers = prev !== null && prev !== i ? [prev, i] : [i];
  /** First slide shown without a transition (no intro): bring the copy in quickly */
  const firstPaint = tick === 0 && !revealFirst;

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative -mt-[73px] h-[100svh] min-h-[560px] overflow-hidden text-white lg:-mt-[89px]"
      style={{ backgroundColor: phase === "slides" ? "#140a0a" : INTRO_BG }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Intro (logo reveal) ── */}
      {phase === "check" && <IntroPlaceholder />}
      {introVideo && introShown && (
        <div className="absolute inset-0 z-0" style={{ backgroundColor: INTRO_BG }}>
          {!introPlaying && <IntroPlaceholder />}
          <video
            ref={introRef}
            src={introVideo}
            muted
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setIntroPlaying(true)}
            onEnded={endIntro}
            onError={endIntro}
            aria-label="Amaris Boutique logo reveal"
            // Landscape logo film: show it whole on portrait phones (cream letterbox matches), fill on larger screens
            className={`relative h-full w-full object-contain transition-opacity duration-700 md:object-cover ${introPlaying ? "opacity-100" : "opacity-0"}`}
          />
          {phase === "intro" && (
            <button
              type="button"
              onClick={endIntro}
              className="absolute right-6 bottom-6 z-10 px-3 py-2 text-[10px] tracking-[0.35em] text-[#350f10]/60 uppercase hover:text-[#350f10] md:right-10 md:bottom-10"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {phase === "slides" && (
        <>
          {/* ── Media layers: previous underneath, incoming reveals from the bottom ── */}
          {layers.map((idx) => {
            const isActive = idx === i;
            const animateIn = isActive && (tick > 0 || revealFirst);
            return (
              <motion.div
                key={`slide-${idx}-${activationKey.current[idx] ?? 0}`}
                className="absolute inset-0 overflow-hidden"
                style={{ zIndex: isActive ? 20 : 10 }}
                initial={animateIn ? (reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }) : false}
                animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: reduce ? 0.7 : 0.9, ease: EASE }}
                onAnimationComplete={() => {
                  if (!isActive) return;
                  setPrev(null);
                  if (revealFirst) setIntroShown(false);
                }}
                aria-hidden={!isActive}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={animateIn && !reduce ? { scale: 1.15 } : false}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  <SlideMedia slide={slides[idx]} active={isActive} mobile={mobile} />
                </motion.div>
              </motion.div>
            );
          })}

          {/* Preload the next video quietly */}
          {nextVideo && <video key={nextVideo} src={nextVideo} preload="auto" muted playsInline className="hidden" aria-hidden />}

          {/* Shades: faint top (header legibility) + bottom gradient for the copy */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(to_bottom,rgba(20,10,10,0.35)_0%,rgba(20,10,10,0)_22%,rgba(20,10,10,0)_45%,rgba(20,10,10,0.65)_100%)]" />

          {/* ── Copy ── */}
          {/* Right padding keeps the glass card clear of the floating WhatsApp button */}
          <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-8 px-5 pb-12 md:px-10 md:pr-28">
            {/* Bottom-left: one calm column, tagline → headline (one phrase) → description → button */}
            <div className="min-w-0">
              <FadeUp k={`t-${i}-${tick}`} delay={firstPaint ? 0.1 : 0.55} reduce={!!reduce}>
                <p className="text-[10px] tracking-[0.42em] text-white/90 uppercase md:text-[11px]">{s.tagline}</p>
              </FadeUp>

              {/* Headline: both words together on one line, each in a mask */}
              <h1 className="relative mt-4 h-[14vw] md:mt-5 md:h-[7.4vw]">
                <AnimatePresence initial={false}>
                  <Headline key={`h-${i}-${tick}`} slide={s} reduce={!!reduce} />
                </AnimatePresence>
              </h1>

              <FadeUp k={`d-${i}-${tick}`} delay={firstPaint ? 0.25 : 0.75} reduce={!!reduce}>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/80">{s.description}</p>
                <Link
                  href={s.href}
                  className="group/btn mt-7 inline-flex items-center gap-3 rounded-[3px] bg-white px-6 py-3.5 text-[11px] tracking-[0.28em] text-[#2b2a2c] uppercase transition-colors duration-300 hover:bg-[#ecc7ae]"
                >
                  Shop the collection
                  <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </FadeUp>
            </div>

              {/* Bottom-right: glass feature card (hidden on mobile) */}
              {feature && (
                <Link
                  href={feature.href}
                  className="group/card hidden items-center gap-4 rounded-[3px] border border-white/20 bg-white/10 p-2.5 pr-5 backdrop-blur-md transition-colors duration-300 hover:bg-white/20 md:flex"
                >
                  <span className="relative block h-[72px] w-14 shrink-0 overflow-hidden rounded-[2px]">
                    <img src={feature.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                  </span>
                  <span>
                    <span className="block text-[11px] tracking-[0.3em] uppercase">{feature.label}</span>
                    <span className="mt-1 block text-xs text-white/70">{feature.sub}</span>
                  </span>
                  <ArrowUpRight size={18} strokeWidth={1.3} className="ml-3 transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
                </Link>
              )}
          </div>
        </>
      )}
    </section>
  );
}

/** Fades its content up when the slide changes (keyed), quick fade out on the way out. */
function FadeUp({ k, delay, reduce, children }: { k: string; delay: number; reduce: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={k}
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** One-line headline phrase. Each word sits in an overflow-hidden mask and slides in/out vertically. */
function Headline({ slide, reduce }: { slide: EditorialSlide; reduce: boolean }) {
  const word = (text: string, k: number, cls: string) => (
    <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        className={`inline-block ${cls}`}
        initial={reduce ? { opacity: 0 } : { y: "110%" }}
        // Incoming words rise 0.3s after the slide starts, 0.08s apart
        animate={
          reduce
            ? { opacity: 1, transition: { duration: 0.6 } }
            : { y: "0%", transition: { duration: 0.85, delay: 0.3 + k * 0.08, ease: EASE } }
        }
        // Outgoing words drop out of their masks straight away
        exit={reduce ? { opacity: 0, transition: { duration: 0.4 } } : { y: "110%", transition: { duration: 0.5, ease: EASE } }}
      >
        {text}
      </motion.span>
    </span>
  );

  // One phrase on one line: italic serif word, optional small "&", then the light sans word(s), sharing a baseline.
  const rightWords = slide.right.split(" ");
  return (
    <span className="absolute inset-x-0 bottom-0 flex items-baseline gap-[0.22em] whitespace-nowrap text-[12.5vw] leading-[0.95] md:text-[6.6vw]">
      {/* Real spaces between parts (flex ignores them visually, but text readers need them) */}
      <span className="font-display font-light italic">{word(slide.left, 0, "")}</span>{" "}
      {slide.amp && (
        <>
          <span className="font-display text-[0.55em] font-light text-[#ecc7ae] italic">{word("&", 1, "")}</span>{" "}
        </>
      )}
      <span className="flex gap-[0.22em] font-sans font-light tracking-[-0.02em]">
        {rightWords.map((w, n) => (
          <span key={w + n}>
            {word(w, (slide.amp ? 2 : 1) + n, "")}
            {n < rightWords.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Video (if available for this screen size) with poster; otherwise the poster with a slow zoom. Plays only when active. */
function SlideMedia({ slide, active, mobile }: { slide: EditorialSlide; active: boolean; mobile: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const src = mobile ? slide.videoMobile ?? slide.video : slide.video;
  const poster = mobile && slide.posterMobile ? slide.posterMobile : slide.poster;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active, src]);

  if (src && !failed) {
    return (
      <video
        ref={ref}
        key={src}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay={active}
        preload="auto"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ objectPosition: slide.posterPosition ?? "50% 40%" }}
      />
    );
  }
  // Wide screens: portrait product photos side by side (editorial triptych), each with the slow zoom
  if (!mobile && slide.panels?.length) {
    return (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full gap-px bg-[#140a0a]" style={{ gridTemplateColumns: `repeat(${slide.panels.length}, 1fr)` }}>
          {slide.panels.map((p, n) => (
            <div key={p} className="overflow-hidden">
              <img
                src={p}
                alt=""
                className={`h-full w-full object-cover ${active ? "animate-settle motion-reduce:animate-none" : ""}`}
                style={{ objectPosition: slide.posterPosition ?? "50% 30%", animationDelay: `${n * 120}ms` }}
              />
            </div>
          ))}
        </div>
        {/* Bright shop photos: warm tint + soft shade behind the copy (bottom-left) for a moodier, legible hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#2a1210]/25 bg-[radial-gradient(ellipse_at_0%_100%,rgba(20,10,10,0.55),transparent_60%)]"
        />
      </div>
    );
  }
  return (
    <img
      src={poster}
      alt=""
      className={`h-full w-full object-cover ${active ? "animate-settle motion-reduce:animate-none" : ""}`}
      style={{ objectPosition: slide.posterPosition ?? "50% 40%" }}
    />
  );
}

function IntroPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" aria-hidden>
      <img src={cloudImage("/Assets/logo-dark.png", LOGO_WIDTH)} alt="" className="h-28 w-auto md:h-36" />
      <span className="relative h-px w-28 overflow-hidden bg-[#350f10]/15">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[loader_1.4s_ease-in-out_infinite] bg-[#b07a5c]" />
      </span>
    </div>
  );
}
