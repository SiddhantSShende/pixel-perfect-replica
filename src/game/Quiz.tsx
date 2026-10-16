import { useState } from "react";
import { Check, RotateCcw, Trophy, X } from "lucide-react";
import { BADGES, useGame } from "./store";

export interface Question {
  q: string;
  options: string[];
  answer: number;
  why: string;
  topic: string;
}

export const QUESTIONS: Question[] = [
  { topic: "Wallets", q: "What does a crypto wallet actually store?", options: ["The coins themselves", "The private keys that control coins", "A copy of the bank's database"], answer: 1, why: "Coins are recorded on the blockchain. The wallet stores keys that prove control." },
  { topic: "Wallets", q: "True or false: it's safe to share your seed phrase with support staff.", options: ["True", "False"], answer: 1, why: "Anyone with your seed phrase can take your funds. Legitimate support never asks for it." },
  { topic: "Transactions", q: "Arrange: what happens right after Alice signs a transaction?", options: ["It's mined immediately", "It's broadcast to network nodes", "Bob receives it directly by email"], answer: 1, why: "Signed transactions are broadcast and relayed by nodes, which check them before miners include them in a block." },
  { topic: "Hashing", q: "If one character of the input changes, the SHA-256 hash…", options: ["Changes by one character", "Stays the same", "Changes unpredictably"], answer: 2, why: "Good hash functions show the avalanche effect: a tiny change produces a completely different fingerprint." },
  { topic: "Mining", q: "What is a nonce in Proof of Work?", options: ["A number miners vary to find a valid hash", "A miner's password", "The block reward"], answer: 0, why: "Miners repeatedly change the nonce until the block hash is below the difficulty target." },
  { topic: "Security", q: "Someone edits an old block's data. What happens?", options: ["Nothing, the chain adapts", "Its hash changes, breaking links to later blocks", "Only that block's colour changes"], answer: 1, why: "Each block stores the previous hash, so tampering invalidates every block after it." },
  { topic: "Bitcoin", q: "Bitcoin's 21 million cap guarantees its price will rise.", options: ["True", "False"], answer: 1, why: "The cap is a protocol supply rule. Prices depend on markets and can be very volatile." },
];

export function Quiz() {
  const { addXp, award, badges, visited, xp, reset } = useGame();
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(QUESTIONS.map(() => null));
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [review, setReview] = useState<number[] | null>(null);

  const order = review ?? QUESTIONS.map((_, k) => k);
  const qi = order[i];
  const q = QUESTIONS[qi];

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === q.answer;
    if (ok) addXp(20);
    else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    setAnswers((a) => a.map((v, j) => (j === qi ? (v === true ? true : ok) : v)));
  };
  const next = () => {
    setPicked(null);
    if (i + 1 < order.length) setI(i + 1);
    else {
      setDone(true);
      setReview(null);
      const correct = answers.filter(Boolean).length;
      if (correct / QUESTIONS.length >= 0.7) award("explorer");
    }
  };

  if (!started)
    return (
      <div className="lab-card text-center">
        <p className="eyebrow">Final Challenge</p>
        <h2 className="display-sm">Become a Blockchain Explorer.</h2>
        <div className="stat-row">
          <div className="stat"><b>{visited.length}</b>chapters seen</div>
          <div className="stat"><b>{xp}</b>XP earned</div>
          <div className="stat"><b>{badges.length}</b>badges</div>
        </div>
        <button className="btn-primary" onClick={() => setStarted(true)}>Enter the Challenge</button>
      </div>
    );

  if (done) {
    const correct = answers.filter(Boolean).length;
    const pct = Math.round((correct / QUESTIONS.length) * 100);
    const byTopic: Record<string, [number, number]> = {};
    QUESTIONS.forEach((qq, k) => {
      byTopic[qq.topic] ??= [0, 0];
      byTopic[qq.topic][1]++;
      if (answers[k]) byTopic[qq.topic][0]++;
    });
    const topics = Object.entries(byTopic);
    const strongest = topics.sort((a, b) => b[1][0] / b[1][1] - a[1][0] / a[1][1])[0]?.[0];
    const revisit = topics.filter(([, [c, t]]) => c < t).map(([n]) => n);
    const mistakes = QUESTIONS.map((_, k) => k).filter((k) => !answers[k]);
    return (
      <div className="lab-card text-center">
        <Trophy className="mx-auto text-accent-orange" size={40} />
        <h2 className="display-sm">{pct}% accuracy</h2>
        <p className="body-copy">{correct} of {QUESTIONS.length} correct · {xp} XP · Strongest topic: {strongest}</p>
        {revisit.length > 0 && <p className="body-copy">Topics to revisit: {revisit.join(", ")}</p>}
        <div className="badge-row">
          {(Object.keys(BADGES) as (keyof typeof BADGES)[]).map((b) => (
            <span key={b} className={`badge ${badges.includes(b) ? "is-on" : ""}`}>{BADGES[b]}</span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {mistakes.length > 0 && (
            <button className="btn-primary" onClick={() => { setReview(mistakes); setI(0); setDone(false); }}>Review Mistakes</button>
          )}
          <button className="btn-ghost" onClick={() => { reset(); window.scrollTo(0, 0); window.location.reload(); }}>
            <RotateCcw size={16} /> Replay the Experience
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`lab-card ${shake ? "shake" : ""}`}>
      <div className="quiz-top">
        <span className="eyebrow">{review ? "Review" : "Question"} {i + 1} / {order.length} · {q.topic}</span>
        <div className="quiz-bar"><div style={{ width: `${((i + (picked !== null ? 1 : 0)) / order.length) * 100}%` }} /></div>
      </div>
      <h3 className="headline">{q.q}</h3>
      <div className="grid gap-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answer ? "is-right" : k === picked ? "is-wrong" : "is-dim";
          return (
            <button key={k} className={`option ${state}`} onClick={() => choose(k)} disabled={picked !== null}>
              {o}
              {picked !== null && k === q.answer && <Check size={18} />}
              {picked === k && k !== q.answer && <X size={18} />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="explain">
          <p>{picked === q.answer ? "Correct! +20 XP. " : "Not quite. "}{q.why}</p>
          <div className="flex gap-2">
            {picked !== q.answer && <button className="btn-ghost" onClick={() => setPicked(null)}>Retry</button>}
            <button className="btn-primary" onClick={next}>{i + 1 < order.length ? "Next" : "See results"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
