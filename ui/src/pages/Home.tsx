import { Link } from 'react-router-dom'
import { getProjects } from '../apis'
import store, { IProject } from '../store'
import { useEffect } from 'react'
import { useSnapshot } from 'valtio'

export default function Home() {
  const state = useSnapshot(store)
  const init = async function () {
    const projects = await getProjects()
    store.projects = projects as IProject[];
  }
  useEffect(() => {
    init()
  }, [])
  return (
    <div>
      <h1>项目列表</h1>
      <div>
        {state.projects.map(project => (
          <Link key={project.id} to={"/project/" + project.id}>{project.title}</Link>
        ))}
      </div>

    </div>
  )
}