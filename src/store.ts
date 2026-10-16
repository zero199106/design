import { create } from "zustand";
import type {
  DesignNode,
  Document,
  PageNode,
  Tool,
} from "./model/types";
import {
  createDefaultDocument,
  updateNodeInTree,
} from "./model/types";

// 画布视口（平移量 + 缩放）
export interface Viewport {
  x: number; // 画布坐标系原点在屏幕上的位置（px）
  y: number;
  scale: number;
}

interface EditorState {
  doc: Document;
  activePageId: string;
  selectedId: string | null;
  tool: Tool;
  view: Viewport;

  setTool: (t: Tool) => void;
  select: (id: string | null) => void;
  setView: (v: Partial<Viewport>) => void;
  renameDoc: (name: string) => void;

  // 在当前活动页面（顶层）添加节点
  addNode: (node: DesignNode) => void;
  // 更新任意深度的节点
  updateNode: (id: string, patch: Partial<DesignNode>) => void;
  // 移动节点
  moveNode: (id: string, dx: number, dy: number) => void;
  // 删除选中节点
  deleteSelected: () => void;
}

export function activePage(doc: Document, pageId: string): PageNode {
  return doc.pages.find((p) => p.id === pageId) ?? doc.pages[0];
}

export const useEditor = create<EditorState>((set) => {
  const initDoc = createDefaultDocument();
  return {
    doc: initDoc,
    activePageId: initDoc.pages[0].id,
    selectedId: null,
    tool: "select",
    view: { x: 120, y: 80, scale: 1 },

  setTool: (t) => set({ tool: t }),
  select: (id) => set({ selectedId: id }),
  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  renameDoc: (name) => set((s) => ({ doc: { ...s.doc, name } })),

  addNode: (node) =>
    set((s) => {
      const page = activePage(s.doc, s.activePageId);
      const pages = s.doc.pages.map((p) =>
        p.id === page.id ? { ...p, children: [...p.children, node] } : p
      );
      return { doc: { ...s.doc, pages }, selectedId: node.id };
    }),

  updateNode: (id, patch) =>
    set((s) => ({
      doc: {
        ...s.doc,
        pages: updateNodeInTree(s.doc.pages, id, patch),
      },
    })),

  moveNode: (id, dx, dy) =>
    set((s) => {
      const node = findInPages(s.doc.pages, id);
      if (!node) return { doc: s.doc };
      return {
        doc: {
          ...s.doc,
          pages: updateNodeInTree(s.doc.pages, id, {
            x: node.x + dx,
            y: node.y + dy,
          }),
        },
      };
    }),

  deleteSelected: () =>
    set((s) => {
      if (!s.selectedId) return {};
      const pages = removeFromPages(s.doc.pages, s.selectedId);
      return { doc: { ...s.doc, pages }, selectedId: null };
    }),
}
});

function findInPages(
  pages: PageNode[],
  id: string
): DesignNode | null {
  for (const p of pages) {
    const n = findDeep(p.children, id);
    if (n) return n;
  }
  return null;
}
function findDeep(
  children: DesignNode[] | undefined,
  id: string
): DesignNode | null {
  if (!children) return null;
  for (const c of children) {
    if (c.id === id) return c;
    const d = findDeep(c.children, id);
    if (d) return d;
  }
  return null;
}
function removeFromPages(
  pages: PageNode[],
  id: string
): PageNode[] {
  return pages.map((p) => ({ ...p, children: removeDeep(p.children, id) }));
}
function removeDeep(
  children: DesignNode[] | undefined,
  id: string
): DesignNode[] {
  if (!children) return [];
  return children
    .filter((c) => c.id !== id)
    .map((c) =>
      c.children ? { ...c, children: removeDeep(c.children, id) } : c
    );
}