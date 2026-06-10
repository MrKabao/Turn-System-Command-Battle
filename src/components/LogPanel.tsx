import React, { useRef, useEffect } from "react";
import { Swords, Zap, Shield, Sparkles, Flame, Sliders, Play, Award, Ban } from "lucide-react";
import { LogEntry } from "../types";

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of the battle log when new lines arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Find the last relevant battle line to display in the primary narration block
  const latestNormalLog = [...logs]
    .reverse()
    .find((l) => l.type !== "system");

  const latestLogText = latestNormalLog 
    ? latestNormalLog.text 
    : "戦闘命令待機中 // Awaiting combat directives...";

  const getLogIconAndStyle = (type: LogEntry["type"]) => {
    switch (type) {
      case "player-attack":
        return {
          icon: <Swords className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/40",
          textColor: "text-zinc-100",
          borderColor: "border-zinc-800",
        };
      case "player-magic":
        return {
          icon: <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/40",
          textColor: "text-zinc-100",
          borderColor: "border-zinc-800",
        };
      case "player-defend":
        return {
          icon: <Shield className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/40",
          textColor: "text-zinc-100",
          borderColor: "border-zinc-800",
        };
      case "player-heal":
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/40",
          textColor: "text-zinc-100",
          borderColor: "border-zinc-800",
        };
      case "enemy-action":
        return {
          icon: <Flame className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/30",
          textColor: "text-zinc-300",
          borderColor: "border-zinc-800/85",
        };
      case "victory":
        return {
          icon: <Award className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />,
          bgColor: "bg-yellow-950/20 border border-yellow-500/20",
          textColor: "text-yellow-400 font-bold",
          borderColor: "border-yellow-900/40",
        };
      case "defeat":
        return {
          icon: <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
          bgColor: "bg-red-950/20",
          textColor: "text-red-400 font-semibold",
          borderColor: "border-red-900/40",
        };
      default:
        return {
          icon: <Sliders className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />,
          bgColor: "bg-zinc-900/20",
          textColor: "text-zinc-400",
          borderColor: "border-zinc-800/60",
        };
    }
  };

  return (
    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-none overflow-hidden h-[180px]" id="log-panel-container">
      {/* Top Header: Battle Information */}
      <div className="h-8 border-b border-zinc-800 flex items-center justify-between px-3.5 bg-zinc-950/50" id="log-header">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-red-600 rounded-none"></div>
          <span className="text-[9px] tracking-[0.25em] font-bold uppercase text-zinc-500">Battle Log Sequence // Live Feed</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-600">
          STABLE_LINK_ONLINE
        </span>
      </div>

      {/* Dynamic Geometric Message Log / Active Narration (Direct from Style Guide) */}
      <div className="bg-zinc-900/40 border-b border-zinc-800 p-2.5 shrink-0 flex items-center gap-3 min-h-[46px]" id="current-narration-banner">
        <span className="text-zinc-650 text-[10px] font-mono uppercase tracking-widest font-bold shrink-0">LOG:</span>
        <p className="text-xs font-light tracking-tight text-zinc-200 italic line-clamp-1">
          {latestLogText}
        </p>
      </div>

      {/* Scrolling History log feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 font-sans text-xs scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth bg-zinc-950"
        id="log-scroller"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600" id="empty-log-state">
            <Play className="w-4 h-4 text-zinc-700 animate-pulse mb-1" />
            <span className="font-mono text-[9px] tracking-widest uppercase">Awaiting Action Commands...</span>
          </div>
        ) : (
          logs.map((log) => {
            const config = getLogIconAndStyle(log.type);
            return (
              <div
                key={log.id}
                className={`py-2 px-3 rounded-none border flex items-start gap-2.5 transition-all duration-300 ${config.bgColor} ${config.borderColor} ${config.textColor}`}
                id={`log-item-${log.id}`}
              >
                {config.icon}
                <div className="flex-1 leading-relaxed">
                  {log.text}
                </div>
                <span className="text-[9px] font-mono text-zinc-600 self-center">
                  {log.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
