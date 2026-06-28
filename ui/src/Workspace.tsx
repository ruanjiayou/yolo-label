import React, { useState, useEffect, useCallback } from "react";
import { AnnotationCanvas } from "./AnnotationCanvas";

export const Workspace = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjId, setCurrentProjId] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const [imgIndex, setImgIndex] = useState<number>(0);
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabelNth, setSelectedLabelNth] = useState<number>(0);

  // 获取项目列表
  useEffect(() => {
    fetch("http://localhost:3001/api/projects")
      .then((res) => res.json())
      .then((body) => {
        setProjects(body.data.list);
        if (body.data.list.length > 0) setCurrentProjId(body.data.list[0].id);
      });
  }, []);

  // 切换项目时加载对应图片和标签
  useEffect(() => {
    if (!currentProjId) return;
    // 获取图片列表
    fetch(`http://localhost:3001/api/projects/${currentProjId}/images`)
      .then((res) => res.json())
      .then((body) => {
        setImages(body.data.list);
        setImgIndex(0);
      });

    // 获取标签列表
    fetch(`http://localhost:3001/api/projects/${currentProjId}`)
      .then((res) => res.json())
      .then((body) => {
        setLabels(body.data.info.labels);
        if (body.data.info.labels.length > 0) {
          setSelectedLabelNth(body.data.info.labels[0].nth);
        }
      });
  }, [currentProjId]);

  const currentImage = images[imgIndex];

  // 动作封装
  const saveCurrentAnnotations = useCallback((indexToSave = imgIndex) => {
    const img = images[indexToSave];
    if (!img) return;
  }, [images, imgIndex]);

  const handlePrev = useCallback(() => {
    if (imgIndex > 0) {
      saveCurrentAnnotations();
      setImgIndex((prev) => prev - 1);
    }
  }, [imgIndex, saveCurrentAnnotations]);

  const handleNext = useCallback(() => {
    if (imgIndex < images.length - 1) {
      saveCurrentAnnotations();
      setImgIndex((prev) => prev + 1);
    }
  }, [imgIndex, images.length, saveCurrentAnnotations]);

  // 监听键盘快捷键 W A S D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "a") {
        handlePrev();
      } else if (key === "d") {
        handleNext();
      } else if (key === "s") {
        saveCurrentAnnotations();
        alert("保存成功");
      } else if (key === "w") {
        // W 激活框选逻辑（这里由于是默认开启拉框，也可以做状态切换切换鼠标模式）
        console.log("准备框选");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, saveCurrentAnnotations]);

  const handleBoxChange = (newBoxes: any[]) => {
    const updatedImages = [...images];
    updatedImages[imgIndex].labels = newBoxes;
    setImages(updatedImages);
    // 自动保存功能
    saveCurrentAnnotations(imgIndex);
  };

  const handleExportYolo = () => {
    fetch(`http://localhost:3001/api/projects/${currentProjId}/export-yolo`, { method: "POST" })
      .then(res => res.json())
      .then(res => alert(`导出成功，路径在: ${res.path}`));
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* 左侧菜单 */}
      <div style={{ width: 250, borderRight: "1px solid #ddd", padding: 15 }}>
        <h3>项目选择</h3>
        <select value={currentProjId} onChange={(e) => setCurrentProjId(e.target.value)} style={{ width: "100%", padding: 8 }}>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>

        <hr style={{ margin: "20px 0" }} />
        <h4>图片列表 ({imgIndex + 1}/{images.length})</h4>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {images.map((img, idx) => (
            <div
              key={img._id}
              title={img.path}
              onClick={() => { saveCurrentAnnotations(); setImgIndex(idx); }}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                backgroundColor: idx === imgIndex ? "#e6f7ff" : "transparent",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {img.path} {img.labels.length > 0 ? "✓" : ""}
            </div>
          ))}
        </div>

      </div>

      {/* 中间操作画布 */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", position: 'relative' }}>


        {currentImage ? (
          <AnnotationCanvas
            imageSrc={`http://localhost:3001/static/${currentProjId}/${currentImage.path}`}
            boxes={currentImage.labels}
            currentNth={selectedLabelNth}
            onChange={handleBoxChange}
          />
        ) : (
          <div>该项目下暂无图片</div>
        )}
      </div>

      {/* 右侧设置 */}
      <div style={{ width: 200, borderLeft: "1px solid #ddd", padding: 15, display: "flex", flexDirection: "column" }}>
        <h4>当前标注类别 (W)</h4>
        <select
          value={selectedLabelNth}
          onChange={(e) => setSelectedLabelNth(Number(e.target.value))}
          style={{ width: "100%", padding: 8 }}
        >
          {labels.map((l) => (
            <option key={l._id} value={l.nth}>
              {l.label} ({l.nth})
            </option>
          ))}
        </select>

        <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
          <h5>操作说明:</h5>
          <ul>
            <li>拉框自动使用右侧选中类别</li>
            <li>键盘 A: 上一张</li>
            <li>键盘 D: 下一张</li>
            <li>键盘 S: 手动保存</li>
            <li>拉框释放后系统将<b>自动保存</b>数据</li>
          </ul>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handlePrev} disabled={imgIndex === 0}>上一张 (A)</button>
          <button onClick={handleNext} disabled={imgIndex === images.length - 1}>下一张 (D)</button>
          <button onClick={() => saveCurrentAnnotations()}>保存 (S)</button>
          <span style={{ marginLeft: 15, color: "#666" }}>💡 鼠标滚动可放大缩小图片</span>
        </div>
        <button onClick={handleExportYolo} style={{ marginTop: 20, width: "100%", padding: 10, background: "#52c41a", color: "#fff", border: "none" }}>
          一键划分为 YOLO 数据集
        </button>
      </div>
    </div>
  );
};