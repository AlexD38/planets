import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "../styles.css";

function formatSt(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `ST ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const CaptainLog = () => {
  const { logEntries, showCaptainLog } = useContext(PlanetContext);

  if (!showCaptainLog || logEntries.length === 0) return null;

  return (
    <div className="captain-log hud-panel" aria-label="Journal de bord">
      <div className="hud-panel-header">
        <i className="fa-solid fa-book" />
        Journal de bord
      </div>
      <ul className="captain-log-list">
        {logEntries.slice(0, 4).map((entry) => (
          <li key={entry.id} className="captain-log-entry">
            <span className="captain-log-time">{formatSt(entry.ts)}</span>
            <span className="captain-log-text">{entry.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
