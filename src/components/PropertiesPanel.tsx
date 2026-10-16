import { useEditor } from "../store";
import { findNode } from "../model/types";
import type { DesignNode } from "../model/types";

export default function PropertiesPanel() {
  const doc = useEditor((s) => s.doc);
  const selectedId = useEditor((s) => s.selectedId);
  const updateNode = useEditor((s) => s.updateNode);

  if (!selectedId) {
    return (
      <aside className="prop-panel">
        <div className="prop-empty">未选择图层</div>
      </aside>
    );
  }
  const node = findNode(doc.pages, selectedId);
  if (!node) {
    return (
      <aside className="prop-panel">
        <div className="prop-empty">未选择图层</div>
      </aside>
    );
  }

  const set = (patch: Partial<DesignNode>) => updateNode(selectedId, patch);
  const num = (v: number | undefined, def = 0) =>
    v === undefined ? def : Math.round(v);

  return (
    <aside className="prop-panel">
      <div className="panel-title">{typeName(node)} · 属性</div>
      <input
        className="text-input name-input"
        value={node.name}
        onChange={(e) => set({ name: e.target.value })}
      />

      <Section title="位置与尺寸" cols>
        <Field label="X">
          <input type="number" value={num(node.x)} onChange={(e) => set({ x: +e.target.value })} />
        </Field>
        <Field label="Y">
          <input type="number" value={num(node.y)} onChange={(e) => set({ y: +e.target.value })} />
        </Field>
        <Field label="W">
          <input type="number" value={num(node.width)} onChange={(e) => set({ width: Math.max(0, +e.target.value) })} />
        </Field>
        <Field label="H">
          <input type="number" value={num(node.height)} onChange={(e) => set({ height: Math.max(0, +e.target.value) })} />
        </Field>
      </Section>

      <Section title="旋转">
        <Field label="deg">
          <input type="number" value={num(node.rotation, 0)} onChange={(e) => set({ rotation: +e.target.value })} />
        </Field>
      </Section>

      {(node.type === "rect" || node.type === "frame") && (
        <Section title="圆角">
          <Field label="radius">
            <input type="number" value={num(node.radius, 0)} onChange={(e) => set({ radius: Math.max(0, +e.target.value) })} />
          </Field>
        </Section>
      )}

      {node.type !== "group" && (
        <Section title="填充">
          <Field label="color">
            <input
              type="color"
              className="color-input"
              value={validColor(node.fill)}
              onChange={(e) => set({ fill: e.target.value })}
            />
          </Field>
          <Field label="value">
            <input className="hex-input" value={node.fill ?? "#ffffff"} onChange={(e) => set({ fill: e.target.value })} />
          </Field>
        </Section>
      )}

      {node.type === "text" && (
        <Section title="文本">
          <Field label="内容" wide>
            <textarea
              value={node.text ?? ""}
              rows={2}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Field>
          <Field label="字号">
            <input type="number" value={node.fontSize ?? 16} onChange={(e) => set({ fontSize: +e.target.value })} />
          </Field>
        </Section>
      )}

      <Section title="不透明度">
        <Field label="%">
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round((node.opacity ?? 1) * 100)}
            onChange={(e) => set({ opacity: Math.min(100, Math.max(0, +e.target.value)) / 100 })}
          />
        </Field>
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
  cols,
}: {
  title: string;
  children: React.ReactNode;
  cols?: boolean;
}) {
  return (
    <div className="prop-section">
      <div className="prop-section-title">{title}</div>
      <div className={cols ? "field-grid" : "field-stack"}>{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function validColor(c: string | undefined): string {
  if (!c) return "#ffffff";
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#ffffff";
}

function typeName(n: DesignNode): string {
  switch (n.type) {
    case "frame": return "画板";
    case "rect": return "矩形";
    case "ellipse": return "椭圆";
    case "text": return "文本";
    case "group": return "编组";
  }
}