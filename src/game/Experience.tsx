import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Scene } from "./Scene";
import { CHAPTERS, chapterFor, timeline, useGame } from "./store";
import { HUD } from "./HUD";
import { HashLab, TamperLab } from "./Labs";
import { Quiz } from "./Quiz";

type Beat = { start: number; end: number; vh: number; side: "left" | "right" | "center"; eyebrow: string; title: string; body: string[]; id?: string };

const BEATS: Beat[] = [
  { id: "intro", start: 0, end: 0.06, vh: 120, side: "center", eyebrow: "Chapter 01 · Welcome", title: "Money, Reimagined.", body: ["Discover the technology changing how digital value moves, verifies, and connects."] },
  { start: 0.06, end: 0.14, vh: 120, side: "left", eyebrow: "Digital assets", title: "Not all coins are the same.", body: ["A cryptocurrency is a digital asset whose ownership is recorded on a shared ledger instead of a single company's database.", "Bitcoin launched in 2009, created by the pseudonymous Satoshi Nakamoto. Its rules cap supply at 21 million BTC — a protocol rule, not a price promise. One bitcoin divides into 100,000,000 satoshis."] },
  { id: "wallets", start: 0.14, end: 0.3, vh: 200, side: "left", eyebrow: "Chapter 02 · Wallets", title: "A wallet holds keys, not coins.", body: ["Coins live on the blockchain. A wallet stores the private key that proves you control them.", "Public address → share it to get paid. Private key / seed phrase → never share it. Lose it and access can be lost for good.", "Custodial wallets (an exchange) hold keys for you; non-custodial wallets let you hold them yourself."] },
  { id: "transaction", start: 0.3, end: 0.44, vh: 180, side: "right", eyebrow: "Chapter 03 · The Transaction", title: "Alice signs. Nobody can forge it.", body: ["Alice's private key creates a digital signature over the transaction: “send 0.5 BTC to Bob”.", "Anyone can check the signature with her public key — without ever seeing the private key. Status: Signed → Broadcast."] },
  { id: "network", start: 0.44, end: 0.58, vh: 200, side: "left", eyebrow: "Chapter 04 · The Network", title: "Thousands of nodes. Zero bosses.", body: ["The signed transaction hops node to node across a peer-to-peer network. Each node checks the rules independently.", "That red packet? A conflicting double-spend. Nodes reject it — it never reaches a miner."] },
  { id: "block", start: 0.58, end: 0.72, vh: 200, side: "right", eyebrow: "Chapter 05 · Mining", title: "Find the nonce, seal the block.", body: ["Miners bundle valid transactions into a candidate block, then guess a number (the nonce) billions of times until the block's hash falls below a difficulty target.", "Winning is probabilistic — more computing power, more lottery tickets. This Proof of Work consumes real energy. Status: Included in block."] },
  { id: "chain", start: 0.72, end: 0.86, vh: 200, side: "left", eyebrow: "Chapter 06 · The Blockchain", title: "Each block remembers the last.", body: ["Every block stores the previous block's hash. That link turns a pile of records into a chain.", "As more blocks stack on top, the transaction gains confirmations — and Bob's wallet lights up. Status: More confirmations."] },
];

function useScrollEngine() {
  const setChapter = useGame((s) => s.setChapter);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    const tick = (t: number) => lenis?.raf(t * 1000);
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    (window as unknown as { __lenis?: Lenis | null }).__lenis = lenis;

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-tl-start]").forEach((el) => {
        const a = Number(el.dataset.tlStart);
        const b = Number(el.dataset.tlEnd);
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            timeline.progress = a + (b - a) * self.progress;
            setChapter(chapterFor(timeline.progress));
          },
          onEnterBack: (self) => {
            timeline.progress = a + (b - a) * self.progress;
          },
        });
      });
      // text reveals tied to scroll (reversible)
      gsap.utils.toArray<HTMLElement>(".beat-card").forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 60 },
          { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: card, start: "top 85%", end: "top 45%", scrub: true } },
        );
      });
    });
    ScrollTrigger.refresh();
    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, [setChapter]);
}

export function scrollToChapter(i: number) {
  const el = document.getElementById(`ch-${CHAPTERS[i].id}`);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis | null }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView();
}

export function Experience() {
  useScrollEngine();
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <div ref={wrap} className="relative">
      <div className="fixed inset-0 z-0">
        <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.4, 7.5], fov: 45 }}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <HUD />
      <main className="relative z-10">
        {BEATS.map((b, i) => (
          <section
            key={i}
            id={b.id ? `ch-${b.id}` : undefined}
            data-tl-start={b.start}
            data-tl-end={b.end}
            style={{ height: `${b.vh}vh` }}
            className={`beat beat-${b.side}`}
          >
            {i === 0 ? (
              <div className="hero">
                <p className="eyebrow">{b.eyebrow}</p>
                <h1 className="display">{b.title}</h1>
                <p className="lead">{b.body[0]}</p>
                <button className="btn-primary pointer-events-auto" onClick={() => scrollToChapter(1)}>
                  Start the Journey
                </button>
                <p className="scroll-hint">Scroll to play the film ↓</p>
              </div>
            ) : (
              <div className="beat-card">
                <p className="eyebrow">{b.eyebrow}</p>
                <h2 className="headline">{b.title}</h2>
                {b.body.map((t, j) => (
                  <p key={j} className="body-copy">{t}</p>
                ))}
              </div>
            )}
          </section>
        ))}
        <section id="ch-hash" data-tl-start={0.86} data-tl-end={0.94} className="lab-section">
          <HashLab />
          <TamperLab />
        </section>
        <section id="ch-challenge" data-tl-start={0.94} data-tl-end={1} className="lab-section">
          <Quiz />
        </section>
      </main>
    </div>
  );
}
