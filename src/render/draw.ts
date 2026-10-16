import type { DesignNode, PageNode } from "../model/types";
import type { Viewport } from "../store";

// 纯 Canvas 2D 渲染：把页面节点树画到画布上
export function drawCanvas(
  ctx: CanvasRenderingContext2D,
  page: PageNode,
  view: Viewport,
  selectedId: string | null
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 背景（画布灰底）
  ctx.fillStyle = "#1e1f22";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 应用视口变换（缩放 + 平移）
  ctx.save();
  ctx.transform(view.scale, 0, 0, view.scale, view.x, view.y);

  // 绘制网格（粗略，scale > 0.5 时显示）
  if (view.scale > 0.3) {
    drawGrid(ctx, view);
  }

  // 绘制所有顶层节点
  for (const n of page.children) {
    if (n.hidden) continue;
    drawNode(ctx, n, selectedId);
  }

  // 选中高亮框
  drawSelection(ctx, page, selectedId, view);

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, view: Viewport) {
  const step = 50;
  const left = -view.x / view.scale;
  const top = -view.y / view.scale;
  const right = left + ctx.canvas.width / view.scale;
  const bottom = top + ctx.canvas.height / view.scale;
  const startCol = Math.floor(left / step) * step;
  const endCol = Math.ceil(right / step) * step;
  const startRow = Math.floor(top / step) * step;
  const endRow = Math.ceil(bottom / step) * step;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startCol; x <= endCol; x += step) {
    ctx.moveTo(x, Math.floor(top) - 1);
    ctx.lineTo(x, Math.ceil(bottom) + 1);
  }
  for (let y = startRow; y <= endRow; y += step) {
    ctx.moveTo(Math.floor(left) - 1, y);
    ctx.lineTo(Math.ceil(right) + 1, y);
  }
  ctx.stroke();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  selectedId: string | null
) {
  ctx.save();
  // 旋转
  if (node.rotation) {
    ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
    ctx.rotate((node.rotation * Math.PI) / 180);
    ctx.translate(-(node.x + node.width / 2), -(node.y + node.height / 2));
  }
  if (typeof node.opacity === "number") ctx.globalAlpha = node.opacity;

  // 统一按节点局部坐标绘制（node.x/y 是锚点）
  const lx = 0;
  const ly = 0;

  switch (node.type) {
    case "rect":
      drawRect(ctx, node, lx, ly);
      drawTextIfAny(ctx, node);
      break;
    case "frame":
      drawFrame(ctx, node, lx, ly, selectedId);
      break;
    case "ellipse":
      drawEllipse(ctx, node, lx, ly);
      break;
    case "text":
      drawTextNode(ctx, node, lx, ly);
      break;
    case "group":
      // 组：绘制子节点
      drawGroupRecursive(ctx, node, selectedId);
      break;
  }
  ctx.restore();
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  lx: number,
  ly: number
) {
  const r = node.radius ?? 0;
  ctx.beginPath();
  ctx.roundRect(lx, ly, node.width, node.height, r);
  if (node.fill) {
    ctx.fillStyle = node.fill;
    ctx.fill();
  }
  if (node.stroke && node.strokeWidth) {
    ctx.strokeStyle = node.stroke;
    ctx.lineWidth = node.strokeWidth;
    ctx.stroke();
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  lx: number,
  ly: number,
  selectedId: string | null
) {
  const r = node.radius ?? 0;
  ctx.beginPath();
  ctx.roundRect(lx, ly, node.width, node.height, r);
  if (node.fill && node.fill !== "none") {
    ctx.fillStyle = node.fill;
    ctx.fill();
  }
  if (node.stroke && node.strokeWidth) {
    ctx.strokeStyle = node.stroke;
    ctx.lineWidth = node.strokeWidth;
    ctx.stroke();
  }
  // 绘制子节点
  if (node.children) {
    for (const c of node.children) drawNode(ctx, c, selectedId);
  }
}

function drawGroupRecursive(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  selectedId: string | null
) {
  if (node.children) {
    for (const c of node.children) {
      drawNode(ctx, c, selectedId);
    }
  }
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  lx: number,
  ly: number
) {
  ctx.beginPath();
  ctx.ellipse(
    lx + node.width / 2,
    ly + node.height / 2,
    node.width / 2,
    node.height / 2,
    0,
    0,
    Math.PI * 2
  );
  if (node.fill) {
    ctx.fillStyle = node.fill;
    ctx.fill();
  }
  if (node.stroke && node.strokeWidth) {
    ctx.strokeStyle = node.stroke;
    ctx.lineWidth = node.strokeWidth;
    ctx.stroke();
  }
}

function drawTextNode(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  lx: number,
  ly: number
) {
  ctx.font = `${node.fontWeight ?? 400} ${node.fontSize ?? 16}px ${
    node.fontFamily ?? "sans-serif"
  }`;
  ctx.fillStyle = node.fill ?? "#111827";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(node.text ?? "", lx, ly + node.height * 0.72);
}

function drawTextIfAny(ctx: CanvasRenderingContext2D, node: DesignNode) {
  if (node.type === "rect" && node.text) {
    ctx.save();
    ctx.font = `${node.fontWeight ?? 600} ${node.fontSize ?? 20}px ${
      node.fontFamily ?? "sans-serif"
    }`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      node.text,
      node.x + node.width / 2 + 0, // rect 以 node.x 为锚点
      node.y + node.height / 2
    );
    ctx.restore();
  }
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  page: PageNode,
  selectedId: string | null,
  view: Viewport
) {
  if (!selectedId) return;
  // 在顶层查找选中节点
  let node: DesignNode | null = null;
  const all = collectTopLevel(page.children);
  node = all.find((n) => n.id === selectedId) ?? null;
  if (!node) return;
  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 2 / view.scale;
  ctx.setLineDash([6 / view.scale, 4 / view.scale]);
  ctx.strokeRect(
    node.x - 2 / view.scale,
    node.y - 2 / view.scale,
    node.width + 4 / view.scale,
    node.height + 4 / view.scale
  );
  ctx.setLineDash([]);
}

function collectTopLevel(nodes: DesignNode[]): DesignNode[] {
  const out: DesignNode[] = [];
  const walk = (list: DesignNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}