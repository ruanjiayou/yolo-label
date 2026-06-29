import { useState, useRef } from 'react'
import { Modal, Progress, Button, Space, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import axios, { AxiosProgressEvent } from 'axios'

interface UploadFileItem {
  id: string
  file: File
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
}

function Uploader(props: { config: any }) {
  const [files, setFiles] = useState<UploadFileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }
  // 选择文件
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadFileItem[] = Array.from(selectedFiles).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // 有文件时自动打开对话框
    if (newFiles.length > 0) {
      setModalVisible(true)
    }
  }

  // 上传单个文件
  const uploadFile = async (file: UploadFileItem) => {
    const formData = new FormData()
    formData.append('files', file.file)

    try {
      const response = await axios.post(`/api/projects/${props.config.project_id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
            setFiles(prev =>
              prev.map(f =>
                f.id === file.id
                  ? { ...f, progress, status: 'uploading' }
                  : f
              )
            )
          }
        }
      })

      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'done', url: response.data.url, progress: 100 }
            : f
        )
      )
    } catch (error) {
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'error' }
            : f
        )
      )
      throw error
    }
  }

  // 开始上传
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) {
      message.warning('没有待上传的文件')
      return
    }

    setUploading(true)
    const batchSize = 3

    try {
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize)
        await Promise.all(batch.map(file => uploadFile(file)))
      }
      message.success('上传完成！')
    } catch (error) {
      message.error('部分文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 删除文件
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // 清空所有
  const clearAll = () => {
    setFiles([])
    setModalVisible(false)
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  // 获取状态颜色
  const getStatusColor = (status: UploadFileItem['status']) => {
    switch (status) {
      case 'pending': return '#8c8c8c'
      case 'uploading': return '#1890ff'
      case 'done': return '#52c41a'
      case 'error': return '#ff4d4f'
      default: return '#8c8c8c'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: UploadFileItem['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'uploading': return '⏳'
      case 'done': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount = files.filter(f => f.status === 'done').length
  const totalCount = files.length

  return (
    <div>
      {/* 上传按钮 */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" onClick={handleSelectClick}>
          <Button type="primary" icon={<UploadOutlined />} size="middle">
            上传图片
          </Button>
        </label>
        {files.length > 0 && (
          <Button
            type="default"
            onClick={() => setModalVisible(true)}
          >
            查看列表 ({files.length})
          </Button>
        )}
      </div>

      {/* 进度对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              📤 上传进度
              <span style={{ marginLeft: 10, fontSize: '14px', fontWeight: 'normal', color: '#8c8c8c' }}>
                {doneCount}/{totalCount} 已完成
              </span>
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          if (!uploading) {
            setModalVisible(false)
          }
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
              待上传: {pendingCount} 张
            </div>
            <Space>
              <Button onClick={clearAll} disabled={uploading}>
                清空
              </Button>
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploading}
                disabled={pendingCount === 0 || uploading}
              >
                {uploading ? '上传中...' : `上传 (${pendingCount})`}
              </Button>
            </Space>
          </div>
        }
        width={600}
        styles={{
          body: { maxHeight: '400px', overflowY: 'auto' }
        }}
      >
        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bfbfbf' }}>
            暂无图片
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {files.map(file => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                }}
              >
                {/* 缩略图 */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    flexShrink: 0,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  {file.status === 'done' && file.url ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    '🖼️'
                  )}
                </div>

                {/* 文件信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8c8c8c', flexShrink: 0 }}>
                      {formatSize(file.size)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px' }}>{getStatusIcon(file.status)}</span>
                    <span style={{ fontSize: '13px', color: getStatusColor(file.status) }}>
                      {file.status === 'pending' && '等待上传'}
                      {file.status === 'uploading' && `${file.progress}%`}
                      {file.status === 'done' && '已完成'}
                      {file.status === 'error' && '上传失败'}
                    </span>
                    <span style={{ flex: 1 }} />
                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#bfbfbf',
                        cursor: file.status === 'uploading' ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        padding: '0 4px',
                      }}
                      onMouseEnter={(e) => {
                        if (file.status !== 'uploading') {
                          e.currentTarget.style.color = '#ff4d4f'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#bfbfbf'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* 进度条 */}
                  {(file.status === 'pending' || file.status === 'uploading' || 'error') && (
                    <Progress
                      percent={file.progress}
                      size="small"
                      status={file.status === 'error' ? 'exception' : 'active'}
                      strokeColor={{
                        '0%': '#1890ff',
                        '100%': '#52c41a',
                      }}
                      style={{ marginTop: '4px', marginBottom: 0 }}
                    />
                  )}

                  {file.status === 'error' && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '2px' }}>
                      上传失败，请重试
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Uploader