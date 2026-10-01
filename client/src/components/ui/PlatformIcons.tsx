import React from 'react';

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = 'w-5 h-5',
  size,
}) => {
  const normalized = typeof platform === 'string' ? platform.toLowerCase().replace(/[\s-_]/g, '') : '';
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  // 1. GitHub
  if (normalized.includes('github')) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={style}
        fill="currentColor"
        aria-label="GitHub"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    );
  }

  // 2. Google Drive
  if (normalized.includes('drive') || normalized.includes('googledrive')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Google Drive">
        <path d="M8.01 19.5h12.98l-4.33-7.5H3.68l4.33 7.5z" fill="#34A853" />
        <path d="M8.01 4.5l-4.33 7.5 4.33 7.5 4.33-7.5-4.33-7.5z" fill="#4285F4" />
        <path d="M20.99 19.5l-4.33-7.5-4.33-7.5H7.99l4.33 7.5 8.67 7.5z" fill="#FBBC05" />
        <path d="M12.32 4.5h8.67l-4.33 7.5-4.34-7.5z" fill="#EA4335" />
      </svg>
    );
  }

  // 3. Notion
  if (normalized.includes('notion')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Notion">
        <path
          fill="currentColor"
          d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.758-.699c.373 0 .466-.187.373-.466L18.08.756a1.18 1.18 0 00-1.026-.653L2.78.756C2.126.756 1.8.989 1.986 1.688l2.473 2.52zm1.68 4.246v12.27c0 .886.42 1.213 1.353 1.165l13.064-.746c.933-.047 1.166-.653 1.166-1.4V7.52c0-.747-.327-1.12-1.073-1.073L7.212 7.147c-.746.046-1.073.42-1.073 1.307zm11.338 1.12c.094.42 0 .84-.42.886l-1.027.187v7.511c-1.073.56-2.053.84-2.893.84-1.353 0-1.726-.42-2.753-1.68l-3.313-4.665v4.945l1.493.327c.42.093.373.653 0 .653l-3.733.233c-.373 0-.467-.373-.373-.653l1.166-.28V9.388l-1.4-.14c-.373-.047-.327-.653.093-.653l3.873-.233 3.687 5.178V9.108l-1.213-.187c-.374-.046-.28-.653.14-.653l3.966-.233c.373 0 .42.373.373.56z"
        />
      </svg>
    );
  }

  // 4. Slack
  if (normalized.includes('slack')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Slack">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523 2.52 2.52 0 0 1 2.52-2.52h2.52v2.52c0 1.394-1.126 2.523-2.52 2.523z" fill="#E01E5A" />
        <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.523 2.52 2.52 0 0 1 2.52 2.523v6.315A2.528 2.528 0 0 1 8.834 24a2.52 2.52 0 0 1-2.521-2.52v-6.315z" fill="#E01E5A" />
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.52 2.52 0 0 1 8.834 0a2.528 2.528 0 0 1 2.52 2.522v2.52H8.834z" fill="#36C5F0" />
        <path d="M8.834 6.313a2.528 2.528 0 0 1 2.52 2.521 2.52 2.52 0 0 1-2.52 2.52H2.52A2.528 2.528 0 0 1 0 8.834a2.52 2.52 0 0 1 2.52-2.521h6.314z" fill="#36C5F0" />
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522 2.521 2.52 2.52 0 0 1-2.522 2.52h-2.52V11.355c0-1.394 1.127-2.521 2.52-2.521z" fill="#2EB67D" />
        <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.52 2.52 0 0 1-2.52-2.521V2.52A2.528 2.528 0 0 1 15.165 0a2.52 2.52 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.52 2.52 0 0 1 15.165 24a2.528 2.528 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E" />
        <path d="M15.165 17.688a2.528 2.528 0 0 1-2.52-2.523 2.52 2.52 0 0 1 2.52-2.52h6.313A2.528 2.528 0 0 1 24 15.165a2.52 2.52 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
      </svg>
    );
  }

  // 5. Gmail
  if (normalized.includes('gmail')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Gmail">
        <path
          d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.573l8.073-6.08C21.691 2.28 24 3.434 24 5.457z"
          fill="#EA4335"
        />
        <path d="M0 5.457l12 9.001 12-9.001v-.818a1.636 1.636 0 0 0-2.618-1.309L12 8.755 2.618 3.33A1.636 1.636 0 0 0 0 4.64v.818z" fill="#4285F4" opacity="0.8" />
        <path d="M0 5.457v2.182l12 9.001 12-9.001V5.457L12 14.458 0 5.457z" fill="#34A853" opacity="0.3" />
      </svg>
    );
  }

  // 6. Jira
  if (normalized.includes('jira')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Jira">
        <path
          d="M11.53 2c0 5.09-4.12 9.22-9.21 9.22h-.32v-8.9c0-.18.14-.32.32-.32h9.21zm.94 5.25c0 5.09-4.12 9.22-9.21 9.22h-.32v-8.9c0-.18.14-.32.32-.32h9.21zm.94 5.25c0 5.09-4.12 9.22-9.21 9.22h-.32v-8.9c0-.18.14-.32.32-.32h9.21zm9.59 0c0-5.09-4.12-9.22-9.21-9.22h-.32v8.9c0 .18.14.32.32.32h9.21z"
          fill="#0052CC"
        />
      </svg>
    );
  }

  // 7. Confluence
  if (normalized.includes('confluence')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Confluence">
        <path
          d="M2.38 18.06c-.46-.77-.37-1.74.23-2.41 1.76-1.95 3.55-3.87 5.37-5.76.62-.64 1.57-.76 2.33-.29 1.15.71 1.94 1.83 2.22 3.12.3 1.37-.1 2.76-1.07 3.73-1.84 1.84-3.69 3.67-5.55 5.5-.66.65-1.66.71-2.39.15-.65-.5-.95-1.33-.74-2.04h-.4z"
          fill="#172B4D"
        />
        <path
          d="M21.62 5.94c.46.77.37 1.74-.23 2.41-1.76 1.95-3.55 3.87-5.37 5.76-.62.64-1.57.76-2.33.29-1.15-.71-1.94-1.83-2.22-3.12-.3-1.37.1-2.76 1.07-3.73 1.84-1.84 3.69-3.67 5.55-5.5.66-.65 1.66-.71 2.39-.15.65.5.95 1.33.74 2.04h.4z"
          fill="#0052CC"
        />
      </svg>
    );
  }

  // 8. Linear
  if (normalized.includes('linear')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Linear">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M5.5 15.5L15.5 5.5M8.5 18.5L18.5 8.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 9. Figma
  if (normalized.includes('figma')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Figma">
        <path d="M8 2h4v5.333H8z" fill="#F24E1E" />
        <path d="M12 2h4a2.667 2.667 0 0 1 0 5.333H12z" fill="#FF7262" />
        <path d="M8 7.333h4v5.334H8z" fill="#A259FF" />
        <path d="M12 7.333a2.667 2.667 0 1 1 2.667 2.667A2.667 2.667 0 0 1 12 7.333z" fill="#1ABCFE" />
        <path d="M8 12.667h4v5.333H8a2.667 2.667 0 0 1 0-5.333z" fill="#0ACF83" />
      </svg>
    );
  }

  // 10. Microsoft 365
  if (normalized.includes('microsoft') || normalized.includes('m365') || normalized.includes('office')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Microsoft 365">
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" rx="1" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" rx="1" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" rx="1" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" rx="1" />
      </svg>
    );
  }

  // 11. OneDrive / SharePoint
  if (normalized.includes('onedrive') || normalized.includes('sharepoint')) {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-label="Microsoft OneDrive">
        <path
          d="M13.5 11a5.5 5.5 0 0 0-5.38 4.3A4.5 4.5 0 0 0 9 24h9.5a5.5 5.5 0 0 0 .5-10.98A5.48 5.48 0 0 0 13.5 11z"
          fill="#0078D4"
        />
        <path
          d="M6 13a4 4 0 0 0-4 4 4 4 0 0 0 3.5 3.96 6.5 6.5 0 0 1 5.9-6.94A4.01 4.01 0 0 0 6 13z"
          fill="#28A8EA"
          opacity="0.9"
        />
      </svg>
    );
  }

  // Fallback generic database/source icon
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};
