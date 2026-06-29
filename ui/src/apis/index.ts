import type { IProject, IImage, ILabel, IMark } from "../store";
import shttp from "../utils/shttp";

export async function getProjects(query = {}) {
  const result = await shttp.get<IProject>(`/api/projects`, { params: query });
  if (result.success) {
    const data = result.data.list;
    return data;
  } else {
    throw ('error')
  }
}

export async function getProjectDetail(id: string) {
  const result = await shttp.get<IProject>(`/api/projects/${id}`);
  if (result.success) {
    const data = result.data.info;
    return data;
  } else {
    throw ('error')
  }
}

export async function getProjectImages(project_id: string, query = {}) {
  const result = await shttp.get<IImage>(`/api/projects/${project_id}/images`, { params: query });
  if (result.success) {
    const data = result.data.list || [];
    return data;
  } else {
    throw ('error')
  }
}

export async function updateImageMarks(id: string, marks: IMark[]) {
  await shttp.put(`/api/images/${id}/marks`, {
    marks
  })
}

export async function createProjectLabel(data: { label: string, nth: number, projectId: string }) {
  const result = await shttp.post<ILabel>('/api/labels', data)
  if (result.success) {
    return result.data.info as ILabel
  }
  throw 'error'
}

export async function deleteLabel(id: string) {
  await shttp.delete(`/api/labels/${id}`)
}

export async function deleteImage(id: string) {
  await shttp.delete(`/api/images/${id}`)
}