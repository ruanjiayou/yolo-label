import { useRef, useState, useEffect, useCallback } from 'react'
import store from '../store'
import { useSnapshot } from 'valtio'

// YOLO 格式标注框
interface MarkBox {
  id: string
  nth: number
  cx: number      // 中心点 x (0-1 归一化)
  cy: number      // 中心点 y (0-1 归一化)
  width: number   // 宽度 (0-1 归一化)
  height: number  // 高度 (0-1 归一化)
}

interface AnnotationCanvasProps {
  imageSrc: string
  label_id: string
  marks: readonly MarkBox[]
  onBoxSelect: (nth: number) => void
  onUpdateMarks: (marks: MarkBox[]) => void
  onChangeImage: (direct: 1 | -1) => void
}

export function AnnotationCanvas({
  imageSrc,
  label_id,
  marks = [],
  onBoxSelect,
  onUpdateMarks,
  onChangeImage,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const state = useSnapshot(store)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  // 状态管理
  const [selectedBox, setSelectedBox] = useState<MarkBox | null>(null)
  const [localBoxes, setLocalBoxes] = useState<MarkBox[]>([])
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  const [viewState, setViewState] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    imageWidth: 0,
    imageHeight: 0
  })

  // 鼠标按下: 左键:选中框/选中控制点/ 右键:开始画框
  // 鼠标移动: 移动框/移动控制点/移动画框
  // 鼠标释放: 取消选中/画框结束
  // 交互状态
  const interactionState = useRef({
    isDragging: false,
    // 鼠标开始位置,和移动时当前位置
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,


    selectedMarkIdx: -1,

    isSelecting: false,

    isBoxSelecting: false,
    // 调整框位置
    selectionBox: null as { x: number; y: number; width: number; height: number } | null,
    dragOffsetX: 0,
    dragOffsetY: 0,

    // 调整框大小
    selectedControlPoint: null as string | null,
    boxStartX: 0,
    boxStartY: 0,
    boxStartWidth: 0,
    boxStartHeight: 0,

    // 平移画布
    isPanning: false,
    // 记录开始时相对距离
    panStartX: 0,
    panStartY: 0
  })
  const changeMarkIdx = useCallback((idx: number) => {
    interactionState.current.selectedMarkIdx = idx;
    onBoxSelect(idx)
  }, [])
  // 加载图片
  useEffect(() => {
    if (containerRef.current) {
      setCanvasSize({ width: containerRef.current.offsetWidth - 10, height: containerRef.current.offsetHeight });
    }
    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      setImage(img)
      // 计算初始缩放，让图片适应画布
      const canvas = canvasRef.current
      if (canvas && containerRef.current) {

        const scaleX = canvas.width / img.width
        const scaleY = canvas.height / img.height
        const initialZoom = Math.min(scaleX, scaleY) * 0.95 // 留边距

        setViewState(prev => ({
          ...prev,
          zoom: initialZoom,
          imageWidth: img.width,
          imageHeight: img.height,
          panX: (canvas.width - img.width * initialZoom) / 2,
          panY: (canvas.height - img.height * initialZoom) / 2
        }))
      }
    }
    img.onerror = () => {
      console.error('Failed to load image')
    }
  }, [imageSrc])

  // 同步外部数据
  useEffect(() => {
    setLocalBoxes([...marks])
  }, [marks])

  // 将 YOLO 归一化坐标转换为 Canvas 坐标
  const yoloToCanvas = useCallback((cx: number, cy: number, w: number, h: number) => {
    const { zoom, panX, panY, imageWidth, imageHeight } = viewState
    const scaledWidth = imageWidth * zoom
    const scaledHeight = imageHeight * zoom

    const x = panX + cx * scaledWidth - (w * scaledWidth) / 2
    const y = panY + cy * scaledHeight - (h * scaledHeight) / 2
    const width = w * scaledWidth
    const height = h * scaledHeight;

    return { x, y, width, height };
  }, [viewState]);

  // 将 Canvas 坐标转换为 YOLO 归一化坐标
  const canvasToYolo = useCallback((x: number, y: number, w: number, h: number, nth: number): MarkBox => {
    const { zoom, panX, panY, imageWidth, imageHeight } = viewState
    const scaledWidth = imageWidth * zoom
    const scaledHeight = imageHeight * zoom

    const cx = (x + w / 2 - panX) / scaledWidth
    const cy = (y + h / 2 - panY) / scaledHeight
    const width = w / scaledWidth
    const height = h / scaledHeight

    return {
      id: label_id,
      nth,
      cx: parseFloat(Math.max(0, Math.min(1, cx)).toFixed(6)),
      cy: parseFloat(Math.max(0, Math.min(1, cy)).toFixed(6)),
      width: parseFloat(Math.max(0, Math.min(1, width)).toFixed(6)),
      height: parseFloat(Math.max(0, Math.min(1, height)).toFixed(6))
    }
  }, [viewState, label_id])

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制图片
    if (image) {
      const { zoom, panX, panY, imageWidth, imageHeight } = viewState
      const scaledWidth = imageWidth * zoom
      const scaledHeight = imageHeight * zoom
      ctx.drawImage(image, panX, panY, scaledWidth, scaledHeight)
    }

    // 绘制所有标注框
    localBoxes.forEach(box => {
      const isSelected = interactionState.current.selectedMarkIdx === box.nth
      const { x, y, width, height } = yoloToCanvas(box.cx, box.cy, box.width, box.height)

      // 框体 - 线条变细
      ctx.strokeStyle = isSelected ? '#FF6B6B' : '#4ECDC4'
      ctx.lineWidth = isSelected ? 1.5 : 1 // ✅ 变细：选中1.5px，未选中1px
      ctx.strokeRect(x, y, width, height)

      const info = `cx:${box.cx.toFixed(6)} cy:${box.cy.toFixed(6)}`
      // 测量宽度
      const textMetrics = ctx.measureText(info);
      const text_width = textMetrics.width;
      // 填充半透明背景（选中时）
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 107, 107, 0.1)' // ✅ 透明度降低
        ctx.fillRect(x, y, width, height)
      }

      // 选中时显示控制点 - 变小
      if (isSelected) {
        // 标签 - 字体变小
        ctx.fillStyle = isSelected ? '#FF6B6B' : '#4ECDC4'
        ctx.font = '11px Arial' // ✅ 字体变小
        const label = `label ${localBoxes.indexOf(box)}`
        ctx.fillText(label, x, y - 4)

        // 显示 YOLO 坐标信息
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(x, y + height + 2, text_width + 10, 16)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px Arial' // ✅ 字体变小
        ctx.fillText(info, x + 4, y + height + 13)

        drawControlPoints(ctx, x, y, width, height)
      }
    })

    // 绘制框选矩形
    if (interactionState.current.isBoxSelecting && interactionState.current.selectionBox) {
      const sel = interactionState.current.selectionBox
      ctx.strokeStyle = 'rgba(10, 178, 250, 0.93)'
      ctx.lineWidth = 0.5 // ✅ 更细
      ctx.setLineDash([4, 4])
      ctx.strokeRect(sel.x, sel.y, sel.width, sel.height)
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(82, 212, 203, 0.2)'
      ctx.fillRect(sel.x, sel.y, sel.width, sel.height)
    }

    if (store.showXline) {
      // 垂直虚线
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(interactionState.current.currentX, 0);
      ctx.lineTo(interactionState.current.currentX, canvas.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 水平虚线
      ctx.beginPath();
      ctx.moveTo(0, interactionState.current.currentY);
      ctx.lineTo(canvas.width, interactionState.current.currentY);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.setLineDash([]); // 重置
    }
  }, [image, localBoxes, selectedBox, viewState, yoloToCanvas])

  // 绘制控制点
  const drawControlPoints = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const size = 5 // ✅ 从8改为5，变小
    const points = [
      { x, y },
      { x: x + w / 2, y },
      { x: x + w, y },
      { x: x + w, y: y + h / 2 },
      { x: x + w, y: y + h },
      { x: x + w / 2, y: y + h },
      { x, y: y + h },
      { x, y: y + h / 2 }
    ]

    points.forEach(p => {
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 0.5 // ✅ 边框更细
      ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size)
    })
  }

  // 获取鼠标在 Canvas 上的坐标
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  // 检测点是否在框内（使用 Canvas 坐标）
  const isPointInBox = (x: number, y: number, box: MarkBox) => {
    const { x: bx, y: by, width: bw, height: bh } = yoloToCanvas(box.cx, box.cy, box.width, box.height)
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh
  }

  // 获取控制点
  const getControlPoint = (x: number, y: number, box: MarkBox) => {
    const { x: bx, y: by, width: bw, height: bh } = yoloToCanvas(box.cx, box.cy, box.width, box.height)
    const size = 8
    const points = [
      { id: 'tl', x: bx, y: by },
      { id: 'tm', x: bx + bw / 2, y: by },
      { id: 'tr', x: bx + bw, y: by },
      { id: 'mr', x: bx + bw, y: by + bh / 2 },
      { id: 'br', x: bx + bw, y: by + bh },
      { id: 'bm', x: bx + bw / 2, y: by + bh },
      { id: 'bl', x: bx, y: by + bh },
      { id: 'ml', x: bx, y: by + bh / 2 }
    ]

    for (const point of points) {
      if (Math.abs(x - point.x) < size && Math.abs(y - point.y) < size) {
        return point.id
      }
    }
    return null
  }
  // 鼠标按下 - 保存选中的控制点
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e)

    if (e.button === 0) { // 左键
      // ✅ 检查是否点击了控制点（先检查选中的框）
      let selectedControlPoint = null
      interactionState.current.isDragging = false;
      if (selectedBox) {
        selectedControlPoint = getControlPoint(x, y, selectedBox)
        if (selectedControlPoint) {
          // ✅ 保存选中的控制点信息
          interactionState.current.selectedControlPoint = selectedControlPoint
          interactionState.current.isSelecting = true
          interactionState.current.startX = x
          interactionState.current.startY = y
          // interactionState.current.selectedMarkIdx = selectedBox.nth

          // 保存当前框的尺寸，用于调整大小
          const { x: bx, y: by, width: bw, height: bh } = yoloToCanvas(
            selectedBox.cx, selectedBox.cy, selectedBox.width, selectedBox.height
          )
          interactionState.current.boxStartX = bx
          interactionState.current.boxStartY = by
          interactionState.current.boxStartWidth = bw
          interactionState.current.boxStartHeight = bh
          return
        }
      }

      // 检查是否点击了某个框
      const reversedBoxes = localBoxes
      const clickedBox = reversedBoxes.find(box => isPointInBox(x, y, box))

      // 选择框
      if (clickedBox) {
        setSelectedBox(clickedBox)

        const { x: bx, y: by } = yoloToCanvas(clickedBox.cx, clickedBox.cy, clickedBox.width, clickedBox.height)
        interactionState.current.isSelecting = true
        interactionState.current.startX = x
        interactionState.current.startY = y
        // interactionState.current.selectedMarkIdx = clickedBox.nth
        changeMarkIdx(clickedBox.nth)
        interactionState.current.dragOffsetX = x - bx
        interactionState.current.dragOffsetY = y - by
        interactionState.current.selectedControlPoint = null // 清空控制点
      } else {
        // 无选择,平移图片
        setSelectedBox(null)
        interactionState.current.isPanning = true
        interactionState.current.startX = x
        interactionState.current.startY = y

        interactionState.current.panStartX = viewState.panX
        interactionState.current.panStartY = viewState.panY

        // interactionState.current.selectedMarkIdx = -1
        changeMarkIdx(-1)
        interactionState.current.selectedControlPoint = null
      }
    } else if (e.button === 2) { // 右键
      e.preventDefault()
      interactionState.current.isBoxSelecting = true
      interactionState.current.startX = x
      interactionState.current.startY = y
      interactionState.current.currentX = x
      interactionState.current.currentY = y
      interactionState.current.selectionBox = {
        x,
        y,
        width: 0,
        height: 0
      }
      draw()
    }
    // else if (e.button === 1) { // 中键
    //   interactionState.current.isPanning = true
    //   interactionState.current.panStartX = x
    //   interactionState.current.panStartY = y
    // }
  }

  // 鼠标移动 - 区分处理框移动和控制点调整
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e)
    interactionState.current.currentX = x
    interactionState.current.currentY = y
    // 平移
    if (interactionState.current.isPanning) {
      const dx = x - interactionState.current.startX
      const dy = y - interactionState.current.startY
      setViewState(prev => ({
        ...prev,
        panX: interactionState.current.panStartX + dx,
        panY: interactionState.current.panStartY + dy
      }))
      draw()
      return
    }

    // 左键选择/拖拽
    if (interactionState.current.isSelecting) {
      const dx = x - interactionState.current.startX
      const dy = y - interactionState.current.startY

      if (interactionState.current.selectedMarkIdx !== -1) {
        const boxIndex = localBoxes.findIndex(
          b => b.nth === interactionState.current.selectedMarkIdx
        )
        if (boxIndex === -1) return

        const updatedBoxes = [...localBoxes]
        const box = updatedBoxes[boxIndex]

        interactionState.current.isDragging = true;
        // ✅ 判断是控制点调整还是框移动
        if (interactionState.current.selectedControlPoint) {
          // ✅ 控制点调整 - 调整框的大小
          const controlPoint = interactionState.current.selectedControlPoint
          let { x: bx, y: by, width: bw, height: bh } = yoloToCanvas(
            box.cx, box.cy, box.width, box.height
          )

          // 根据控制点位置调整框
          const minSize = 5
          const startX = interactionState.current.boxStartX
          const startY = interactionState.current.boxStartY
          const startW = interactionState.current.boxStartWidth
          const startH = interactionState.current.boxStartHeight

          let newX = bx
          let newY = by
          let newW = bw
          let newH = bh

          switch (controlPoint) {
            case 'tl': // 左上
              newX = Math.min(x, startX + startW - minSize)
              newY = Math.min(y, startY + startH - minSize)
              newW = startX + startW - newX
              newH = startY + startH - newY
              break
            case 'tm': // 上中
              newY = Math.min(y, startY + startH - minSize)
              newH = startY + startH - newY
              break
            case 'tr': // 右上
              newX = startX
              newY = Math.min(y, startY + startH - minSize)
              newW = Math.max(x - startX, minSize)
              newH = startY + startH - newY
              break
            case 'mr': // 右中
              newX = startX
              newY = startY
              newW = Math.max(x - startX, minSize)
              newH = startH
              break
            case 'br': // 右下
              newX = startX
              newY = startY
              newW = Math.max(x - startX, minSize)
              newH = Math.max(y - startY, minSize)
              break
            case 'bm': // 下中
              newX = startX
              newY = startY
              newW = startW
              newH = Math.max(y - startY, minSize)
              break
            case 'bl': // 左下
              newX = Math.min(x, startX + startW - minSize)
              newY = startY
              newW = startX + startW - newX
              newH = Math.max(y - startY, minSize)
              break
            case 'ml': // 左中
              newX = Math.min(x, startX + startW - minSize)
              newY = startY
              newW = startX + startW - newX
              newH = startH
              break
          }

          // 确保宽高为正
          if (newW > 0 && newH > 0) {
            // 转换为 YOLO 坐标
            const newBox = canvasToYolo(newX, newY, newW, newH, boxIndex)
            newBox.id = box.id
            updatedBoxes[boxIndex] = newBox
            setLocalBoxes(updatedBoxes)
            setSelectedBox(newBox)
          }
        } else if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          // ✅ 框移动 - 拖拽移动整个框
          const { width: bw, height: bh } = yoloToCanvas(
            box.cx, box.cy, box.width, box.height
          )

          const newX = x - interactionState.current.dragOffsetX
          const newY = y - interactionState.current.dragOffsetY
          const newBox = canvasToYolo(newX, newY, bw, bh, boxIndex)
          newBox.id = box.id

          updatedBoxes[boxIndex] = newBox
          setLocalBoxes(updatedBoxes)
          setSelectedBox(newBox)
        }
      } else {
        // 右键框选
        interactionState.current.selectionBox = {
          x: Math.min(interactionState.current.startX, x),
          y: Math.min(interactionState.current.startY, y),
          width: Math.abs(x - interactionState.current.startX),
          height: Math.abs(y - interactionState.current.startY)
        }
      }
      draw()
      return
    }

    // 右键框选
    if (interactionState.current.isBoxSelecting) {
      interactionState.current.selectionBox = {
        x: Math.min(interactionState.current.startX, x),
        y: Math.min(interactionState.current.startY, y),
        width: Math.abs(x - interactionState.current.startX),
        height: Math.abs(y - interactionState.current.startY)
      }
      draw()
      return
    }
    if (store.showXline) {
      draw()
      return
    }
    // 更新光标样式
    updateCursorStyle(x, y)
  }

  // 鼠标释放
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // 左键释放
      // 左键 选中并拖动了,更新数据
      if (interactionState.current.isSelecting && interactionState.current.isDragging) {
        onUpdateMarks(localBoxes)
      }

      interactionState.current.isSelecting = false
      interactionState.current.selectionBox = null
      // interactionState.current.selectedMarkIdx = -1
      interactionState.current.selectedControlPoint = null // ✅ 清空控制点

      interactionState.current.isPanning = false

      draw()
    }

    if (e.button === 2) { // 右键释放
      const sel = interactionState.current.selectionBox
      if (sel && sel.width > 10 && sel.height > 10) {
        const newBox = canvasToYolo(sel.x, sel.y, sel.width, sel.height, interactionState.current.selectedMarkIdx)
        const updatedBoxes = [...localBoxes, newBox]
        setLocalBoxes(updatedBoxes)
        setSelectedBox(newBox)
        onUpdateMarks(updatedBoxes)
        changeMarkIdx(updatedBoxes.length - 1)
      }

      interactionState.current.isBoxSelecting = false
      interactionState.current.selectionBox = null
      draw()
    }
  }

  // 更新光标样式 - 控制点显示对应的光标
  const updateCursorStyle = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 检查是否在控制点上
    if (selectedBox) {
      const controlPoint = getControlPoint(x, y, selectedBox)
      if (controlPoint) {
        const cursors: Record<string, string> = {
          'tl': 'nw-resize',
          'tm': 'n-resize',
          'tr': 'ne-resize',
          'mr': 'e-resize',
          'br': 'se-resize',
          'bm': 's-resize',
          'bl': 'sw-resize',
          'ml': 'w-resize'
        }
        canvas.style.cursor = cursors[controlPoint] || 'default'
        return
      }
    }

    // 检查是否在框上
    const hoveredBox = localBoxes.find(box => isPointInBox(x, y, box))
    canvas.style.cursor = hoveredBox ? 'move' : 'default'
  }
  // ============ 鼠标事件 ============

  // 右键框选
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
  }

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // e.preventDefault() passive为true不能阻止

    const { x, y } = getCanvasCoords(e)
    const delta = e.deltaY > 0 ? 0.9 : 1.1

    setViewState(prev => {
      const newZoom = Math.max(0.1, Math.min(10, prev.zoom * delta))

      // 以鼠标位置为中心缩放
      const scale = newZoom / prev.zoom
      const newPanX = x - (x - prev.panX) * scale
      const newPanY = y - (y - prev.panY) * scale

      return {
        ...prev,
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY
      }
    })
  }, [getCanvasCoords])

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ 检查是否在输入框中
      const target = e.target as HTMLElement
      const tagName = target.tagName.toLowerCase()

      // 如果是输入框、文本域或可编辑元素，忽略
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase();
      if ((key === 'delete' || key === 'backspace' || key === 'q') && interactionState.current.selectedMarkIdx !== -1) {
        const marks = localBoxes.filter(box => box.nth !== interactionState.current.selectedMarkIdx)
        onUpdateMarks(marks)
        setLocalBoxes(marks)
        setSelectedBox(null)
        changeMarkIdx(-1)
        draw()
      }
      if (key === 'a') {
        onChangeImage(-1)
      }
      if (key === 'd') {
        onChangeImage(1)
      }
      if (key === 'w') {
        store.showXline = !store.showXline
        draw()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBox, localBoxes, draw])

  // 重新绘制
  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        display: 'inline-block',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: 'block',
          cursor: 'default',
          touchAction: 'none',
          borderRadius: 8
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onMouseLeave={() => {
          interactionState.current.isSelecting = false
          interactionState.current.isPanning = false
          interactionState.current.selectionBox = null
          draw()
        }}
      />

      {/* 控制信息 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        color: 'white',
        padding: '8px 14px',
        borderRadius: 6,
        fontSize: 12,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)'
      }}>
        <div>🖱️ 左键: 移动 | 右键: 标注 | 滚轮: 缩放</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
          🔍 缩放: {viewState.zoom.toFixed(2)}x | 框数: {localBoxes.length}
        </div>
      </div>

      {/* 重置视图按钮 */}
      <button
        onClick={() => {
          const canvas = canvasRef.current
          if (canvas && image) {
            const scaleX = canvas.width / image.width
            const scaleY = canvas.height / image.height
            const initialZoom = Math.min(scaleX, scaleY) * 0.9
            setViewState(prev => ({
              ...prev,
              zoom: initialZoom,
              panX: (canvas.width - image.width * initialZoom) / 2,
              panY: (canvas.height - image.height * initialZoom) / 2
            }))
          }
        }}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '6px 12px',
          background: 'rgba(0,0,0,0.75)',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
          backdropFilter: 'blur(4px)'
        }}
      >
        🔄 重置视图
      </button>

    </div>
  )
}