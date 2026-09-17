import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';

interface SignupViewProps {
  onSignup: (name: string, email: string) => void;
  onNavigateLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSignup, onNavigateLogin }) => {
  const [name, setName] = useState('Praman Singh Bhogal');
  const [email, setEmail] = useState('praman@example.com');
  const [workspace, setWorkspace] = useState('GNA / AUREN Workspace');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(name, email);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] dark:bg-[#0A0B0D] flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs">
            A
          </div>
          <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            AUREN
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </button>
      </div>

      {/* Main Signup Form */}
      <div className="max-w-md w-full mx-auto my-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Create your AUREN account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Start organizing your personal and organizational knowledge.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Praman Singh Bhogal"
              required
            />

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="praman@example.com"
              required
            />

            <Input
              label="Workspace Name"
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="e.g. GNA / AUREN Workspace"
              required
            />

            <Button variant="primary" size="md" type="submit" className="w-full mt-2 font-medium">
              Continue to Onboarding
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-medium text-neutral-900 dark:text-white underline underline-offset-2 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto text-center text-[11px] text-neutral-400">
        By joining, you establish cryptographic tenant isolation for your organization.
      </div>
    </div>
  );
};
