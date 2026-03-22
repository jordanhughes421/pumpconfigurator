import { useState } from 'react';
import { useConfigurationStore, type ConfigurationData, type ValidationResult } from '../stores/configurationStore';

const SEAL_TYPE_LABELS: Record<string, string> = {
  single_mechanical: 'Single Mechanical',
  dual_mechanical: 'Dual Mechanical',
  tandem_mechanical: 'Tandem Mechanical',
  cartridge_single: 'Cartridge Single',
  cartridge_dual: 'Cartridge Dual',
  packed: 'Packed',
  dynamic_expeller: 'Dynamic / Expeller',
};

const FACE_MATERIAL_LABELS: Record<string, string> = {
  SiC_sintered: 'SiC Sintered',
  SiC_reaction_bonded: 'SiC Reaction Bonded',
  carbon_resin: 'Carbon (Resin)',
  carbon_antimony: 'Carbon (Antimony)',
  tungsten_carbide_co: 'WC (Co)',
  tungsten_carbide_ni: 'WC (Ni)',
  alumina: 'Alumina',
};

const ELASTOMER_LABELS: Record<string, string> = {
  FKM_A: 'FKM Type A',
  FKM_B: 'FKM Type B',
  EPDM: 'EPDM',
  NBR: 'NBR',
  FFKM: 'FFKM',
  PTFE: 'PTFE',
};

const COUPLING_LABELS: Record<string, string> = {
  flexible_jaw: 'Flexible Jaw',
  flexible_disc: 'Flexible Disc',
  flexible_grid: 'Flexible Grid',
  flexible_gear: 'Flexible Gear',
  rigid_flange: 'Rigid Flange',
  rigid_sleeve: 'Rigid Sleeve',
  magnetic: 'Magnetic Drive',
  spacer: 'Spacer',
};

interface Props {
  config: ConfigurationData;
}

