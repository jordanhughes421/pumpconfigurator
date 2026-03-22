import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ProjectListPage } from './pages/ProjectListPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SelectionPage } from './pages/SelectionPage';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import { GeometryDashboard } from './pages/GeometryDashboard';
import { ModelGeometryPage } from './pages/ModelGeometryPage';
import { ImpellerDetailPage } from './pages/ImpellerDetailPage';
import { VoluteDetailPage } from './pages/VoluteDetailPage';
import { CorrelationsPage } from './pages/CorrelationsPage';

export default function App() {
  const location = useLocation();
  const isGeometry = location.pathname.startsWith('/geometry');

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 flex items-center gap-4">
        <Link to="/" className="text-lg font-semibold text-zinc-100 tracking-tight hover:text-white">
          Magnum Opus
        </Link>
        <span className="text-xs text-zinc-500 font-mono">Pump Configurator</span>
        <nav className="ml-auto flex gap-3 text-sm">
          <Link
            to="/"
            className={`px-2 py-1 rounded ${!isGeometry ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Projects
          </Link>
          <Link
            to="/geometry"
            className={`px-2 py-1 rounded ${isGeometry ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Geometry
          </Link>
        </nav>
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<ProjectListPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/select" element={<SelectionPage />} />
          <Route path="/projects/:projectId/configure/:configId" element={<ConfiguratorPage />} />
          <Route path="/geometry" element={<GeometryDashboard />} />
          <Route path="/geometry/models/:modelId" element={<ModelGeometryPage />} />
          <Route path="/geometry/impellers/:impellerId" element={<ImpellerDetailPage />} />
          <Route path="/geometry/volutes/:voluteId" element={<VoluteDetailPage />} />
          <Route path="/geometry/correlations" element={<CorrelationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
