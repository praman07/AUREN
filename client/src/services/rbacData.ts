import type { DepartmentMember } from '../types';


export const DEFAULT_DEPARTMENTS = [
  'Core Architecture',
  'Platform Engineering',
  'Security & Compliance',
  'Product & Design',
  'QA & Infrastructure',
];

export const INITIAL_SUBFIELDS = [
  'Platform Core',
  'Edge Inference & Runtime',
  'Compiler Architecture',
  'Zero-Knowledge Proofs',
  'Security Auditing & Hardening',
  'Data Pipelines & Streaming',
  'Vector Indexing (Qdrant)',
];

export const INTERN_DOMAINS = [
  'Distributed Systems',
  'Frontend & UI',
  'AI & ML Inference',
  'Database Security',
  'DevOps & Cloud',
  'Network & WebSockets',
];

export const INITIAL_MEMBERS: DepartmentMember[] = [
  {
    id: 'usr_praman_101',
    name: 'Praman Singh Bhogal',
    email: 'praman@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Core Architecture',
    departments: ['Core Architecture', 'Platform Engineering', 'Security & Compliance'],
    subgroup: 'senior',
    domain: 'Distributed Systems',
    subfields: ['Platform Core', 'Compiler Architecture'],
    title: 'Head of Architecture & Engineering',
    joinedAt: 'Jan 2024',
    status: 'active',
    clearanceLevel: 'L5_Principal',
    assignedProjects: ['auren-core', 'qdrant-vault', 'retrieval-service'],
  },
  {
    id: 'usr_elena_202',
    name: 'Elena Rostova',
    email: 'elena.r@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Core Architecture',
    departments: ['Core Architecture', 'Security & Compliance'],
    subgroup: 'senior',
    domain: 'Security Auditing & Hardening',
    subfields: ['Zero-Knowledge Proofs', 'Platform Core'],
    title: 'Principal Systems Architect',
    joinedAt: 'Mar 2024',
    status: 'active',
    clearanceLevel: 'L5_Principal',
    assignedProjects: ['zero-trust-layer', 'policy-engine'],
  },
  {
    id: 'usr_marcus_203',
    name: 'Marcus Vance',
    email: 'marcus.v@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Platform Engineering',
    departments: ['Platform Engineering', 'Core Architecture'],
    subgroup: 'mid_senior',
    domain: 'DevOps & Cloud',
    subfields: ['Platform Core', 'Data Pipelines & Streaming'],
    title: 'Senior Infrastructure Engineer',
    joinedAt: 'Jun 2024',
    status: 'active',
    clearanceLevel: 'L4_Senior',
    assignedProjects: ['cloud-run-deployment', 'nginx-proxy'],
  },
  {
    id: 'usr_chloe_204',
    name: 'Chloe Zhang',
    email: 'chloe.z@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'Platform Engineering',
    departments: ['Platform Engineering'],
    subgroup: 'junior',
    domain: 'Frontend & UI',
    subfields: ['Platform Core'],
    title: 'Junior Backend Developer',
    joinedAt: 'Nov 2024',
    status: 'active',
    clearanceLevel: 'L3_Junior',
    assignedProjects: ['webhook-receiver', 'connector-telemetry'],
  },
  {
    id: 'usr_aarav_205',
    name: 'Aarav Patel',
    email: 'aarav.p@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Security & Compliance',
    departments: ['Security & Compliance', 'QA & Infrastructure'],
    subgroup: 'senior',
    domain: 'Database Security',
    subfields: ['Security Auditing & Hardening', 'Zero-Knowledge Proofs'],
    title: 'Lead Security Auditor',
    joinedAt: 'Feb 2024',
    status: 'active',
    clearanceLevel: 'L5_Principal',
    assignedProjects: ['vault-encryption', 'soc2-compliance'],
  },
  {
    id: 'usr_maya_206',
    name: 'Maya Lin',
    email: 'maya.l@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    department: 'Product & Design',
    departments: ['Product & Design', 'Platform Engineering'],
    subgroup: 'mid_senior',
    domain: 'Frontend & UI',
    subfields: ['Platform Core'],
    title: 'Senior Product Designer',
    joinedAt: 'Apr 2024',
    status: 'active',
    clearanceLevel: 'L4_Senior',
    assignedProjects: ['design-system', 'workspace-ux'],
  },
  {
    id: 'usr_liam_207',
    name: 'Liam O’Connor',
    email: 'liam.o@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    department: 'QA & Infrastructure',
    departments: ['QA & Infrastructure', 'Platform Engineering'],
    subgroup: 'intern',
    domain: 'Distributed Systems',
    subfields: ['Data Pipelines & Streaming'],
    title: 'Engineering Intern (Distributed Testing)',
    joinedAt: 'Jan 2026',
    status: 'active',
    clearanceLevel: 'L2_Intern',
    assignedProjects: ['e2e-testing', 'load-runner'],
  },
  {
    id: 'usr_ananya_209',
    name: 'Ananya Roy',
    email: 'ananya.r@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    department: 'Core Architecture',
    departments: ['Core Architecture'],
    subgroup: 'intern',
    domain: 'AI & ML Inference',
    subfields: ['Edge Inference & Runtime'],
    title: 'Research Intern (VLM & Quantization)',
    joinedAt: 'Feb 2026',
    status: 'active',
    clearanceLevel: 'L2_Intern',
    assignedProjects: ['vlm-quantization', 'speculative-decoding'],
  },
  {
    id: 'usr_tariq_208',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.m@corp.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    department: 'Platform Engineering',
    departments: ['Platform Engineering'],
    subgroup: 'trainee',
    domain: 'DevOps & Cloud',
    subfields: ['Platform Core'],
    title: 'Engineering Trainee',
    joinedAt: 'Feb 2026',
    status: 'active',
    clearanceLevel: 'L1_Trainee',
    assignedProjects: ['developer-onboarding'],
  },
];

const STORAGE_KEY_SUBFIELDS = 'auren_dept_subfields';
const STORAGE_KEY_MEMBERS = 'auren_dept_members';

export function getStoredSubfields(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBFIELDS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_SUBFIELDS;
}

export function saveStoredSubfields(subfields: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBFIELDS, JSON.stringify(subfields));
  } catch {}
}

export function getStoredMembers(): DepartmentMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_MEMBERS;
}

export function saveStoredMembers(members: DepartmentMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  } catch {}
}
