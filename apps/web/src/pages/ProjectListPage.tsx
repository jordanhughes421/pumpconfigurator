import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { CERTIFICATION_CODES, type CertificationCode } from '@magnum-opus/shared';

export function ProjectListPage() {
  const { projects, loading, fetchProjects, createProject } = useProjectStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [selectedCerts, setSelectedCerts] = useState<CertificationCode[]>([]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject(name.trim(), selectedCerts);
    setShowCreate(false);
    setName('');
    setSelectedCerts([]);
    navigate(`/projects/${project.id}`);
  };

  const toggleCert = (code: CertificationCode) => {
    setSelectedCerts(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Projects</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500 transition-colors"
        >
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 border border-zinc-700 rounded-lg bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Create Project</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 mb-3 focus:outline-none focus:border-blue-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className="mb-3">
            <label className="text-xs text-zinc-400 mb-1 block">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATION_CODES.map(code => (
                <button
                  key={code}
                  onClick={() => toggleCert(code)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedCerts.includes(code)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded hover:bg-zinc-700">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-zinc-500 text-sm">No projects yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-3">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="text-left p-4 border border-zinc-800 rounded-lg bg-zinc-900 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-100">{p.name}</span>
                <span className="text-xs text-zinc-500 font-mono">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              {p.certifications.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {p.certifications.map(c => (
                    <span key={c} className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
