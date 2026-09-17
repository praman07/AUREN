import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  Github,
  FolderGit2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/button';

interface OnboardingViewProps {
  onComplete: () => void;
  initialName?: string;
  initialEmail?: string;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onComplete,
  initialName = 'Praman Singh Bhogal',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1 State: Profile & Role
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState('Lead Architect');
  const [department, setDepartment] = useState('Core Architecture');

  // Step 2 State: Workspace
  const [workspaceMode, setWorkspaceMode] = useState<'both' | 'organization' | 'personal'>('both');

  // Step 3 State: Knowledge Preferences
  const [defaultScope, setDefaultScope] = useState<'personal' | 'organization'>('personal');
  const [chatStyle, setChatStyle] = useState<'in_depth' | 'concise' | 'technical'>('in_depth');
  const [_enableRealtime, _setEnableRealtime] = useState(true);

  // Step 4 State: Sources
  const [connectedSources, setConnectedSources] = useState<{ [key: string]: boolean }>({
    github: true,
    drive: true,
    notion: false,
    slack: false,
  });

  const toggleSource = (sourceKey: string) => {
    setConnectedSources((prev) => ({
      ...prev,
      [sourceKey]: !prev[sourceKey],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] dark:bg-[#0A0B0D] flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs">
            A
          </div>
          <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            AUREN
          </span>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'w-6 bg-neutral-900 dark:bg-white'
                  : step < currentStep
                  ? 'w-3 bg-neutral-400 dark:bg-neutral-600'
                  : 'w-2 bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          ))}
          <span className="ml-2 text-[11px] font-mono text-neutral-400">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Main Content Step Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        {/* STEP 1: Name & Role */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                Step 1 of 5
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Welcome to AUREN.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Let's set up your profile and identity in your knowledge workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-4 shadow-2xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Praman Singh Bhogal"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Architect"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Core Architecture"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Workspace Setup */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                Step 2 of 5
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Choose your Knowledge Spaces.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                AUREN isolates private personal vaults from organizational company knowledge.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div
                onClick={() => setWorkspaceMode('both')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  workspaceMode === 'both'
                    ? 'bg-white dark:bg-[#141518] border-neutral-900 dark:border-white shadow-xs'
                    : 'bg-neutral-50/70 dark:bg-[#101114] border-neutral-200/80 dark:border-neutral-800/80 opacity-85'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-neutral-400 dark:border-neutral-600 flex items-center justify-center shrink-0 mt-0.5">
                  {workspaceMode === 'both' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Dual-Tier Workspace (Recommended)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                      Personal + Org
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Have a private owner vault for confidential notes and connect to team repositories, specs, and documents.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setWorkspaceMode('organization')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  workspaceMode === 'organization'
                    ? 'bg-white dark:bg-[#141518] border-neutral-900 dark:border-white shadow-xs'
                    : 'bg-neutral-50/70 dark:bg-[#101114] border-neutral-200/80 dark:border-neutral-800/80 opacity-85'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-neutral-400 dark:border-neutral-600 flex items-center justify-center shrink-0 mt-0.5">
                  {workspaceMode === 'organization' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Organization Only (GNA / AUREN Workspace)
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Access shared architecture guild knowledge, engineering repositories, and team roadmaps.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setWorkspaceMode('personal')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  workspaceMode === 'personal'
                    ? 'bg-white dark:bg-[#141518] border-neutral-900 dark:border-white shadow-xs'
                    : 'bg-neutral-50/70 dark:bg-[#101114] border-neutral-200/80 dark:border-neutral-800/80 opacity-85'
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-neutral-400 dark:border-neutral-600 flex items-center justify-center shrink-0 mt-0.5">
                  {workspaceMode === 'personal' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Personal Vault Only
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Isolated local research environment with zero team sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Knowledge Preferences */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                Step 3 of 5
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Knowledge & Synthesis Preferences.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Configure how AUREN reasons over documents and prepares executive summaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-5 shadow-2xs">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Default Knowledge Search Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultScope('personal')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      defaultScope === 'personal'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Personal Vault
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Prioritize private files
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultScope('organization')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      defaultScope === 'organization'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Organization
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Include guild repositories & specs
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Assistant Synthesis Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'in_depth', label: 'In-Depth', desc: 'Thorough, structured answers' },
                    { id: 'concise', label: 'Concise', desc: 'Brief executive points' },
                    { id: 'technical', label: 'Technical', desc: 'Code and architecture deep' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setChatStyle(style.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        chatStyle === style.id
                          ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 font-medium'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {style.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                        {style.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Connect Sources */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                Step 4 of 5
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Connect your Work Sources.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Connect sources you want AUREN to index. You can always change this later in Connectors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'github',
                  name: 'GitHub Enterprise',
                  icon: <Github className="w-4 h-4" />,
                  detail: 'Repositories, commits & specs',
                  scope: 'Organization',
                },
                {
                  id: 'drive',
                  name: 'Google Drive',
                  icon: <FolderGit2 className="w-4 h-4" />,
                  detail: 'Docs, sheets & PDFs',
                  scope: 'Organization',
                },
                {
                  id: 'notion',
                  name: 'Notion Workspace',
                  icon: <FileText className="w-4 h-4" />,
                  detail: 'Engineering handbooks & meeting notes',
                  scope: 'Personal / Org',
                },
                {
                  id: 'slack',
                  name: 'Slack Guilds',
                  icon: <MessageSquare className="w-4 h-4" />,
                  detail: 'Architecture discussions & RFCs',
                  scope: 'Organization',
                },
              ].map((src) => {
                const isSelected = connectedSources[src.id];
                return (
                  <div
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-white dark:bg-[#141518] border-neutral-900 dark:border-white shadow-2xs'
                        : 'bg-neutral-50/60 dark:bg-[#101114] border-neutral-200/80 dark:border-neutral-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                          {src.icon}
                        </div>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {src.name}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                            : 'border border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-neutral-500">{src.detail}</span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        Scope: {src.scope}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Finish & Launch */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-6 animate-fadeIn text-center">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
              A
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                You're all set, {name.split(' ')[0]}.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Your AUREN knowledge assistant has been configured with dual-tier isolation and connected sources.
              </p>
            </div>

            {/* Summary Pill Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 text-left flex flex-col gap-3 shadow-2xs max-w-md mx-auto w-full">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Identity:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {name} ({role})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Workspace:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  GNA / AUREN Workspace
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Connected Sources:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {Object.values(connectedSources).filter(Boolean).length} Active Sources
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Isolation Boundary:</span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified Zero-Trust
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/80">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            icon={currentStep === totalSteps ? undefined : <ArrowRight className="w-3.5 h-3.5" />}
            className="font-medium text-xs tracking-wide"
          >
            {currentStep === totalSteps ? 'Enter AUREN Workspace' : 'Continue'}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto text-center text-[11px] text-neutral-400">
        AUREN Knowledge Assistant • Prototype V2
      </div>
    </div>
  );
};
