import React, { useRef, useEffect, useState } from "react";

interface MarkBox {
  _id: string;
  nth: number;
  cent_x: number;
  cent_y: number;
  width: number;
  height: number;
}

interface CanvasProps {
  imageSrc: string;
  boxes: MarkBox[];
  onChange: (boxes: MarkBox[]) => void;
  currentNth: number; // 当前选中的 label 序号
}

export const AnnotationCanvas: React.FC<CanvasProps> = ({ imageSrc, boxes, onChange, currentNth }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // 加载图片
  useEffect(() => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      setImg(image);
      setScale(1); // 重置缩放
    };
  }, [imageSrc]);

  // 绘图循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布大小为图片自适应大小
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 1. 绘制底图
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. 绘制已有标注框
    boxes.forEach((box) => {
      const w = box.width * canvas.width;
      const h = box.height * canvas.height;
      const x = (box.cent_x * canvas.width) - w / 2;
      const y = (box.cent_y * canvas.height) - h / 2;

      ctx.strokeStyle = "#1677ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // 绘制标签文本
      ctx.fillStyle = "#1677ff";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Class: ${box.nth}`, x, y > 15 ? y - 5 : y + 15);
    });

    // 3. 绘制当前正在拖拽的框
    if (isDrawing) {
      ctx.strokeStyle = "#ff4d4f";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startPos.x, startPos.y, currentPos.x - startPos.x, currentPos.y - startPos.y);
      ctx.setLineDash([]);
    }
  }, [img, scale, boxes, isDrawing, startPos, currentPos]);

  // 鼠标事件：开始拉框
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!img || e.button !== 0) return; // 仅左键
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCurrentPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // 结束拉框：计算并保存百分比
  const handleMouseUp = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const x1 = Math.min(startPos.x, currentPos.x);
    const x2 = Math.max(startPos.x, currentPos.x);
    const y1 = Math.min(startPos.y, currentPos.y);
    const y2 = Math.max(startPos.y, currentPos.y);

    const w = x2 - x1;
    const h = y2 - y1;

    // 过滤无意义的点击点
    if (w < 5 || h < 5) return;

    // 换算为 YOLO 归一化中心点比例
    const cent_x = (x1 + w / 2) / canvas.width;
    const cent_y = (y1 + h / 2) / canvas.height;
    const width = w / canvas.width;
    const height = h / canvas.height;

    const newBox: MarkBox = {
      _id: crypto.randomUUID(),
      nth: currentNth,
      cent_x,
      cent_y,
      width,
      height,
    };

    onChange([...boxes, newBox]);
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.1, 5));
    } else {
      setScale((prev) => Math.max(prev - 0.1, 0.2));
    }
  };

  return (
    <div style={{ maxWidth: "100%", maxHeight: "100%", "overflow": "hidden", border: "1px solid #ccc", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} onWheel={handleWheel}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: "crosshair", display: "block" }}
      />
    </div>
  );
};