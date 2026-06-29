import { useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnnotationCanvas } from "../components/AnnotationCanvas";
import store, { IImage, IProject, useLocalProxy } from "../store";
import { useSnapshot } from "valtio";
import { createProjectLabel, deleteImage, deleteLabel, getProjectDetail, getProjectImages, getProjects, updateImageMarks } from "../apis"
import styled from "styled-components";
import { AlignASide } from "../style";
import Uploader from "../components/Uploader";
import { DeleteFilled } from "@ant-design/icons";

const TxtOmit = styled.div`
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const Project = () => {
  const navigate = useNavigate();
  const state = useSnapshot(store)
  const [detailState, detailStore] = useLocalProxy<{
    loading: boolean;
    activeImageIndex: number;
    selectedLabelNth: number;
    selectedMarkNth: number;
    project: IProject | null | undefined;
    images: IImage[];
    labelMap: { [key: string]: string },
    currentLabelId: string;
  }>({
    loading: true,
    activeImageIndex: 0,
    selectedLabelNth: 0,
    selectedMarkNth: -1,
    project: null,
    images: [],
    labelMap: {},
    currentLabelId: '',
  })

  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    if (store.projects.length === 0) {
      getProjects().then(projects => {
        store.projects = projects as IProject[];
      })
    }
    if (id) {
      // 切换项目时加载详情详情(含标签列表)和对应图片
      getProjectDetail(id).then(data => {
        detailStore.project = data
        const map: { [key: string]: string } = {};
        detailStore.project?.labels?.forEach(label => {
          map[label.id] = label.label
        })
        detailStore.labelMap = map;
        detailStore.currentLabelId = detailStore.project?.labels?.[0].id || ''
      })
      // 获取图片列表
      getProjectImages(id).then(images => {
        detailStore.images = images;
      })
    }
  }, [id]);

  const currentImage = detailState.images[detailState.activeImageIndex];

  // 动作封装
  const saveCurrentAnnotations = useCallback((indexToSave = detailState.activeImageIndex) => {
    const img = detailStore.images[indexToSave];
    if (!img) return;
  }, [detailStore.images, detailStore.activeImageIndex]);
  const changeImage = useCallback((direction: 1 | -1) => {
    if (direction === 1 && detailStore.activeImageIndex < detailStore.images.length - 1) {
      saveCurrentAnnotations();
      detailStore.activeImageIndex = detailStore.activeImageIndex + 1
    }
    if (direction === -1 && detailStore.activeImageIndex > 0) {
      saveCurrentAnnotations();
      detailStore.activeImageIndex = detailStore.activeImageIndex - 1;
    }
  }, [])
  const handleExportYolo = () => {
    fetch(`/api/projects/${id}/export-yolo`, { method: "POST" })
      .then(res => res.json())
      .then(res => alert(`导出成功，路径在: ${res.path}`));
  };
  const onAddLabel = useCallback(async () => {
    const oinput = document.getElementById('label_input') as HTMLInputElement;
    if (detailStore.project && detailStore.project.labels && oinput) {
      createProjectLabel({ label: oinput.value, nth: detailStore.project?.labels?.length || 0, projectId: id as string })
        .then((data) => {
          detailStore.project?.labels?.push(data)
          oinput.value = '';
        })
    }
  }, [])
  const onDeleteLabel = useCallback(async (id: string) => {
    await deleteLabel(id)
    const idx = detailStore.project?.labels?.findIndex(label => label.id === id) || -1
    detailStore.project?.labels?.splice(idx, 1)
  }, [])
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* 左侧菜单 */}
      <div style={{ width: 250, borderRight: "1px solid #ddd", padding: 15 }}>
        <h3 style={{ marginTop: 0 }}><Link to={"/"}>🏠</Link> 项目选择</h3>
        <AlignASide style={{ gap: 10 }}>
          <select value={id} onChange={(e) => navigate(`/project/${e.target.value}`)} style={{ width: "100%", padding: 8 }}>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <Uploader config={{ project_id: id }} />
        </AlignASide>

        <h4>图片列表 ({detailState.images.length === 0 ? 0 : detailState.activeImageIndex + 1}/{detailState.images.length})</h4>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {detailState.images.map((img, idx) => (
            <AlignASide key={img.id} style={{ gap: 10, padding: "6px 10px", backgroundColor: idx === detailState.activeImageIndex ? "#e6f7ff" : "transparent", }}>
              <TxtOmit
                title={img.path}
                onClick={() => { saveCurrentAnnotations(); detailStore.activeImageIndex = idx; }}
                style={{
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  direction: "rtl"
                }}
              >
                {img.path} {img.marks.length > 0 ? "✓" : ""}
              </TxtOmit>
              <DeleteFilled color="red" onClick={() => {
                deleteImage(img.id).then(() => {
                  detailStore.images = detailStore.images.filter(item => item.id !== img.id)
                })
              }} />
            </AlignASide>
          ))}
        </div>

      </div>

      {/* 中间操作画布 */}
      <div style={{ height: '100%', flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: 'relative' }}>
        {currentImage ? (
          <AnnotationCanvas
            imageSrc={`/static/${id}/${currentImage.path}`}
            marks={currentImage.marks.map((m, idx) => ({ ...m, nth: idx }))}
            label_id={detailState.currentLabelId}
            onBoxSelect={(nth: number) => {
              detailStore.selectedMarkNth = nth
            }}
            onUpdateMarks={marks => {
              detailStore.images.forEach(image => {
                updateImageMarks(image.id, marks).then(() => {
                  image.marks = marks
                })
              })
            }}
            onChangeImage={changeImage}
          />
        ) : (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>该项目下暂无图片</div>
        )}
      </div>

      {/* 右侧设置 */}
      <div style={{ width: 200, borderLeft: "1px solid #ddd", padding: 15, display: "flex", flexDirection: "column" }}>
        <AlignASide style={{ gap: 10 }}>
        </AlignASide>
        <AlignASide style={{ gap: 10 }}>
          <input id="label_input" style={{ flex: 1, minWidth: 30 }} />
          <button onClick={onAddLabel}>添加分类</button>
        </AlignASide>
        <div>
          {detailState.project?.labels!.map((l, nth) => (
            <AlignASide key={l.id} style={{ margin: '5px 0' }} onClick={() => {
              detailStore.selectedLabelNth = nth
              detailStore.currentLabelId = l.id
            }}>
              <span dangerouslySetInnerHTML={{ __html: `[${detailState.selectedLabelNth === nth ? '✅' : '&nbsp;&nbsp;&nbsp;'}] ${l.nth}` }}></span>
              <span>{l.label}</span>
              <span onClick={() => onDeleteLabel(l.id)}>X</span>
            </AlignASide>
          ))}
        </div>
        <hr style={{ margin: '20px 0' }} />
        <p>标注</p>
        <div>
          {currentImage && currentImage.marks.map((mark, idx) => (
            <div key={idx}>
              <AlignASide>
                <span>{detailState.labelMap[mark.id] || '未知'}</span>
                <span onClick={() => {
                  const marks = currentImage.marks.filter((m, nth) => nth !== idx)
                  updateImageMarks(currentImage.id, marks).then(() => {
                    detailStore.images.forEach(image => {
                      if (image.id === currentImage.id) {
                        image.marks = marks;
                      }
                    })
                  })
                }}>x</span>
              </AlignASide>

            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
          <h5>操作说明:</h5>
          <ul>
            <li>拉框自动使用右侧选中类别</li>
            <li>键盘 Q: 删除选中的标注</li>
            <li>键盘 A: 上一张</li>
            <li>键盘 D: 下一张</li>
          </ul>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => changeImage(-1)} disabled={detailState.activeImageIndex === 0}>上一张 (A)</button>
          <button onClick={() => changeImage(1)} disabled={detailState.activeImageIndex === detailState.images.length - 1}>下一张 (D)</button>
          <span style={{ marginLeft: 15, color: "#666" }}>💡 鼠标滚动可放大缩小图片</span>
        </div>
        <button onClick={handleExportYolo} style={{ marginTop: 20, width: "100%", padding: 10, background: "#52c41a", color: "#fff", border: "none" }}>
          一键划分为 YOLO 数据集
        </button>
      </div>
    </div>
  );
};