export function ComplianceTab({ config }: Props) {
  const { validate, validation: storeValidation } = useConfigurationStore();
  const [validation, setValidation] = useState<ValidationResult | null>(storeValidation);
  const [running, setRunning] = useState(false);

  const handleValidate = async () => {
    setRunning(true);
    try {
      const result = await validate(config.id);
      setValidation(result);
    } finally {
      setRunning(false);
    }
  };

  const isMechSeal = !!config.sealType && config.sealType !== 'packed' && config.sealType !== 'dynamic_expeller';

  const statusColor = (status: string) => ({
    valid: 'bg-green-900/50 text-green-400 border-green-700',
    warning: 'bg-amber-900/50 text-amber-400 border-amber-700',
    invalid: 'bg-red-900/50 text-red-400 border-red-700',
  }[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700');

  // Group messages by tier
  const grouped = validation?.messages.reduce((acc, m) => {
    (acc[m.tier] ??= []).push(m);
    return acc;
  }, {} as Record<string, typeof validation.messages>) ?? {};

  const tiers = [
    { key: 'hard_block', summaryKey: 'hard_blocks', label: 'Hard Blocks', icon: '\uD83D\uDD34', desc: 'Must fix before proceeding' },
    { key: 'cert_block', summaryKey: 'cert_blocks', label: 'Certification Blocks', icon: '\uD83D\uDFE0', desc: 'Certification violation' },
    { key: 'warning', summaryKey: 'warnings', label: 'Warnings', icon: '\uD83D\uDFE1', desc: 'Should review' },
    { key: 'advisory', summaryKey: 'advisories', label: 'Advisories', icon: '\uD83D\uDD35', desc: 'Informational' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Section 1: Overall Status */}
      <div className="flex items-center gap-4">
        {validation && (
          <span className={`px-4 py-2 text-lg font-semibold rounded border ${statusColor(validation.status)}`}>
            {validation.status.toUpperCase()}
          </span>
        )}
        <button
          onClick={handleValidate}
          disabled={running}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {running ? 'Validating...' : 'Run Full Validation'}
        </button>
      </div>

      {validation && (
        <>
          {/* Section 2: Summary counts */}
          <div className="grid grid-cols-4 gap-3">
            {tiers.map(t => (
              <div key={t.key} className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 text-center">
                <div className="text-2xl font-mono">{validation.summary[t.summaryKey as keyof typeof validation.summary] ?? 0}</div>
                <div className="text-xs text-zinc-400 mt-1">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Section 3: Messages by tier */}
          <div className="space-y-4">
            {tiers.map(t => {
              const msgs = grouped[t.key];
              if (!msgs || msgs.length === 0) return null;
              return (
                <div key={t.key}>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">{t.icon} {t.label}</h4>
                  <div className="space-y-1">
                    {msgs.map((m, i) => (
                      <div key={i} className={`px-3 py-2 rounded text-sm ${tierBg(t.key)}`}>
                        <span className="font-medium font-mono">{m.code}</span>
                        {m.component_key && (
                          <span className="text-zinc-400 ml-2">[{m.component_key}]</span>
                        )}
                        <span className="ml-2">{m.message}</span>
                        {m.suggestion && (
                          <span className="block text-xs text-zinc-400 mt-0.5 ml-4">{m.suggestion}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {validation.messages.length === 0 && (
            <p className="text-green-400 text-sm">All validations passed. Configuration is compliant.</p>
          )}

          {/* Section 4: Configuration Summary */}
          <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <SummaryRow label="Pump" value={`${config.pumpSize.model.modelCode} ${config.pumpSize.sizeDesignation}`} />
              <SummaryRow label="HI Type" value={config.pumpSize.model.family.hiTypeCode} />
              <SummaryRow label="Duty Flow" value={`${config.dutyFlowM3h} m\u00B3/h`} />
              <SummaryRow label="Duty Head" value={`${config.dutyHeadM} m`} />
              <SummaryRow label="NPSH Available" value={`${config.npshaM} m`} />
              <SummaryRow label="Impeller Trim" value={config.impellerTrimMm ? `${config.impellerTrimMm} mm` : '--'} />
              <SummaryRow label="Speed" value={config.speedRpm ? `${config.speedRpm} rpm` : '--'} />
              <SummaryRow label="Stages" value={String(config.numStages)} />
              <SummaryRow label="Tag" value={config.tagNumber || '--'} />
              <SummaryRow label="Service" value={config.service || '--'} />
              <SummaryRow label="Seal Type" value={config.sealType ? (SEAL_TYPE_LABELS[config.sealType] || config.sealType) : '--'} />
              {isMechSeal && <SummaryRow label="Seal Plan" value={config.sealPlan ? `Plan ${config.sealPlan}` : '--'} />}
              {isMechSeal && <SummaryRow label="Face Material" value={config.sealFaceMaterial ? (FACE_MATERIAL_LABELS[config.sealFaceMaterial] || config.sealFaceMaterial) : '--'} />}
              {isMechSeal && <SummaryRow label="Elastomer" value={config.sealElastomer ? (ELASTOMER_LABELS[config.sealElastomer] || config.sealElastomer) : '--'} />}
              <SummaryRow label="Coupling" value={config.couplingType ? (COUPLING_LABELS[config.couplingType] || config.couplingType) : '--'} />
              <SummaryRow label="Motor" value={config.motor?.modelNumber || '--'} />
              <SummaryRow label="Baseplate" value={config.baseplate?.type?.replace(/_/g, ' ') || '--'} />
            </div>

            {config.materialSelections.length > 0 && (
              <div className="mt-4">
                <h5 className="text-xs text-zinc-400 mb-2">Material Selections</h5>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {config.materialSelections.map(ms => {
                    let label = ms.componentKey.replace(/_/g, ' ');
                    if (ms.componentKey === 'mechanical_seal') {
                      if (config.sealType === 'packed') label = 'packing';
                      else if (config.sealType === 'dynamic_expeller') label = 'dynamic seal / expeller';
                    }
                    return (
                      <div key={ms.componentKey} className="flex justify-between py-0.5">
                        <span className="text-zinc-400">{label}</span>
                        <span className="text-zinc-300 font-mono">{ms.material.commonName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-100 font-mono">{value}</span>
    </div>
  );
}

function tierBg(tier: string) {
  return {
    hard_block: 'bg-red-900/20 text-red-300',
    cert_block: 'bg-amber-900/20 text-amber-300',
    warning: 'bg-yellow-900/20 text-yellow-300',
    advisory: 'bg-blue-900/20 text-blue-300',
  }[tier] || 'bg-zinc-800 text-zinc-300';
}
