import { IndustryTemplate, PrismaClient } from '@prisma/client';

export interface TemplateDepartmentDef {
  name: string;
  description: string;
}

export interface TemplateRoleDef {
  name: string;
  description: string;
  isSystem?: boolean;
}

export interface IndustryTemplateDefinition {
  industry: IndustryTemplate;
  label: string;
  description: string;
  defaultDepartments: TemplateDepartmentDef[];
  defaultRoles: TemplateRoleDef[];
}

export class IndustryTemplateService {
  private static templates: Record<IndustryTemplate, IndustryTemplateDefinition> = {
    [IndustryTemplate.CORPORATE]: {
      industry: IndustryTemplate.CORPORATE,
      label: 'Corporate & Enterprise',
      description: 'Standard enterprise hierarchy with Executive, HR, Finance, Engineering, and Legal divisions.',
      defaultDepartments: [
        { name: 'Executive Office', description: 'C-Suite leadership and strategic operations' },
        { name: 'Engineering & Product', description: 'Software engineering, architecture, and product management' },
        { name: 'Human Resources', description: 'Talent acquisition, employee relations, and HR policies' },
        { name: 'Finance & Accounting', description: 'Financial planning, payroll, and fiscal reporting' },
        { name: 'Legal & Compliance', description: 'Corporate governance, contracts, and regulatory compliance' }
      ],
      defaultRoles: [
        { name: 'Executive Admin', description: 'Full access to organization controls and documents', isSystem: true },
        { name: 'Department Head', description: 'Department-level management and access policy authority' },
        { name: 'Senior Engineer', description: 'Access to technical documentation and repositories' },
        { name: 'Staff Member', description: 'Standard organization member access' },
        { name: 'Auditor', description: 'Read-only access for compliance audit logs' }
      ]
    },
    [IndustryTemplate.HOSPITAL]: {
      industry: IndustryTemplate.HOSPITAL,
      label: 'Healthcare & Hospital',
      description: 'Strict HIPAA-compliant structures for Clinical Operations, Medical Records, Administration, and Pharmacy.',
      defaultDepartments: [
        { name: 'Clinical Operations', description: 'Direct patient care, nursing, and medical staff' },
        { name: 'Medical Records (HIM)', description: 'Health information management and patient records' },
        { name: 'Hospital Administration', description: 'Executive, billing, and facility management' },
        { name: 'Pharmacy & Therapeutics', description: 'Pharmaceutical management and medication protocols' }
      ],
      defaultRoles: [
        { name: 'Chief Medical Officer', description: 'Full executive and medical document clearance', isSystem: true },
        { name: 'Attending Physician', description: 'Access to clinical records and treatment guidelines' },
        { name: 'Registered Nurse', description: 'Access to operational care guidelines and shift notes' },
        { name: 'Compliance Officer', description: 'HIPAA auditor with access to security logs' }
      ]
    },
    [IndustryTemplate.LEGAL]: {
      industry: IndustryTemplate.LEGAL,
      label: 'Legal & Law Firm',
      description: 'Case and client-isolated structures for Litigation, Corporate Law, Paralegal Services, and Compliance.',
      defaultDepartments: [
        { name: 'Litigation Practice', description: 'Court filings, evidence, and dispute resolution' },
        { name: 'Corporate & M&A', description: 'Mergers, acquisitions, contracts, and filings' },
        { name: 'Paralegal Services', description: 'Case research, drafting, and document review' },
        { name: 'Ethics & Compliance', description: 'Professional responsibility and audit controls' }
      ],
      defaultRoles: [
        { name: 'Managing Partner', description: 'Full legal practice governance and policy admin', isSystem: true },
        { name: 'Senior Associate', description: 'Case management and confidential file access' },
        { name: 'Paralegal', description: 'Drafting research and document preparation' },
        { name: 'Client Auditor', description: 'Restricted external reviewer access' }
      ]
    },
    [IndustryTemplate.FINANCE]: {
      industry: IndustryTemplate.FINANCE,
      label: 'Financial Services',
      description: 'SOC2/FINRA-ready layout for Investment Banking, Risk Management, Trading, and Compliance.',
      defaultDepartments: [
        { name: 'Investment Banking', description: 'M&A advisory, capital markets, and deals' },
        { name: 'Risk Management', description: 'Credit risk, market risk, and quantitative modeling' },
        { name: 'Compliance & Regulatory', description: 'SEC/FINRA regulatory oversight and reporting' },
        { name: 'Internal Audit', description: 'Independent fiscal and operational auditing' }
      ],
      defaultRoles: [
        { name: 'Chief Risk Officer', description: 'Full financial oversight and compliance access', isSystem: true },
        { name: 'Portfolio Manager', description: 'Access to investment research and trading logs' },
        { name: 'Financial Analyst', description: 'Access to market analysis and reports' },
        { name: 'Compliance Officer', description: 'Audit trail and policy management access' }
      ]
    },
    [IndustryTemplate.EDUCATION]: {
      industry: IndustryTemplate.EDUCATION,
      label: 'Higher Education',
      description: 'Academic affairs, Research labs, Student records, and University Administration.',
      defaultDepartments: [
        { name: 'Academic Affairs', description: 'Faculty management, curriculum, and accreditation' },
        { name: 'Research Operations', description: 'Grant management, publications, and lab data' },
        { name: 'University Administration', description: 'Financial aid, admissions, and registrar' }
      ],
      defaultRoles: [
        { name: 'Dean / Administrator', description: 'Full university workspace administration', isSystem: true },
        { name: 'Faculty Member', description: 'Access to department documents and curriculum' },
        { name: 'Research Associate', description: 'Access to lab notes and research databases' }
      ]
    },
    [IndustryTemplate.GOVERNMENT]: {
      industry: IndustryTemplate.GOVERNMENT,
      label: 'Government & Public Sector',
      description: 'High-assurance clearance model for Defense, Public Affairs, Operations, and Auditing.',
      defaultDepartments: [
        { name: 'Defense & Operations', description: 'Operational directives and tactical manuals' },
        { name: 'Public Affairs', description: 'Unclassified announcements and press releases' },
        { name: 'Oversight & Inspection', description: 'Inspector general audit and compliance' }
      ],
      defaultRoles: [
        { name: 'Director General', description: 'Top secret clearance and governance', isSystem: true },
        { name: 'Security Officer', description: 'Access control and classification oversight' },
        { name: 'Analyst', description: 'Operational document review and intelligence' }
      ]
    },
    [IndustryTemplate.CUSTOM]: {
      industry: IndustryTemplate.CUSTOM,
      label: 'Custom Workspace',
      description: 'Minimal structure to customize from scratch.',
      defaultDepartments: [
        { name: 'General Operations', description: 'Primary organization operations department' }
      ],
      defaultRoles: [
        { name: 'Workspace Admin', description: 'Full administrative control', isSystem: true },
        { name: 'Workspace Member', description: 'Standard member access' }
      ]
    }
  };

