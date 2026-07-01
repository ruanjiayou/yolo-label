import { Link } from 'react-router-dom'
import { createProject, getProjects } from '../apis'
import store, { IProject, useLocalProxy } from '../store'
import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { Button, Input, Modal, Space, List } from 'antd'
import { AlignASide } from '../style'
import styled from 'styled-components'

const Main = styled.div`
  font-size: 14px;
  color: rgb(140, 140, 140);
  min-height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

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
    <div style={{ padding: 15, width: '50%', margin: '0 auto', height: '100vh', boxSizing: 'border-box' }}>

      <Modal
        title="创建项目"
        open={statusState.modalVisible}
        onCancel={() => {
          statusStore.modalVisible = false
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>

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
        width={300}
        styles={{
          body: { maxHeight: '400px', overflowY: 'auto' }
        }}
      >
        <Main>
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
        </Main>
      </Modal>
      <List bordered style={{ height: '100%' }} header={
        <AlignASide style={{ width: 150 }}>项目列表 <Button onClick={() => statusStore.modalVisible = true}>创建</Button></AlignASide>
      }>
        {state.projects.map(project => (
          <List.Item key={project.id} style={{ borderBottom: '1px solid #eee' }}>
            <Link to={"/project/" + project.id}>{project.title}</Link>
          </List.Item>
        ))}
      </List>

    </div>
  )
}