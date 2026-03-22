// Certification-lubrication constraint rules per M0 spec §9

export const lubricationRules = [
  {
    ruleType: 'lubrication_constraint',
    parameterName: 'lubrication_type',
    condition: { certification: 'API610' },
    action: { restrict_to: ['oil_ring', 'oil_bath', 'forced_oil'] },
    description: 'API 610 requires oil lubrication for process pumps',
  },
  {
    ruleType: 'lubrication_constraint',
    parameterName: 'lubrication_type',
    condition: { certification: 'FM' },
    action: { restrict_to: ['grease', 'oil_ring', 'oil_bath'] },
    description: 'FM listed pumps typically use standard lubrication',
  },
];
