import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Project } from "./pages/Project.tsx";
import NotFound from './pages/NotFound.tsx';
import Home from './pages/Home.tsx';

export function App() {
  return (
    <div style={{ margin: 0, padding: 0, boxSizing: "border-box" }}>
      <BrowserRouter>
        <Routes>
          {/* 默认首页 */}
          <Route path="/" element={<Home />} />

          {/* 项目详情页 */}
          <Route path="/project/:id" element={<Project />} />

          {/* 404 - 匹配所有未定义的路由 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}