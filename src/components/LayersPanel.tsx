import { activePage, useEditor } from "../store";
import type { DesignNode } from "../model/types";

export default function LayersPanel() {
  const page = useEditor((s) => activePage(s.doc, s.activePageId));
  const selectedId = useEditor((s) => s.selectedId);
  const select = useEditor((s) => s.select);

  return (
    <aside className="layer-panel">
      <div className="panel-title">图层</div>
      <div className="layer-list">
        {page.children.map((n) => (
          <LayerRow
            key={n.id}
            node={n}
            depth={0}
            selectedId={selectedId}
            onSelect={select}
          />
        ))}
      </div>
    </aside>
  );
}

function LayerRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: DesignNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const icon = () =>
    node.type === "frame" || node.type === "rect"
      ? "▭"
      : node.type === "ellipse"
      ? "◯"
      : node.type === "text"
      ? "T"
      : "⊞";

  return (
    <div>
      <div
        className={`layer-row ${selectedId === node.id ? "selected" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        title={node.name}
      >
        <span className="layer-icon">{icon()}</span>
        <span className="layer-name">{node.name}</span>
        {node.hidden && <span className="layer-eye">👁</span>}
      </div>
      {node.children?.map((c) => (
        <LayerRow
          key={c.id}
          node={c}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}