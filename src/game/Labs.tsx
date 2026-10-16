import { useEffect, useMemo, useState } from "react";
import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useGame } from "./store";

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SAMPLE = "Alice pays Bob 0.5 BTC";

export function HashLab() {
  const award = useGame((s) => s.award);
  const [input, setInput] = useState(SAMPLE);
  const [base, setBase] = useState("");
  const [hash, setHash] = useState("");
  useEffect(() => {
    sha256(SAMPLE).then(setBase);
  }, []);
  useEffect(() => {
    let live = true;
    sha256(input).then((h) => live && setHash(h));
    if (input !== SAMPLE) award("hash");
    return () => {
      live = false;
    };
  }, [input, award]);
  const diff = base && hash ? [...hash].filter((c, i) => c !== base[i]).length : 0;

  return (
    <div className="lab-card">
      <p className="eyebrow">Chapter 07 · Hash Lab</p>
      <h2 className="headline">The digital fingerprint.</h2>
      <p className="body-copy">
        SHA-256 turns any input into a fixed 64-character fingerprint. Change one character and the output changes
        unpredictably. Try it — this is the real SHA-256 used by Bitcoin.
      </p>
      <label className="field-label" htmlFor="hash-in">Input</label>
      <div className="flex gap-2">
        <input id="hash-in" className="field" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-ghost" onClick={() => setInput(SAMPLE)} aria-label="Reset"><RotateCcw size={16} /></button>
      </div>
      <p className="field-label">Original hash</p>
      <code className="hash">{base}</code>
      <p className="field-label">Your hash · {diff} of 64 characters changed</p>
      <code className="hash">
        {[...hash].map((c, i) => (
          <span key={i} className={c !== base[i] ? "hash-diff" : ""}>{c}</span>
        ))}
      </code>
    </div>
  );
}

const TXS = ["Genesis reward", "Alice → Bob 0.5", "Bob → Carol 0.2", "Carol → Dan 0.1"];

export function TamperLab() {
  const award = useGame((s) => s.award);
  const [data, setData] = useState(TXS);
  const [hashes, setHashes] = useState<string[]>([]);
  const [orig, setOrig] = useState<string[]>([]);

  const compute = useMemo(
    () => async (d: string[]) => {
      const out: string[] = [];
      let prev = "0".repeat(64);
      for (let i = 0; i < d.length; i++) {
        const h = await sha256(`${i}|${prev}|${d[i]}`);
        out.push(h);
        prev = h;
      }
      return out;
    },
    [],
  );
  useEffect(() => {
    compute(TXS).then(setOrig);
  }, [compute]);
  useEffect(() => {
    compute(data).then(setHashes);
  }, [data, compute]);

  const tampered = data[1] !== TXS[1];
  // a block is valid if its stored prev-hash (from the original chain) matches the actual previous hash
  const valid = (i: number) => i === 0 || hashes[i - 1] === orig[i - 1];

  return (
    <div className="lab-card">
      <p className="eyebrow">Chapter 08 · Tampering Lab</p>
      <h2 className="headline">Change one block. Break them all.</h2>
      <p className="body-copy">Edit Block 2's transaction. Its hash changes, so Block 3's stored "previous hash" no longer matches — and the break ripples forward. Honest nodes would reject this chain.</p>
      <div className="chain-row">
        {data.map((d, i) => {
          const ok = valid(i) && (i < 1 || !tampered || i < 1);
          const broken = tampered && i >= 2;
          return (
            <div key={i} className={`mini-block ${broken ? "is-broken" : ""} ${tampered && i === 1 ? "is-edited" : ""}`}>
              <div className="mini-head">
                Block {i + 1} {broken ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              </div>
              {i === 1 ? (
                <input className="field field-sm" value={d} onChange={(e) => setData(data.map((x, j) => (j === 1 ? e.target.value : x)))} />
              ) : (
                <div className="mini-data">{d}</div>
              )}
              <div className="mini-hash">prev {i === 0 ? "0000…" : (orig[i - 1] ?? "").slice(0, 8)}</div>
              <div className="mini-hash">hash {(hashes[i] ?? "").slice(0, 8)}</div>
              <span className="sr-only">{ok ? "valid" : "invalid"}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={() => { setData(data.map((x, j) => (j === 1 ? "Alice → Mallory 50" : x))); award("guardian"); }}>
          Tamper with Block 2
        </button>
        <button className="btn-ghost" onClick={() => setData(TXS)}>Restore</button>
      </div>
    </div>
  );
}
