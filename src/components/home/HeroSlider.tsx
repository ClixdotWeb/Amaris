"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cloudImage, LOGO_WIDTH } from "@/lib/images";

export type Slide = {
  image: string;
  /** CSS object-position for the photo, e.g. "50% 20%" */
  position?: string;
  eyebrow: string;
  /** Headline, upright part */
  title: string;
  /** Headline, italic rose-gold part */
  accent: string;
  cta: string;
  href: string;
};

/**
 * The intro plays on every full page load (opening the site or reloading).
 * This module-level flag survives in-site navigation (client-side routing) but resets on reload,
 * so clicking back to Home from another page goes straight to the slideshow.
 */
let introPlayedThisLoad = false;
/** How long each slide stays before the next one wipes in. */
const SLIDE_MS = 7000;
/** Background of the intro video's first frame, so there is no flash before it starts. */
const INTRO_BG = "#ece2d1";
/** Safety net: never hold the hero on the intro longer than this. */
const INTRO_MAX_MS = 9000;

type Phase = "check" | "intro" | "slides";

/**
 * Home hero.
 * 1. On every page load / reload: full-bleed intro video (muted, inline), then a cross-fade into the slideshow.
 * 2. Slideshow: curtain-wipe + slow settle on photos, masked headline rise; advances automatically, no controls.
 * Skipped straight to the slideshow when returning to Home via in-site navigation, prefers-reduced-motion,
 * blocked autoplay or a video error.
 */
