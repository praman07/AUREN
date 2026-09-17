import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  ImageIcon,
  Maximize2,
  X,
  FileText,
} from 'lucide-react';
import type { WebSourceSuggestion, KnowledgeBaseImage } from '../../types';

interface GroundedSuggestionsAndImagesProps {
  webSuggestions?: WebSourceSuggestion[];
  orgImages?: KnowledgeBaseImage[];
  onOpenDocument?: (docId: string) => void;
}

export const GroundedSuggestionsAndImages: React.FC<GroundedSuggestionsAndImagesProps> = ({
  webSuggestions = [],
  orgImages = [],
  onOpenDocument,
}) => {
  const [activeLightboxImage, setActiveLightboxImage] = useState<KnowledgeBaseImage | null>(null);

  const hasWebSuggestions = webSuggestions && webSuggestions.length > 0;
  const hasOrgImages = orgImages && orgImages.length > 0;

  if (!hasWebSuggestions && !hasOrgImages) {
    return null;
  }

  return (
    <div className="mt-5 space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
      {/* 1. Web Link Suggestions (ChatGPT / Grok Style) */}
      {hasWebSuggestions && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Verified Web Sources & Technical References</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {webSuggestions.map((suggestion, sIdx) => (
              <a
                key={sIdx}
                href={suggestion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {suggestion.domain}
                    </span>
                    <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {suggestion.title}
                  </h4>
                  {suggestion.snippet && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-normal">
                      {suggestion.snippet}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 2. Organization Knowledge Base Schematics & Images */}
      {hasOrgImages && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span>ORG Knowledge Base Diagrams & Topology</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgImages.map((image) => (
              <div
                key={image.id}
                className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col"
              >
                {/* Image Preview */}
                <div
                  onClick={() => setActiveLightboxImage(image)}
                  className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950 cursor-pointer"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900 text-white flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span>View Fullscreen</span>
                    </span>
                  </div>
                  {image.dimensions && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900/80 text-white">
                      {image.dimensions}
                    </span>
                  )}
                </div>

                {/* Metadata & Source Linking */}
                <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                      {image.title}
                    </h4>
                    {image.caption && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                        {image.caption}
                      </p>
                    )}
                  </div>

                  {image.sourceDocTitle && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => image.sourceDocId && onOpenDocument?.(image.sourceDocId)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                        title={`Open source document: ${image.sourceDocTitle}`}
                      >
                        <FileText className="w-3 h-3 text-neutral-400" />
                        <span className="truncate max-w-[200px]">{image.sourceDocTitle}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#15161A] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold">{activeLightboxImage.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Stage */}
            <div className="p-4 flex items-center justify-center bg-[#0D0E11] overflow-auto flex-1 min-h-[300px]">
              <img
                src={activeLightboxImage.imageUrl}
                alt={activeLightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto object-contain rounded-lg border border-neutral-800"
              />
            </div>

            {/* Lightbox Footer */}
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="text-[11px] text-neutral-300 max-w-lg">
                {activeLightboxImage.caption || 'Verified organizational knowledge diagram.'}
              </span>
              {activeLightboxImage.sourceDocId && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeLightboxImage.sourceDocId) {
                      onOpenDocument?.(activeLightboxImage.sourceDocId);
                      setActiveLightboxImage(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open Linked Document</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
