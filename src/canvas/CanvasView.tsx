import { useEffect, useRef } from "react";
import { activePage, useEditor } from "../store";
import { drawCanvas } from "../render/draw";
import { pickNode, uid } from "../model/types";
import type { DesignNode } from "../model/types";

export default function CanvasView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | "draw" | "pan";
    startX: number;
    startY: number;
    nodeId?: string;
    originX?: number;
    originY?: number;
  } | null>(null);

  const selectedId = useEditor((s) => s.selectedId);
  const view = useEditor((s) => s.view);
  const page = useEditor((s) => activePage(s.doc, s.activePageId));

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCanvas(ctx, page, view, selectedId);
  }, [page, view, selectedId]);

  // 适配设备像素比
  useEffect(() => {
    const resize = () => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      canvas.style.width = wrap.clientWidth + "px";
      canvas.style.height = wrap.clientHeight + "px";
      drawCanvas(
        canvas.getContext("2d")!,
        page,
        useEditor.getState().view,
        useEditor.getState().selectedId
      );
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [page]);

  // 屏幕坐标 -> 画布坐标
  function toCanvas(e: React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { view } = useEditor.getState();
    return { x: (sx - view.x) / view.scale, y: (sy - view.y) / view.scale };
  }

  function onPointerDown(e: React.PointerEvent) {
    const { tool } = useEditor.getState();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = toCanvas(e);

    // 空格拖拽平移
    if (e.button === 1 || e.altKey) {
      dragRef.current = { mode: "pan", startX: e.clientX, startY: e.clientY };
      return;
    }

    if (tool === "select") {
      const hit = pickNode(pageRef(), x, y);
      useEditor.getState().select(hit);
      if (hit) {
        const node = findDeep(pageRef(), hit);
        dragRef.current = {
          mode: "move",
          startX: x,
          startY: y,
          nodeId: hit,
          originX: node!.x,
          originY: node!.y,
        };
      }
      return;
    }

    // 绘图工具：在点击处新建节点并进入拖拽定尺寸
    if (tool === "rect" || tool === "ellipse" || tool === "text") {
      const id = uid(tool);
      const base: DesignNode =
        tool === "rect"
          ? { id, type: "rect", name: "矩形", x, y, width: 1, height: 1, fill: "#3B82F6", radius: 0 }
          : tool === "ellipse"
          ? { id, type: "ellipse", name: "椭圆", x, y, width: 1, height: 1, fill: "#10B981" }
          : {
              id,
              type: "text",
              name: "文本",
              x,
              y,
              width: 1,
              height: 30,
              text: "双击输入文字",
              fontSize: 16,
              fontWeight: 400,
              fill: "#111827",
            };
      useEditor.getState().addNode(base);
      if (tool !== "text") {
        dragRef.current = { mode: "draw", startX: x, startY: y, nodeId: id, originX: x, originY: y };
      } else {
        useEditor.getState().setTool("select");
      }
      return;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const { x, y } = toCanvas(e);
    const st = useEditor.getState();
    if (drag.mode === "pan") {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      st.setView({ x: st.view.x + dx, y: st.view.y + dy });
      return;
    }
    if (drag.mode === "move" && drag.nodeId) {
      st.moveNode(drag.nodeId, x - drag.startX, y - drag.startY);
      return;
    }
    if (drag.mode === "draw" && drag.nodeId) {
      const w = Math.abs(x - drag.originX!);
      const h = Math.abs(y - drag.originY!);
      st.updateNode(drag.nodeId, {
        x: Math.min(x, drag.originX!),
        y: Math.min(y, drag.originY!),
        width: Math.max(w, 1),
        height: Math.max(h, 1),
      });
      return;
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    const st = useEditor.getState();
    if (e.ctrlKey || e.metaKey) {
      // 缩放
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(8, Math.max(0.1, st.view.scale * factor));
      st.setView({ scale: newScale });
    } else {
      st.setView({ x: st.view.x - e.deltaX, y: st.view.y - e.deltaY });
    }
  }

  function pageRef() {
    return useEditor.getState().doc.pages.find(
      (p) => p.id === useEditor.getState().activePageId
    )!;
  }

  return (
    <div
      ref={wrapRef}
      className="canvas-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} />
      <button
        className="zoom-control"
        onClick={() => useEditor.getState().setView({ scale: 1 })}
        title="重置缩放"
      >
        {Math.round(view.scale * 100)}%
      </button>
    </div>
  );
}

function findDeep(page: any, id: string): DesignNode | undefined {
  const walk = (list: DesignNode[]): DesignNode | undefined => {
    for (const n of list) {
      if (n.id === id) return n;
      if (n.children) {
        const f = walk(n.children);
        if (f) return f;
      }
    }
    return undefined;
  };
  return walk(page.children);
}