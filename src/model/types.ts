// 数据模型 —— 采用类 Figma/MasterGo 的节点树结构
// 统一节点规约，预留 .fig/.sketch/.mg 导入后映射到本结构

export type NodeType = "frame" | "rect" | "ellipse" | "text" | "group";

export interface DesignNode {
  id: string;
  type: NodeType;
  name: string;
  // 位置与尺寸（画布坐标系，单位 px）
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  hidden?: boolean;
  locked?: boolean;
  // 视觉样式
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number; // 圆角（rect/frame）
  // 文本相关
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  // 子节点（frame/group 可含子节点）
  children?: DesignNode[];
}

// 页面（画布），是节点树的根，类似 Figma 的 Page
export interface PageNode {
  id: string;
  name: string;
  children: DesignNode[];
}

// 文档（一份设计文件）
export interface Document {
  id: string;
  name: string;
  pages: PageNode[];
}

export type Tool = "select" | "rect" | "ellipse" | "text";

export function uid(prefix = "node"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

// 在文档节点树中定位并更新某节点（返回新文档），未命中返回原文档
export function updateNodeInTree(
  pages: PageNode[],
  targetId: string,
  patch: Partial<DesignNode>
): PageNode[] {
  return pages.map((p) => {
    const upd = patchChildren(p.children, targetId, patch);
    if (upd === p.children) return p;
    return { ...p, children: upd ?? p.children };
  });
}

function patchChildren(
  children: DesignNode[] | undefined,
  targetId: string,
  patch: Partial<DesignNode>
): DesignNode[] | undefined {
  if (!children) return children;
  let changed = false;
  const next = children.map((n) => {
    if (n.id === targetId) {
      changed = true;
      return { ...n, ...patch };
    }
    if (n.children) {
      const c = patchChildren(n.children, targetId, patch);
      if (c !== n.children) return { ...n, ...{ children: c } };
    }
    return n;
  });
  return changed ? next : children;
}

// 在节点树中查找节点
export function findNode(
  pages: PageNode[],
  targetId: string
): DesignNode | null {
  for (const p of pages) {
    const found = findInChildren(p.children, targetId);
    if (found) return found;
  }
  return null;
}

function findInChildren(
  children: DesignNode[] | undefined,
  targetId: string
): DesignNode | null {
  if (!children) return null;
  for (const n of children) {
    if (n.id === targetId) return n;
    if (n.children) {
      const f = findInChildren(n.children, targetId);
      if (f) return f;
    }
  }
  return null;
}

// 命中检测：给定坐标（画布坐标系），返回命中的最顶层子节点 id
export function pickNode(
  page: PageNode,
  x: number,
  y: number
): string | null {
  for (let i = page.children.length - 1; i >= 0; i--) {
    const n = page.children[i];
    if (n.hidden) continue;
    // 命中检测先在几何包围盒内
    if (x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height) {
      return n.id;
    }
  }
  return null;
}

// 创建默认文档（含一个示例画板）
export function createDefaultDocument(): Document {
  const page: PageNode = {
    id: uid("page"),
    name: "页面 1",
    children: [
      {
        id: uid("frame"),
        type: "frame",
        name: "画板",
        x: 200,
        y: 100,
        width: 600,
        height: 420,
        fill: "#ffffff",
        stroke: "#7d7d7d",
        strokeWidth: 1,
        radius: 8,
        children: [
          {
            id: uid("rect"),
            type: "rect",
            name: "按钮",
            x: 60,
            y: 60,
            width: 160,
            height: 56,
            fill: "#3B82F6",
            radius: 28,
            text: "开始",
            fontFamily: "Segoe UI",
            fontSize: 20,
            fontWeight: 600,
          },
          {
            id: uid("rect"),
            type: "rect",
            name: "卡片",
            x: 60,
            y: 160,
            width: 480,
            height: 200,
            fill: "#F3F4F6",
            radius: 12,
          },
          {
            id: uid("ellipse"),
            type: "ellipse",
            name: "圆点",
            x: 90,
            y: 200,
            width: 48,
            height: 48,
            fill: "#10B981",
          },
          {
            id: uid("text"),
            type: "text",
            name: "标题",
            x: 150,
            y: 210,
            width: 300,
            height: 40,
            text: "这是一个设计样本",
            fontFamily: "Segoe UI",
            fontSize: 28,
            fontWeight: 700,
            fill: "#111827",
          },
        ],
      },
    ],
  };
  return { id: uid("doc"), name: "未命名设计", pages: [page] };
}