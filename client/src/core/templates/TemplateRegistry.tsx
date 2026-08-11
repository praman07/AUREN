import { 
  FileText, 
  Sparkles, 
  Building2, 
  Users, 
  BarChart3, 
  ShieldAlert, 
  Activity,
  Search,
  Stethoscope,
  ActivitySquare,
  Scale,
  Briefcase,
  BrainCircuit,
  Database,
  Gavel,
  PieChart
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavLinkConfig {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface NavSectionConfig {
  title: string;
  links: NavLinkConfig[];
}

export interface TemplateConfig {
  industry: string;
  brandName: string;
  brandAbbr: string;
  navigation: NavSectionConfig[];
}

export const CorporateTemplate: TemplateConfig = {
  industry: 'CORPORATE',
  brandName: 'Knowledge OS',
  brandAbbr: 'EK',
  navigation: [
    {
      title: 'Knowledge',
      links: [
        { label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
        { label: 'Semantic Search', icon: Search, href: '/search' },
        { label: 'Conversations', icon: Sparkles, href: '/chat' },
        { label: 'Memory Console', icon: BrainCircuit, href: '/memory' },
        { label: 'Documents', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Administration',
      links: [
        { label: 'Users', icon: Users, href: '/users' },
        { label: 'Departments', icon: Building2, href: '/departments' },
        { label: 'Audit Logs', icon: ShieldAlert, href: '/audit-logs' },
        { label: 'Processing Jobs', icon: Activity, href: '/jobs' },
      ],
    }
  ]
};

export const HospitalTemplate: TemplateConfig = {
  industry: 'HOSPITAL',
  brandName: 'Clinical OS',
  brandAbbr: 'MED',
  navigation: [
    {
      title: 'Clinical Knowledge',
      links: [
        { label: 'Hospital Dashboard', icon: ActivitySquare, href: '/dashboard' },
        { label: 'Medical Search', icon: Search, href: '/search' },
        { label: 'AI Assistant', icon: Stethoscope, href: '/chat' },
        { label: 'Memory Console', icon: BrainCircuit, href: '/memory' },
        { label: 'Protocols & SOPs', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Hospital Admin',
      links: [
        { label: 'Staff', icon: Users, href: '/users' },
        { label: 'Wards / Depts', icon: Building2, href: '/departments' },
        { label: 'Compliance Logs', icon: ShieldAlert, href: '/audit-logs' },
        { label: 'System Jobs', icon: Activity, href: '/jobs' },
      ],
    }
  ]
};

export const LegalTemplate: TemplateConfig = {
  industry: 'LEGAL',
  brandName: 'Legal OS',
  brandAbbr: 'LAW',
  navigation: [
    {
      title: 'Firm Knowledge',
      links: [
        { label: 'Firm Dashboard', icon: Scale, href: '/dashboard' },
        { label: 'Case Search', icon: Search, href: '/search' },
        { label: 'Legal Assistant', icon: Gavel, href: '/chat' },
        { label: 'Memory Console', icon: BrainCircuit, href: '/memory' },
        { label: 'Client Files', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Firm Admin',
      links: [
        { label: 'Partners & Staff', icon: Users, href: '/users' },
        { label: 'Practice Areas', icon: Building2, href: '/departments' },
        { label: 'Compliance Logs', icon: ShieldAlert, href: '/audit-logs' },
        { label: 'System Jobs', icon: Activity, href: '/jobs' },
      ],
    }
  ]
};

export const VCTemplate: TemplateConfig = {
  industry: 'VENTURE_CAPITAL',
  brandName: 'Deal OS',
  brandAbbr: 'VC',
  navigation: [
    {
      title: 'Deal Flow',
      links: [
        { label: 'Deal Dashboard', icon: PieChart, href: '/dashboard' },
        { label: 'Deal Search', icon: Search, href: '/search' },
        { label: 'Diligence Assistant', icon: Briefcase, href: '/chat' },
        { label: 'Memory Console', icon: BrainCircuit, href: '/memory' },
        { label: 'Pitch Decks', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Fund Admin',
      links: [
        { label: 'Team', icon: Users, href: '/users' },
        { label: 'Funds & Entities', icon: Building2, href: '/departments' },
        { label: 'Audit Logs', icon: ShieldAlert, href: '/audit-logs' },
        { label: 'System Jobs', icon: Activity, href: '/jobs' },
      ],
    }
  ]
};

export const TemplateRegistry: Record<string, TemplateConfig> = {
  'CORPORATE': CorporateTemplate,
  'HOSPITAL': HospitalTemplate,
  'LEGAL': LegalTemplate,
  'VENTURE_CAPITAL': VCTemplate,
};

export function getTemplateConfig(industry?: string): TemplateConfig {
  if (!industry || !TemplateRegistry[industry]) {
    return CorporateTemplate; // Fallback
  }
  return TemplateRegistry[industry];
}
