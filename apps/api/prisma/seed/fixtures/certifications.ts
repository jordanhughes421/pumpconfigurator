import { Prisma } from '@prisma/client';

export const certifications: Prisma.CertificationCreateInput[] = [
  { code: 'NSF61', fullName: 'NSF/ANSI 61 — Drinking Water Components', category: 'potable_water', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'NSF372', fullName: 'NSF/ANSI 372 — Lead Content', category: 'potable_water', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false, mutualRequirements: 'NSF61' },
  { code: 'BABA', fullName: 'Build America, Buy America Act', category: 'sourcing', isMaterialConstraining: false, isSourcingConstraining: true, isDocumentationOnly: false },
  { code: 'FM', fullName: 'FM Approved — FM 1319', category: 'fire', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'UL448', fullName: 'UL Listed — UL 448', category: 'fire', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'API610', fullName: 'API 610 12th Ed.', category: 'industry', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'NFPA20', fullName: 'NFPA 20 — Fire Pumps', category: 'fire', isMaterialConstraining: false, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'ATEX', fullName: 'ATEX / IECEx', category: 'hazardous', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'CRN', fullName: 'Canadian Registration Number', category: 'pressure', isMaterialConstraining: false, isSourcingConstraining: false, isDocumentationOnly: true },
  { code: 'CE_PED', fullName: 'CE / Pressure Equipment Directive', category: 'pressure', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'WRAS', fullName: 'Water Regulations Advisory Scheme', category: 'potable_water', isMaterialConstraining: true, isSourcingConstraining: false, isDocumentationOnly: false },
  { code: 'CMTR_31', fullName: 'CMTR EN 10204 Type 3.1', category: 'documentation', isMaterialConstraining: false, isSourcingConstraining: false, isDocumentationOnly: true },
  { code: 'CMTR_32', fullName: 'CMTR EN 10204 Type 3.2', category: 'documentation', isMaterialConstraining: false, isSourcingConstraining: false, isDocumentationOnly: true },
  { code: 'PMI', fullName: 'Positive Material Identification', category: 'documentation', isMaterialConstraining: false, isSourcingConstraining: false, isDocumentationOnly: true },
];
