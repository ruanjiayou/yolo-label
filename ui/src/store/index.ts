import { proxy, useSnapshot } from 'valtio'
import { App } from './app'
import { useRef } from 'react';

export type IProject = {
  id: string;
  title: string;
  dir: string;
  config: any;
  groups: string[];
  labels?: ILabel[];
}
export type ILabel = {
  id: string;
  nth: number;
  label: string;
}
export type IMark = {
  id: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
}
export type IImage = {
  id: string;
  path: string;
  marks: IMark[];
}

export function useLocalProxy<T extends object>(initialState: T) {
  // 保持 proxy 引用不变
  const ref = useRef(proxy(initialState))
  // 订阅变化 - 这会自动触发重新渲染
  const snap = useSnapshot(ref.current)
  return [snap, ref.current] as const;
}

const store = proxy<{
  app: typeof App,
  projects: IProject[],
  showXline: boolean,
}>({
  app: App,
  projects: [],
  showXline: false,
});

export default store;