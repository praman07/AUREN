import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldCheck, Layers, ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../core/auth/store/useAuthStore';

export interface IndustryTemplate {
  industry: string;
  label: string;
  description: string;
  defaultDepartments: { name: string; description: string }[];
  defaultRoles: { name: string; description: string }[];
}

const DEFAULT_TEMPLATES: IndustryTemplate[] = [
  {
    industry: 'CORPORATE',
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
      { name: 'Executive Admin', description: 'Full access to organization controls and documents' },
      { name: 'Department Head', description: 'Department-level management and access policy authority' },
      { name: 'Senior Engineer', description: 'Access to technical documentation and repositories' },
      { name: 'Staff Member', description: 'Standard organization member access' }
    ]
  },
  {
    industry: 'HOSPITAL',
    label: 'Healthcare & Hospital',
    description: 'Strict HIPAA-compliant structures for Clinical Operations, Medical Records, Administration, and Pharmacy.',
    defaultDepartments: [
      { name: 'Clinical Operations', description: 'Direct patient care, nursing, and medical staff' },
      { name: 'Medical Records (HIM)', description: 'Health information management and patient records' },
      { name: 'Hospital Administration', description: 'Executive, billing, and facility management' },
      { name: 'Pharmacy & Therapeutics', description: 'Pharmaceutical management and medication protocols' }
    ],
    defaultRoles: [
      { name: 'Chief Medical Officer', description: 'Full executive and medical document clearance' },
      { name: 'Attending Physician', description: 'Access to clinical records and treatment guidelines' },
      { name: 'Registered Nurse', description: 'Access to operational care guidelines and shift notes' }
    ]
  },
  {
    industry: 'LEGAL',
    label: 'Legal & Law Firm',
    description: 'Case and client-isolated structures for Litigation, Corporate Law, Paralegal Services, and Compliance.',
    defaultDepartments: [
      { name: 'Litigation Practice', description: 'Court filings, evidence, and dispute resolution' },
      { name: 'Corporate & M&A', description: 'Mergers, acquisitions, contracts, and filings' },
      { name: 'Paralegal Services', description: 'Case research, drafting, and document review' }
    ],
    defaultRoles: [
      { name: 'Managing Partner', description: 'Full legal practice governance and policy admin' },
      { name: 'Senior Associate', description: 'Case management and confidential file access' },
      { name: 'Paralegal', description: 'Drafting research and document preparation' }
    ]
  },
  {
    industry: 'FINANCE',
    label: 'Financial Services',
    description: 'SOC2/FINRA-ready layout for Investment Banking, Risk Management, Trading, and Compliance.',
    defaultDepartments: [
      { name: 'Investment Banking', description: 'M&A advisory, capital markets, and deals' },
      { name: 'Risk Management', description: 'Credit risk, market risk, and quantitative modeling' },
      { name: 'Compliance & Regulatory', description: 'SEC/FINRA regulatory oversight and reporting' }
    ],
    defaultRoles: [
      { name: 'Chief Risk Officer', description: 'Full financial oversight and compliance access' },
      { name: 'Portfolio Manager', description: 'Access to investment research and trading logs' },
      { name: 'Financial Analyst', description: 'Access to market analysis and reports' }
    ]
  },
  {
    industry: 'EDUCATION',
    label: 'Higher Education',
    description: 'Academic affairs, Research labs, Student records, and University Administration.',
    defaultDepartments: [
      { name: 'Academic Affairs', description: 'Faculty management, curriculum, and accreditation' },
      { name: 'Research Operations', description: 'Grant management, publications, and lab data' }
    ],
    defaultRoles: [
      { name: 'Dean / Administrator', description: 'Full university workspace administration' },
      { name: 'Faculty Member', description: 'Access to department documents and curriculum' }
    ]
  },
  {
    industry: 'GOVERNMENT',
    label: 'Government & Public Sector',
    description: 'High-assurance clearance model for Defense, Public Affairs, Operations, and Auditing.',
    defaultDepartments: [
      { name: 'Defense & Operations', description: 'Operational directives and tactical manuals' },
      { name: 'Public Affairs', description: 'Unclassified announcements and press releases' }
    ],
    defaultRoles: [
      { name: 'Director General', description: 'Top secret clearance and governance' },
      { name: 'Security Officer', description: 'Access control and classification oversight' }
    ]
  }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form state
  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('CORPORATE');
  const [templates, setTemplates] = useState<IndustryTemplate[]>(DEFAULT_TEMPLATES);

  // Super Admin state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');

  // Custom departments & roles
  const [customDeptsInput, setCustomDeptsInput] = useState('');
  const [customRolesInput] = useState('');

  // Initial Members
  const [membersText, setMembersText] = useState('');

  useEffect(() => {
    fetch('/api/v1/onboarding/templates')
      .then(async res => {
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setTemplates(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const activeTemplate = templates.find(t => t.industry === selectedIndustry) || templates[0];

  const handleCompleteOnboarding = async () => {
    setError('');
    setLoading(true);

    try {
      const customDepartments = customDeptsInput.split('\n').map((s: string) => s.trim()).filter(Boolean);
      const customRoles = customRolesInput.split('\n').map((s: string) => s.trim()).filter(Boolean);

      const initialMembers = membersText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(email => ({ email }));

      const response = await fetch('/api/v1/onboarding/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          domain: domain ? domain : undefined,
          industry: selectedIndustry,
          superAdmin: {
            email: adminEmail,
            password: adminPassword,
            firstName: adminFirstName,
            lastName: adminLastName,
          },
          customDepartments,
          customRoles,
          initialMembers,
        }),
      });

      const resText = await response.text();
      let json: any = {};
      try {
        json = resText ? JSON.parse(resText) : {};
      } catch {
        json = {};
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete workspace onboarding.');
      }

      if (json.data?.superAdmin) {
        const token = json.data.session?.token;
        setAuth(true, {
          id: json.data.superAdmin.id,
          email: json.data.superAdmin.email,
          firstName: json.data.superAdmin.firstName,
          lastName: json.data.superAdmin.lastName,
          organizationId: json.data.superAdmin.organizationId,
          industry: json.data.superAdmin.industry || selectedIndustry,
          departments: json.data.superAdmin.departments || [],
          role: json.data.superAdmin.role || 'ADMIN',
          roles: json.data.superAdmin.roles || [],
          departmentId: json.data.superAdmin.departmentId || null,
          isSuperAdmin: true,
          clearanceLevel: 'TOP_SECRET',
        }, token);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 antialiased font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/40 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">AUREN</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                Corporate Edition
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Workspace Provisioning Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs">
            {[
              { id: 1, label: '1. Identity' },
              { id: 2, label: '2. Super Admin' },
              { id: 3, label: '3. Corporate Template' },
              { id: 4, label: '4. Review & Launch' }
            ].map(s => (
              <React.Fragment key={s.id}>
                <span className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  step === s.id 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/40 shadow-xs' 
                    : step > s.id 
                    ? 'bg-slate-900 text-slate-300 font-medium' 
                    : 'bg-slate-950 text-slate-600 border border-slate-900'
                }`}>
                  {s.label}
                </span>
                {s.id < 4 && <span className="text-slate-700 text-xs">&rarr;</span>}
              </React.Fragment>
            ))}
          </div>
          <Link to="/login" className="btn-ghost">
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Wizard */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800/80 rounded-xl text-sm text-rose-200 flex items-center gap-3 shadow-lg shadow-rose-950/40 animate-in fade-in">
            <AlertCircle size={20} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Organization Identity */}
        {step === 1 && (
          <div className="corporate-card animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Initialize Organization Workspace</h2>
                <p className="text-xs text-slate-400">Establish multi-tenant domain and enterprise security boundaries.</p>
              </div>
            </div>

            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Organization Name <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="corporate-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Workspace Domain <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="acme.com"
                  className="corporate-input"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" /> Enforces strict tenant isolation for documents and vectors.
                </p>
              </div>

              <div className="pt-6 flex justify-end border-t border-slate-800/60">
                <button
                  disabled={!orgName.trim()}
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Continue to Admin Setup <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Super Admin Account */}
        {step === 2 && (
          <div className="corporate-card animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Establish Super Admin Account</h2>
                <p className="text-xs text-slate-400">Master authority for Zero-Trust policies and department permissions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">First Name <span className="text-blue-400">*</span></label>
                <input
                  type="text"
                  required
                  value={adminFirstName}
                  onChange={e => setAdminFirstName(e.target.value)}
                  placeholder="Jane"
                  className="corporate-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Last Name <span className="text-blue-400">*</span></label>
                <input
                  type="text"
                  required
                  value={adminLastName}
                  onChange={e => setAdminLastName(e.target.value)}
                  placeholder="Doe"
                  className="corporate-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Super Admin Email <span className="text-blue-400">*</span></label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  className="corporate-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password <span className="text-blue-400">*</span></label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="corporate-input"
                />
              </div>

              <div className="md:col-span-2 pt-6 flex items-center justify-between border-t border-slate-800/60">
                <button
                  onClick={() => setStep(1)}
                  className="btn-outline"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  disabled={!adminEmail || !adminPassword || !adminFirstName || !adminLastName}
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Select Industry Template <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Industry & Template Selection */}
        {step === 3 && (
          <div className="corporate-card animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Select Industry & Access Template</h2>
                <p className="text-xs text-slate-400">Auto-provisions corporate roles, departments, and compliance rules.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {templates.map(t => {
                const isSelected = t.industry === selectedIndustry;
                const isCorporate = t.industry === 'CORPORATE';
                return (
                  <div
                    key={t.industry}
                    onClick={() => setSelectedIndustry(t.industry)}
                    className={`corporate-card-interactive relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
                        : 'hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      {isCorporate && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md shadow-xs">
                          Recommended Corporate
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-2 pt-1">
                        <span className="text-sm font-bold text-white">{t.label}</span>
                        {isSelected && <Check size={18} className="text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800/60">
                      <span>{t.defaultDepartments.length} Depts</span>
                      <span>•</span>
                      <span>{t.defaultRoles.length} Roles</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Template Live Preview */}
            {activeTemplate && (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 size={14} className="text-blue-400" /> Auto-Created Departments
                  </h4>
                  <ul className="space-y-2">
                    {activeTemplate.defaultDepartments.map(d => (
                      <li key={d.name} className="text-xs text-slate-400 flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-200">{d.name}</span>
                          <p className="text-[10px] text-slate-500">{d.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" /> Auto-Created Roles
                  </h4>
                  <ul className="space-y-2">
                    {activeTemplate.defaultRoles.map(r => (
                      <li key={r.name} className="text-xs text-slate-400 flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-200">{r.name}</span>
                          <p className="text-[10px] text-slate-500">{r.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
              <button
                onClick={() => setStep(2)}
                className="btn-outline"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                onClick={() => setStep(4)}
                className="btn-primary"
              >
                Review & Launch <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Launch Workspace */}
        {step === 4 && (
          <div className="corporate-card animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Review & Launch Corporate Workspace</h2>
                <p className="text-xs text-slate-400">Finalize environment creation and initialize zero-trust security controls.</p>
              </div>
            </div>

            <div className="space-y-6 max-w-2xl mb-8">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Organization</span>
                  <p className="text-sm font-bold text-white mt-0.5">{orgName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Industry Template</span>
                  <p className="text-sm font-bold text-blue-400 mt-0.5">{activeTemplate?.label || selectedIndustry}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Super Admin</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{adminFirstName} {adminLastName}</p>
                  <p className="text-xs text-slate-400 font-mono">{adminEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Pipeline</span>
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                    <Check size={14} /> Zero-Trust RBAC Active
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Optional Extra Departments <span className="text-slate-500">(One per line)</span>
                </label>
                <textarea
                  rows={2}
                  value={customDeptsInput}
                  onChange={e => setCustomDeptsInput(e.target.value)}
                  placeholder="Special Ops&#10;Strategic Research"
                  className="corporate-input font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Optional Team Member Invites <span className="text-slate-500">(Emails, one per line)</span>
                </label>
                <textarea
                  rows={2}
                  value={membersText}
                  onChange={e => setMembersText(e.target.value)}
                  placeholder="alice@acme.com&#10;bob@acme.com"
                  className="corporate-input font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-800/60">
              <button
                onClick={() => setStep(3)}
                className="btn-outline"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                disabled={loading}
                onClick={handleCompleteOnboarding}
                className="btn-primary px-8 py-3 text-base font-semibold shadow-xl shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Provisioning Corporate Workspace...
                  </>
                ) : (
                  <>
                    Launch Corporate Workspace <Sparkles size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>AUREN Zero-Trust Knowledge Platform</span>
        <span>Corporate Enterprise Architecture &bull; Multi-Tenant Isolated</span>
      </footer>
    </div>
  );
};

