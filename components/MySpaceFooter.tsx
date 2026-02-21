import Link from "next/link";

export default function MySpaceFooter() {
  return (
    <footer className="ms-footer">
      <div>
        <Link href="/about">About</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <a href="https://thryx.mom" target="_blank" rel="noopener">THRYX</a>
        <a href="https://basescan.org/token/0xc07E889e1816De2708BF718683e52150C20F3BA3" target="_blank" rel="noopener">$THRYX</a>
      </div>
      <div style={{ marginTop: 6 }}>
        &copy; 2026 MySocial — Powered by{" "}
        <a href="https://thryx.mom" target="_blank" rel="noopener" style={{ color: "#003375", fontWeight: 600 }}>
          THRYX
        </a>{" "}
        on Base
      </div>
    </footer>
  );
}