  public static getTemplate(industry: IndustryTemplate): IndustryTemplateDefinition {
    return this.templates[industry] || this.templates[IndustryTemplate.CORPORATE];
  }

  public static listAllTemplates(): IndustryTemplateDefinition[] {
    return Object.values(this.templates);
  }

  public async applyTemplateToOrganization(
    prisma: PrismaClient | any,
    organizationId: string,
    industry: IndustryTemplate
  ): Promise<{ departments: any[]; roles: any[] }> {
    const template = IndustryTemplateService.getTemplate(industry);

    const createdDepartments: any[] = [];
    for (const deptDef of template.defaultDepartments) {
      const dept = await prisma.department.upsert({
        where: {
          organizationId_name: { organizationId, name: deptDef.name }
        },
        update: { description: deptDef.description },
        create: {
          organizationId,
          name: deptDef.name,
          description: deptDef.description
        }
      });
      createdDepartments.push(dept);
    }

    const createdRoles: any[] = [];
    for (const roleDef of template.defaultRoles) {
      const role = await prisma.role.upsert({
        where: {
          organizationId_name: { organizationId, name: roleDef.name }
        },
        update: { description: roleDef.description },
        create: {
          organizationId,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem || false
        }
      });
      createdRoles.push(role);
    }

    return { departments: createdDepartments, roles: createdRoles };
  }
}
