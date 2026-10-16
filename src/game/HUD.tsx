import { useEffect, useRef, useState } from "react";
import { Award, Map as MapIcon, Sparkles, X } from "lucide-react";
import { CHAPTERS, timeline, useGame } from "./store";
import { scrollToChapter } from "./Experience";

export function HUD() {
  const { chapter, xp, badges, toast, clearToast, visited } = useGame();
  const bar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${timeline.progress})`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2800);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  return (
    <>
      <div className="progress-track">
        <div ref={bar} className="progress-fill" />
      </div>
      <header className="hud">
        <div className="wordmark">
          <span className="wordmark-coin">₿</span> ChainQuest
        </div>
        <div className="hud-chapter">
          <span className="hud-num">{String(chapter + 1).padStart(2, "0")}</span>
          <span>{CHAPTERS[chapter].title}</span>
        </div>
        <div className="hud-right">
          <span className="pill"><Sparkles size={14} /> {xp} XP</span>
          <span className="pill"><Award size={14} /> {badges.length}</span>
          <button className="pill pill-btn" onClick={() => setOpen((o) => !o)} aria-label="Chapter navigator">
            {open ? <X size={14} /> : <MapIcon size={14} />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="navigator" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              className={`nav-item ${i === chapter ? "is-active" : ""}`}
              onClick={() => {
                scrollToChapter(i);
                setOpen(false);
              }}
            >
              <span className="hud-num">{String(i + 1).padStart(2, "0")}</span>
              {c.title}
              {visited.includes(i) && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
      )}
      {toast && (
        <div className="toast" role="status">
          <Award size={16} /> {toast}
        </div>
      )}
    </>
  );
}
