import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConfigurationStore } from '../stores/configurationStore';
import { useProjectStore } from '../stores/projectStore';
import { CertificationBar } from '../components/CertificationBar';
import { HydraulicTab } from '../components/HydraulicTab';
import { MaterialsTab } from '../components/MaterialsTab';
import { MotorTab } from '../components/MotorTab';
import { BaseplateTab } from '../components/BaseplateTab';
import { ComplianceTab } from '../components/ComplianceTab';

const TABS = ['Hydraulic', 'Materials', 'Motor', 'Baseplate', 'Compliance'] as const;
type TabName = typeof TABS[number];

export function ConfiguratorPage() {
  const { projectId, configId } = useParams<{ projectId: string; configId: string }>();
  const { config, loading, fetchConfiguration, updateConfiguration, saving } = useConfigurationStore();
  const { activeProject, fetchProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<TabName>('Hydraulic');

  useEffect(() => {
    if (configId) fetchConfiguration(configId);
    if (projectId && !activeProject) fetchProject(projectId);
  }, [configId, projectId, fetchConfiguration, fetchProject, activeProject]);

  if (loading || !config) {
    return <p className="text-zinc-500 text-sm">Loading configuration...</p>;
  }

  const ps = config.pumpSize;
  const modelCode = ps.model.modelCode;
  const hiType = ps.model.family.hiTypeCode;
  const certs = activeProject?.certifications || [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link to="/" className="hover:text-zinc-300">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}`} className="hover:text-zinc-300">{activeProject?.name || '...'}</Link>
        <span>/</span>
        <span className="text-zinc-100">Configure</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-lg font-semibold text-zinc-100 font-mono">{modelCode}</span>
        <span className="text-sm text-zinc-400 font-mono">{ps.sizeDesignation}</span>
        <span className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded border border-zinc-700">{hiType}</span>
        <span className="text-zinc-600">|</span>
        <EditableField
          value={config.tagNumber || ''}
          placeholder="Tag #"
          onSave={v => updateConfiguration(configId!, { tag_number: v })}
        />
        <EditableField
          value={config.service || ''}
          placeholder="Service"
          onSave={v => updateConfiguration(configId!, { service: v })}
        />
        {saving && <span className="text-xs text-zinc-500">saving...</span>}
      </div>

      {/* Certification bar */}
      <CertificationBar projectId={projectId!} activeCerts={certs} />

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 mt-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'Hydraulic' && <HydraulicTab config={config} />}
        {activeTab === 'Materials' && <MaterialsTab config={config} certs={certs} />}
        {activeTab === 'Motor' && <MotorTab config={config} certs={certs} />}
        {activeTab === 'Baseplate' && <BaseplateTab config={config} certs={certs} />}
        {activeTab === 'Compliance' && <ComplianceTab config={config} />}
      </div>
    </div>
  );
}

function EditableField({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  if (!editing) {
    return (
      <button
        onClick={() => { setText(value); setEditing(true); }}
        className="text-sm text-zinc-400 hover:text-zinc-200 font-mono"
      >
        {value || <span className="italic text-zinc-600">{placeholder}</span>}
      </button>
    );
  }

  return (
    <input
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={() => { onSave(text); setEditing(false); }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(text); setEditing(false); } }}
      placeholder={placeholder}
      className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
      autoFocus
    />
  );
}
