import { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnnotationCanvas } from "../components/AnnotationCanvas";
import store, { IImage, IProject, useLocalProxy } from "../store";
import { useSnapshot } from "valtio";
import { createProjectLabel, deleteImage, deleteLabel, getProjectDetail, getProjectImages, getProjects, updateImageMarks } from "../apis"
import styled from "styled-components";
import { AlignASide } from "../style";
import Uploader from "../components/Uploader";
import { CaretDownOutlined, CaretRightOutlined, CheckCircleOutlined, CopyOutlined, DeleteFilled, SyncOutlined } from "@ant-design/icons";
import { Button, Input, List, Select, Space, Tooltip } from "antd";
import type { InputRef } from 'antd';

const MyList = styled.div`
  background-color: #eee;
  border-left: 5px solid #558ABB;
  padding-top: 5px;
  counter-reset: linenumber;
  flex: 1;
  overflow-y: auto;
  &>div:before {
    counter-increment: linenumber;
    display: inline-block;
    width: 30px;
    height: 100%;
    content: " "counter(linenumber) ". ";
  }
`

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
    labelToAdd: string;
    groupQuery: string;
  }>({
    loading: true,
    activeImageIndex: -1,
    selectedLabelNth: 0,
    selectedMarkNth: -1,
    project: null,
    images: [],
    labelMap: {},
    currentLabelId: '',
    labelToAdd: '',
    groupQuery: ''
  })

  const { id } = useParams<{ id: string }>()
  const [currentImage, setCurrentImage] = useState<IImage | null>(null)
  const classRef = useRef<InputRef>(null)

  useEffect(() => {
    if (store.projects.length === 0) {
      getProjects().then(projects => {
        store.projects = projects as IProject[];
      })
    }
    if (id) {
      detailStore.groupQuery = '';
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
        detailStore.activeImageIndex = 0
      })
    }
  }, [id]);

  useEffect(() => {
    const data = detailStore.images[detailState.activeImageIndex]
    setCurrentImage(data ? { ...data } : null)
  }, [detailState.activeImageIndex])

  const changeImage = useCallback((direction: 1 | -1) => {
    if (direction === 1 && detailStore.activeImageIndex < detailStore.images.length - 1) {
      detailStore.activeImageIndex = detailStore.activeImageIndex + 1
    }
    if (direction === -1 && detailStore.activeImageIndex > 0) {
      detailStore.activeImageIndex = detailStore.activeImageIndex - 1;
    }
  }, [])
  // 添加分类
  const onAddLabel = useCallback(async () => {
    if (detailStore.project && detailStore.project.labels && classRef.current) {
      const label = detailStore.labelToAdd
      createProjectLabel({ label: label, nth: detailStore.project?.labels?.length || 0, projectId: id as string })
        .then((data) => {
          detailStore.project?.labels?.push(data)
          detailStore.labelToAdd = ''
          classRef.current?.focus()
        })
    }
  }, [])
  // 删除分类
  const onDeleteLabel = useCallback(async (id: string) => {
    await deleteLabel(id)
    const idx = detailStore.project?.labels?.findIndex(label => label.id === id) || -1
    detailStore.project?.labels?.splice(idx, 1)
    detailStore.selectedLabelNth = 0
  }, [])
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* 左侧菜单 */}
      <div style={{ display: 'flex', flexDirection: 'column', width: 250, borderRight: "1px solid #ddd", padding: 15 }}>
        <h3 style={{ marginTop: 0 }}><Link to={"/"}>🏠</Link> 项目选择</h3>
        <Space.Compact style={{ overflow: 'hidden' }}>
          <Select
            value={id}
            onChange={(v) => navigate(`/project/${v}`)}
            style={{ width: 150, }}
            options={state.projects.map(p => ({ value: p.id, lable: p.title }))}
          />
          <Select
            value={detailState.groupQuery}
            options={[{ label: '全部', value: '' }, ...(detailStore.project?.groups || []).map(v => ({ label: v, value: v }))]}
            style={{ flex: 1, minWidth: 20 }}
            onChange={v => {
              detailStore.groupQuery = v
              getProjectImages(id as string, { group: detailStore.groupQuery }).then(images => {
                detailStore.images = images;
                detailStore.activeImageIndex = 0
              })
            }}
          />
        </Space.Compact>

        <AlignASide style={{ margin: '10px 0' }}>
          <span>图片列表 ({detailState.images.length === 0 ? 0 : detailState.activeImageIndex + 1}/{detailState.images.length})</span>
          <SyncOutlined onClick={() => {
            getProjectImages(id as string).then(images => {
              detailStore.images = images;
            })
          }} />
          <Uploader config={{ project_id: id }} />
        </AlignASide>
        <MyList>
          {detailState.images.map((img, idx) => (
            <AlignASide key={img.id} style={{ gap: 10, padding: "5px 10px 5px 10px", backgroundColor: idx === detailState.activeImageIndex ? "#e6f7ff" : "transparent", }}>
              <TxtOmit
                title={img.path}
                onClick={(e) => {
                  detailStore.activeImageIndex = idx;
                  e.currentTarget.scrollIntoView({
                    behavior: 'smooth',  // 平滑滚动
                    block: 'center',
                  })
                }}
                style={{
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {img.path}
              </TxtOmit>
              <Tooltip title={currentImage?.path}>
                <CopyOutlined />
              </Tooltip>
              <DeleteFilled color="red" onClick={() => {
                const idx = detailStore.images.findIndex(v => v.id === img.id)
                if (idx === detailStore.activeImageIndex) detailStore.activeImageIndex = -1;
                deleteImage(img.id).then(() => {
                  detailStore.images = detailStore.images.filter(item => item.id !== img.id)
                  detailStore.activeImageIndex = idx;
                })
              }} />
            </AlignASide>
          ))}
        </MyList>

      </div>

      {/* 中间操作画布 */}
      <div style={{ height: '100%', flex: 1, overflow:'hidden', display: "flex", flexDirection: "column", alignItems: "center", position: 'relative' }}>
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
                if (currentImage && image.id === currentImage.id) {
                  updateImageMarks(image.id, marks).then(() => {
                    image.marks = marks
                    currentImage.marks = marks
                  })
                }
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
        <div>
          <Button type="text"
            style={{ marginBottom: 10 }}
            icon={state.showProjectDetail ? <CaretDownOutlined /> : <CaretRightOutlined />}
            onClick={() => { store.showProjectDetail = !store.showProjectDetail }}
          >详情</Button>
        </div>
        <Space style={{ gap: 10, display: state.showProjectDetail ? 'block' : 'none' }} vertical>
          <Space.Compact>
            <Space.Addon>分类</Space.Addon>
            <Input id="label_input" value={detailState.labelToAdd} ref={classRef} style={{ flex: 1, minWidth: 30 }} onChange={(e) => {
              detailStore.labelToAdd = e.target.value
            }} />
            <Button type="primary" onClick={onAddLabel}>添加</Button>
          </Space.Compact>
          <List bordered header={"分类列表"} style={{ marginTop: 10, marginBottom: 10, overflow: 'hidden' }}>
            {detailState.project?.labels!.map((l, nth) => (
              <List.Item key={l.id} style={detailState.selectedLabelNth === nth ? { backgroundColor: '#07f8', color: 'white' } : {}}>
                <AlignASide style={{ margin: '5px 0', width: '100%' }} onClick={() => {
                  detailStore.selectedLabelNth = nth
                  detailStore.currentLabelId = l.id
                }}>
                  <span>{l.nth} {l.label} {detailState.selectedLabelNth === nth ? <CheckCircleOutlined /> : ''}</span>
                  <DeleteFilled onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDeleteLabel(l.id)
                  }} />
                </AlignASide>
              </List.Item>
            ))}
          </List>
          <List bordered header={"分组列表"} style={{ marginBottom: 10, backgroundColor: '#eee', cursor: 'not-allowed' }}>
            {detailState.project?.groups.map((group, idx) => (
              <List.Item key={idx}>{group}</List.Item>
            ))}
          </List>
        </Space>
        <Space.Compact>
          <Space.Addon>分组</Space.Addon>
          <Input value={currentImage?.group || ''} disabled />
          <Button type="primary">修改</Button>
        </Space.Compact>
        <List bordered header={"标注数组"} style={{ marginTop: 10 }}>
          {currentImage && currentImage.marks.map((mark, idx) => (
            <List.Item key={idx}>
              <AlignASide style={{ width: '100%' }}>
                <span>{detailState.labelMap[mark.id] || '未知'}</span>
                <DeleteFilled onClick={() => {
                  const marks = currentImage.marks.filter((_m, nth) => nth !== idx)
                  updateImageMarks(currentImage.id, marks).then(() => {
                    detailStore.images.forEach(image => {
                      if (image.id === currentImage.id) {
                        image.marks = marks;
                      }
                    })
                  })
                }} />
              </AlignASide>
            </List.Item>
          ))}
        </List>
        <div style={{ flex: 1 }}></div>
        <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
          <h5>操作说明:</h5>
          <ul>
            <li>拉框自动使用右侧选中类别</li>
            <li>键盘 Q: 删除所选标注</li>
            <li>键盘 S: 显示辅助线</li>
            <li>键盘 A: 上一张</li>
            <li>键盘 D: 下一张</li>
            <li>鼠标滚动可缩放图片</li>
          </ul>
        </div>
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button type="primary" onClick={() => changeImage(-1)} disabled={detailState.activeImageIndex === 0}>上一张 (A)</Button>
          <Button type="primary" onClick={() => changeImage(1)} disabled={detailState.activeImageIndex === detailState.images.length - 1}>下一张 (D)</Button>
        </div>
        <button style={{ marginTop: 20, width: "100%", padding: 10, background: "#52c41a", color: "#fff", border: "none" }}>
          一键生成 YOLO 数据集
        </button>
      </div>
    </div>
  );
};