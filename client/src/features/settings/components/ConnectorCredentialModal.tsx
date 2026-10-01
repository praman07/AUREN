import React, { useState } from 'react';
import { X, Key, Mail, ShieldAlert, Loader2, Database, MessageSquare, Mail as MailIcon } from 'lucide-react';
import { useConnectConnector } from '../api/connectorQueries';

interface ConnectorCredentialModalProps {
  provider: string;
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification: (message: string) => void;
}

const providerDetails: Record<string, { title: string; tokenLabel: string; tokenPlaceholder: string; helperText: string; icon: React.ElementType }> = {
  NOTION: {
    title: 'Connect Notion Workspace',
    tokenLabel: 'Internal Integration Secret / API Token',
    tokenPlaceholder: 'secret_ntn_...',
    helperText: 'Generate an Internal Integration secret in your Notion Workspace at notion.so/my-integrations with read permissions.',
    icon: Database,
  },
  SLACK: {
    title: 'Connect Slack Workspace',
    tokenLabel: 'Bot User OAuth Token',
    tokenPlaceholder: 'xoxb-...',
    helperText: 'Create a Slack App at api.slack.com/apps with scopes (channels:history, files:read) and paste the Bot User OAuth Token.',
    icon: MessageSquare,
  },
  GMAIL: {
    title: 'Connect Gmail Account',
    tokenLabel: 'OAuth Access Token / Service Account Secret',
    tokenPlaceholder: 'ya29.a0...',
    helperText: 'Provide a valid Google OAuth Access Token with gmail.readonly scope or API Key.',
    icon: MailIcon,
  },
};

export const ConnectorCredentialModal: React.FC<ConnectorCredentialModalProps> = ({
  provider,
  providerName,
  isOpen,
  onClose,
  onSuccessNotification,
}) => {
  const [accountEmail, setAccountEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accountId, _setAccountId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const connectMutation = useConnectConnector();

  if (!isOpen) return null;

  const details = providerDetails[provider] || {
    title: `Connect ${providerName}`,
    tokenLabel: 'API Token / Access Key',
    tokenPlaceholder: 'Paste secret or API token...',
    helperText: 'Provide valid authorization credentials for this external provider.',
    icon: Key,
  };

  const IconComponent = details.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = accountEmail.trim();
    const trimmedToken = accessToken.trim();
    const trimmedAccountId = accountId.trim() || `${provider.toLowerCase()}_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (!trimmedEmail) {
      setErrorMessage('Account email or workspace identifier is required.');
      return;
    }

    if (!trimmedToken) {
      setErrorMessage('Valid API Token or Access Secret is required.');
      return;
    }

    if (trimmedToken.toLowerCase().includes('demo') || trimmedToken.toLowerCase().includes('fake')) {
      setErrorMessage('Demo or fake tokens are disabled. Please provide a real API credential.');
      return;
    }

    try {
      await connectMutation.mutateAsync({
        provider,
        accountId: trimmedAccountId,
        accountEmail: trimmedEmail,
        accessToken: trimmedToken,
      });

      onSuccessNotification(`${providerName} connected successfully!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to connect ${providerName}. Please check your credentials.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/60 dark:border-blue-800/60">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {details.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authenticating with real API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Account Email or Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="e.g. workspace@company.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              {details.tokenLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={details.tokenPlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              {details.helperText}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Connect Integration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
