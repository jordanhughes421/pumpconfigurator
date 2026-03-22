import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useConfigurationStore } from '../stores/configurationStore';
import { CertificationBar } from '../components/CertificationBar';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject, loading, fetchProject } = useProjectStore();
  const { deleteConfiguration } = useConfigurationStore();
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent, configId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this configuration?')) return;
    await deleteConfiguration(configId);
    if (projectId) fetchProject(projectId);
  };

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  if (loading || !activeProject) {
    return <p className="text-zinc-500 text-sm">Loading project...</p>;
  }

  const configs = activeProject.configurations || [];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link to="/" className="hover:text-zinc-300">Projects</Link>
        <span>/</span>
        <span className="text-zinc-100">{activeProject.name}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">{activeProject.name}</h2>
        <button
          onClick={() => navigate(`/projects/${projectId}/select`)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500 transition-colors"
        >
          Add Pump
        </button>
      </div>

      <CertificationBar
        projectId={projectId!}
        activeCerts={activeProject.certifications}
      />

      <h3 className="text-sm font-medium text-zinc-400 mt-6 mb-3">Configurations ({configs.length})</h3>

      {configs.length === 0 ? (
        <p className="text-zinc-500 text-sm">No configurations yet. Click "Add Pump" to search and select a pump.</p>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800">
                <th className="text-left px-4 py-2 text-zinc-400 font-medium">Tag</th>
                <th className="text-left px-4 py-2 text-zinc-400 font-medium">Service</th>
                <th className="text-left px-4 py-2 text-zinc-400 font-medium">Pump</th>
                <th className="text-left px-4 py-2 text-zinc-400 font-medium">Type</th>
                <th className="text-left px-4 py-2 text-zinc-400 font-medium">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {configs.map(c => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/projects/${projectId}/configure/${c.id}`)}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-zinc-100">{c.tagNumber || '--'}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.service || '--'}</td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.pumpSize.sizeDesignation}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.pumpSize.model.family.hiTypeCode}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.validationStatus} />
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={e => handleDelete(e, c.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      title="Delete configuration"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    valid: 'bg-green-900/50 text-green-400 border-green-800',
    warning: 'bg-amber-900/50 text-amber-400 border-amber-800',
    invalid: 'bg-red-900/50 text-red-400 border-red-800',
    pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}
