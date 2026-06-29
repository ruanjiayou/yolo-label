import { Link } from 'react-router-dom'
import { createProject, getProjects } from '../apis'
import store, { IProject, useLocalProxy } from '../store'
import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { Button, Input, Modal, Space } from 'antd'
import { AlignASide } from '../style'

export default function Home() {
  const state = useSnapshot(store)
  const [statusState, statusStore] = useLocalProxy({
    modalVisible: false,
    composing: false,
    loading: false,
    fetching: false,
    title: '',
  })

  const init = async function () {
    const projects = await getProjects()
    store.projects = projects as IProject[];
  }
  useEffect(() => {
    init()
  }, [])
  return (
    <div style={{ padding: 15 }}>
      <AlignASide style={{ width: 150 }}>项目列表 <Button onClick={() => statusStore.modalVisible = true}>创建</Button></AlignASide>
      <Modal
        title="创建项目"
        open={statusState.modalVisible}
        onCancel={() => {
          statusStore.modalVisible = false
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>

            <Space>
              <Button onClick={() => statusStore.modalVisible = false}>
                关闭
              </Button>
              <Button
                type="primary"
                onClick={async () => {
                  await createProject({ title: statusStore.title })
                  await init()
                  statusStore.modalVisible = false
                }}
              >
                创建
              </Button>
            </Space>
          </div>
        }
        width={600}
        styles={{
          body: { maxHeight: '400px', overflowY: 'auto' }
        }}
      >
        <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
          <Input
            onCompositionStart={() => {
              statusStore.composing = true
            }}
            onCompositionEnd={(e) => {
              statusStore.composing = false
              statusStore.title = e.currentTarget.value
            }}
            onChange={(e) => {
              if (!statusStore.composing) {
                statusStore.title = e.target.value
              }
            }}
          />
        </div>
      </Modal>
      <div>
        {state.projects.map(project => (
          <Link key={project.id} to={"/project/" + project.id}>{project.title}</Link>
        ))}
      </div>

    </div>
  )
}