import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldCheck, Layers, Users, ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
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
  const [customRolesInput, setCustomRolesInput] = useState('');

  // Initial Members
  const [membersText, setMembersText] = useState('');

  useEffect(() => {
    fetch('/api/v1/onboarding/templates')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
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
      const customDepartments = customDeptsInput.split('\n').map(s => s.trim()).filter(Boolean);
      const customRoles = customRolesInput.split('\n').map(s => s.trim()).filter(Boolean);

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

      const json = await response.json();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 antialiased font-sans">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
            A
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">AUREN</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">Workspace Setup</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className={`px-2.5 py-1 rounded-full ${step === 1 ? 'bg-primary/20 text-primary font-semibold border border-primary/30' : 'bg-slate-900 text-slate-500'}`}>1. Org</span>
            <span>&rarr;</span>
            <span className={`px-2.5 py-1 rounded-full ${step === 2 ? 'bg-primary/20 text-primary font-semibold border border-primary/30' : 'bg-slate-900 text-slate-500'}`}>2. Admin</span>
            <span>&rarr;</span>
            <span className={`px-2.5 py-1 rounded-full ${step === 3 ? 'bg-primary/20 text-primary font-semibold border border-primary/30' : 'bg-slate-900 text-slate-500'}`}>3. Industry Template</span>
            <span>&rarr;</span>
            <span className={`px-2.5 py-1 rounded-full ${step === 4 ? 'bg-primary/20 text-primary font-semibold border border-primary/30' : 'bg-slate-900 text-slate-500'}`}>4. Complete</span>
          </div>
          <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Wizard */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-800/80 rounded-lg text-sm text-red-200 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Organization Identity */}
        {step === 1 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Initialize Organization</h2>
                <p className="text-xs text-slate-400">Establish multi-tenant domain and workspace boundaries.</p>
              </div>
            </div>

            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Workspace Domain (Optional)</label>
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="acme.com"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1">Enforces strict tenant isolation for documents and vectors.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!orgName.trim()}
                  onClick={() => setStep(2)}
                  className="h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  Continue to Admin Setup <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Super Admin Account */}
        {step === 2 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Establish Super Admin Account</h2>
                <p className="text-xs text-slate-400">Master authority for Zero-Trust policies and department permissions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={adminFirstName}
                  onChange={e => setAdminFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={adminLastName}
                  onChange={e => setAdminLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Super Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="md:col-span-2 pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="h-10 px-4 text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  disabled={!adminEmail || !adminPassword || !adminFirstName || !adminLastName}
                  onClick={() => setStep(3)}
                  className="h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  Select Industry Template <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Industry & Template Selection */}
        {step === 3 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Industry & Access Template</h2>
                <p className="text-xs text-slate-400">Auto-provisions industry roles, departments, and compliance rules.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {templates.map(t => {
                const isSelected = t.industry === selectedIndustry;
                return (
                  <div
                    key={t.industry}
                    onClick={() => setSelectedIndustry(t.industry)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{t.label}</span>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{t.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
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
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Auto-Created Departments</h4>
                  <ul className="space-y-1">
                    {activeTemplate.defaultDepartments.map(d => (
                      <li key={d.name} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <span className="font-medium text-slate-200">{d.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Auto-Created Roles</h4>
                  <ul className="space-y-1">
                    {activeTemplate.defaultRoles.map(r => (
                      <li key={r.name} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                        <span className="font-medium text-slate-200">{r.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="h-10 px-4 text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                onClick={() => setStep(4)}
                className="h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                Review & Launch <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Launch Workspace */}
        {step === 4 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Review & Complete Onboarding</h2>
                <p className="text-xs text-slate-400">Finalize workspace creation and launch your secure AUREN environment.</p>
              </div>
            </div>

            <div className="space-y-5 max-w-2xl mb-8">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Organization</span>
                  <p className="text-sm font-medium text-white">{orgName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Industry Template</span>
                  <p className="text-sm font-medium text-white">{activeTemplate?.label || selectedIndustry}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Super Admin</span>
                  <p className="text-sm font-medium text-white">{adminFirstName} {adminLastName} ({adminEmail})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Security Pipeline</span>
                  <p className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Zero-Trust RBAC Ready
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Optional Extra Departments (One per line)</label>
                <textarea
                  rows={2}
                  value={customDeptsInput}
                  onChange={e => setCustomDeptsInput(e.target.value)}
                  placeholder="Special Ops&#10;Research Lab"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Optional Team Member Invites (Emails, one per line)</label>
                <textarea
                  rows={2}
                  value={membersText}
                  onChange={e => setMembersText(e.target.value)}
                  placeholder="alice@acme.com&#10;bob@acme.com"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="h-10 px-4 text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                disabled={loading}
                onClick={handleCompleteOnboarding}
                className="h-11 px-8 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Provisioning AUREN Workspace...
                  </>
                ) : (
                  <>
                    Launch AUREN Workspace <Sparkles size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        AUREN Zero-Trust Knowledge Platform &bull; Multi-Tenant Enterprise Engine
      </footer>
    </div>
  );
};