export function HeroSlider({ slides, introVideo }: { slides: Slide[]; introVideo?: string }) {
  const [phase, setPhase] = useState<Phase>(introVideo ? "check" : "slides");
  const [videoShown, setVideoShown] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ended = useRef(false);

  // Decide once, on the client, whether this visit gets the intro.
  useEffect(() => {
    if (phase !== "check") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introPlayedThisLoad || reduced) {
      setPhase("slides");
      return;
    }
    introPlayedThisLoad = true;
    setVideoShown(true);
    setPhase("intro");
  }, [phase]);

  const endIntro = () => {
    if (ended.current) return;
    ended.current = true;
    setPhase("slides"); // slideshow mounts underneath and starts its first wipe
    setVideoFading(true); // video layer fades out on top
    window.setTimeout(() => setVideoShown(false), 1300);
  };

  // Start playback explicitly (autoplay can be refused) + safety timeout.
  useEffect(() => {
    if (phase !== "intro") return;
    const v = videoRef.current;
    v?.play().catch(endIntro);
    const t = window.setTimeout(endIntro, INTRO_MAX_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative h-[82svh] min-h-[540px] overflow-hidden lg:h-[calc(100svh-88px)] lg:max-h-[920px] lg:min-h-[620px]"
      style={{ backgroundColor: phase === "slides" ? "#1c0a0b" : INTRO_BG }}
    >
      {phase === "slides" && <Slideshow slides={slides} />}

      {/* Before the client decides intro vs slideshow (first paint / hydration): same logo + line as the intro buffer */}
      {phase === "check" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" aria-hidden>
          <img src={cloudImage("/Assets/logo-dark.png", LOGO_WIDTH)} alt="" className="h-28 w-auto md:h-36" />
          <span className="relative h-px w-28 overflow-hidden bg-[#350f10]/15">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[loader_1.4s_ease-in-out_infinite] bg-[#b07a5c]" />
          </span>
        </div>
      )}

      {introVideo && videoShown && (
        <div
          className={`absolute inset-0 z-[60] transition-opacity duration-[1200ms] ease-out ${videoFading ? "pointer-events-none opacity-0" : "opacity-100"}`}
          style={{ backgroundColor: INTRO_BG }}
        >
          {/* While the video buffers: logo + thin loading line, so the hero never looks empty */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-8 transition-opacity duration-700 ${videoPlaying ? "opacity-0" : "opacity-100"}`}
            aria-hidden
          >
            <img src={cloudImage("/Assets/logo-dark.png", LOGO_WIDTH)} alt="" className="h-28 w-auto animate-fade-up md:h-36" />
            <span className="relative h-px w-28 overflow-hidden bg-[#350f10]/15">
              <span className="absolute inset-y-0 left-0 w-1/3 animate-[loader_1.4s_ease-in-out_infinite] bg-[#b07a5c]" />
            </span>
          </div>
          <video
            ref={videoRef}
            src={introVideo}
            muted
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setVideoPlaying(true)}
            onEnded={endIntro}
            onError={endIntro}
            aria-label="Amaris Boutique logo reveal"
            className={`relative h-full w-full object-cover transition-opacity duration-700 ${videoPlaying ? "opacity-100" : "opacity-0"}`}
          />
          <button
            type="button"
            onClick={endIntro}
            className="absolute right-6 bottom-6 rounded-[3px] px-3 py-2 text-[10px] tracking-[0.35em] text-[#350f10]/60 uppercase transition-colors hover:text-[#350f10] md:right-10 md:bottom-10"
          >
            Skip
          </button>
        </div>
      )}
    </section>
  );
}

function Slideshow({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  // Advance automatically. Pauses (invisibly) while hovered or focused so shoppers can read / click;
  // stays on the first slide for prefers-reduced-motion.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => {
      setPrev(i);
      setI((i + 1) % slides.length);
      setTick((k) => k + 1);
    }, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [i, paused, slides.length]);

  const s = slides[i];

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Photos */}
      {slides.map((sl, n) => {
        const active = n === i;
        if (!active && n !== prev) return null;
        return (
          <div
            key={active ? `a-${n}-${tick}` : `p-${n}`}
            className={`absolute inset-0 overflow-hidden ${active ? "z-20 animate-wipe motion-reduce:animate-none" : "z-10"}`}
            aria-hidden={!active}
          >
            <img
              src={sl.image}
              alt=""
              fetchPriority={n === 0 ? "high" : "auto"}
              data-parallax="0.15"
              className={`absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover ${active ? "animate-settle motion-reduce:animate-none" : "scale-[1.02]"}`}
              style={{ objectPosition: sl.position ?? "50% 30%" }}
            />
          </div>
        );
      })}

      {/* Legibility shade: soft, bottom-weighted, no blur */}
      <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(to_top,rgba(20,6,7,0.88)_0%,rgba(20,6,7,0.55)_42%,rgba(20,6,7,0.12)_72%,rgba(20,6,7,0)_100%)]" />

      {/* Copy */}
      <div className="absolute inset-x-0 bottom-16 z-40 px-6 text-center [text-shadow:0_2px_24px_rgba(20,6,7,0.45)] md:bottom-20" aria-live="polite">
        <div key={`t-${tick}`} className="mx-auto flex max-w-4xl flex-col items-center">
          <p className="animate-fade-up text-[10px] tracking-[0.5em] text-[#ead3c3] uppercase motion-reduce:animate-none md:text-[11px]">
            {s.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-[2.9rem] leading-[1.02] font-light text-[#f8f1ea] sm:text-6xl lg:text-[5.6rem]">
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block animate-rise motion-reduce:animate-none" style={{ animationDelay: "250ms" }}>
                {s.title}
              </span>
            </span>{" "}
            <span className="inline-block overflow-hidden pb-2 align-bottom">
              <em className="inline-block animate-rise text-[#ecc7ae] motion-reduce:animate-none" style={{ animationDelay: "420ms" }}>
                {s.accent}
              </em>
            </span>
          </h1>
          <Link
            href={s.href}
            className="group/btn mt-9 inline-flex animate-fade-up items-center gap-3 rounded-[3px] border border-[#f8f1ea]/55 px-7 py-3.5 text-[11px] tracking-[0.28em] text-[#f8f1ea] uppercase transition-colors duration-300 hover:border-[#f8f1ea] hover:bg-[#f8f1ea] hover:text-[#350f10] motion-reduce:animate-none"
            style={{ animationDelay: "700ms" }}
          >
            {s.cta}
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
