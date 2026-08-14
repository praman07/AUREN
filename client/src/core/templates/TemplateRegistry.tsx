import { 
  FileText, 
  Sparkles, 
  Building2, 
  Users, 
  BarChart3, 
  Stethoscope,
  ActivitySquare,
  Scale,
  Briefcase,
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
  brandName: 'AUREN Knowledge',
  brandAbbr: 'AU',
  navigation: [
    {
      title: 'Workspace',
      links: [
        { label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
        { label: 'AI Assistant', icon: Sparkles, href: '/chat' },
        { label: 'Knowledge', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Organization',
      links: [
        { label: 'Team', icon: Users, href: '/users' },
        { label: 'Access Control', icon: Building2, href: '/departments' },
        { label: 'Integrations & Settings', icon: Briefcase, href: '/settings' },
      ],
    }
  ]
};

export const HospitalTemplate: TemplateConfig = {
  industry: 'HOSPITAL',
  brandName: 'Clinical AUREN',
  brandAbbr: 'MED',
  navigation: [
    {
      title: 'Clinical Workspace',
      links: [
        { label: 'Dashboard', icon: ActivitySquare, href: '/dashboard' },
        { label: 'Clinical AI Assistant', icon: Stethoscope, href: '/chat' },
        { label: 'Medical Knowledge', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Organization',
      links: [
        { label: 'Clinical Team', icon: Users, href: '/users' },
        { label: 'Department Access', icon: Building2, href: '/departments' },
        { label: 'Integrations & Settings', icon: Briefcase, href: '/settings' },
      ],
    }
  ]
};

export const LegalTemplate: TemplateConfig = {
  industry: 'LEGAL',
  brandName: 'Legal AUREN',
  brandAbbr: 'LAW',
  navigation: [
    {
      title: 'Firm Workspace',
      links: [
        { label: 'Dashboard', icon: Scale, href: '/dashboard' },
        { label: 'Legal AI Assistant', icon: Gavel, href: '/chat' },
        { label: 'Case Knowledge', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Organization',
      links: [
        { label: 'Legal Team', icon: Users, href: '/users' },
        { label: 'Practice Areas', icon: Building2, href: '/departments' },
        { label: 'Integrations & Settings', icon: Briefcase, href: '/settings' },
      ],
    }
  ]
};

export const VCTemplate: TemplateConfig = {
  industry: 'VENTURE_CAPITAL',
  brandName: 'Deal AUREN',
  brandAbbr: 'VC',
  navigation: [
    {
      title: 'Fund Workspace',
      links: [
        { label: 'Dashboard', icon: PieChart, href: '/dashboard' },
        { label: 'Diligence AI Assistant', icon: Briefcase, href: '/chat' },
        { label: 'Fund Knowledge', icon: FileText, href: '/documents' },
      ],
    },
    {
      title: 'Organization',
      links: [
        { label: 'Investment Team', icon: Users, href: '/users' },
        { label: 'Access Control', icon: Building2, href: '/departments' },
        { label: 'Integrations & Settings', icon: Briefcase, href: '/settings' },
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
    return CorporateTemplate;
  }
  return TemplateRegistry[industry];
}
