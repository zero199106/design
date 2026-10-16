import { useEditor } from "../store";
import type { Tool } from "../model/types";

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: "select", label: "选择", icon: "🖱" },
  { id: "rect", label: "矩形", icon: "▭" },
  { id: "ellipse", label: "椭圆", icon: "◯" },
  { id: "text", label: "文本", icon: "T" },
];

export default function Topbar() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const name = useEditor((s) => s.doc.name);
  const renameDoc = useEditor((s) => s.renameDoc);

  return (
    <header className="topbar">
      <div className="logo">
        <span className="logo-mark">✦</span>
        <span className="logo-text">设计工具</span>
      </div>

      <input
        className="doc-name"
        value={name}
        onChange={(e) => renameDoc(e.target.value)}
        spellCheck={false}
      />

      <div className="toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tool-btn ${tool === t.id ? "active" : ""}`}
            onClick={() => setTool(t.id)}
            title={t.label}
          >
            <span className="tool-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="topbar-right">
        <button className="ghost-btn" title="保存">
          💾
        </button>
        <button className="ghost-btn" title="导出">
          导出
        </button>
      </div>
    </header>
  );
}