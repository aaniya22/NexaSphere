import React, { ReactNode } from 'react';

/**
 * @file EmptyState.tsx
 * @description A reusable EmptyState UI component for NexaSphere.
 *
 * ## UX Best Practices for Empty States:
 * 1. **Be Clear & Informative**: Explain exactly why this screen or section is empty.
 *    Avoid vague messages like "No data found." Instead, say "No events scheduled yet."
 * 2. **Provide Actionable Next Steps**: Help users progress by offering a call to action.
 *    If a list is empty, guide them to create a new item or search with different criteria.
 * 3. **Keep it Visual**: Use engaging illustrations or icons to reduce friction, align
 *    with brand guidelines, and make the screen feel alive even without content.
 * 4. **Match Tone & Voice**: Ensure the copy is friendly, polite, and encouraging.
 *
 * ## React Usage Examples:
 *
 * ### Basic Usage
 * ```tsx
 * import { EmptyState } from './EmptyState';
 *
 * const MyComponent = () => (
 *   <EmptyState
 *     title="No Bookmarks Saved"
 *     description="Bookmark events or articles to read them later when you are offline."
 *   />
 * );
 * ```
 *
 * ### With Action Button
 * ```tsx
 * import { EmptyState } from './EmptyState';
 *
 * const MyComponent = () => (
 *   <EmptyState
 *     title="No Projects Found"
 *     description="It looks like you haven't created any workspace projects yet. Get started by creating your first one!"
 *     action={
 *       <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
 *         Create Project
 *       </button>
 *     }
 *   />
 * );
 * ```
 */

export interface EmptyStateProps {
  /**
   * The headline text representing the current empty state (e.g., "No Messages Found").
   */
  title: string;

  /**
   * The explanatory description providing context and optional next steps.
   */
  description: string;

  /**
   * Optional custom icon/illustration component. If omitted, the default SVG illustration will render.
   */
  icon?: ReactNode;

  /**
   * Optional primary action element, typically a button, guiding the user to resolve the empty state.
   */
  action?: ReactNode;
}

/**
 * A highly detailed inline SVG illustration displaying a magnifying glass over a folder,
 * representing an empty state or search results.
 */
const DefaultIllustration: React.FC = () => (
  <svg
    width="160"
    height="160"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto mb-6 text-gray-400"
    aria-hidden="true"
    data-testid="default-empty-svg"
  >
    {/* Background subtle glowing circle */}
    <circle cx="80" cy="80" r="64" fill="url(#glowGradient)" opacity="0.15" />

    {/* Folder Body Back */}
    <path
      d="M32 44C32 41.7909 33.7909 40 36 40H60L72 52H124C126.209 52 128 53.7909 128 56V112C128 114.209 126.209 116 124 116H36C33.7909 116 32 114.209 32 112V44Z"
      fill="#E5E7EB"
      stroke="#9CA3AF"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Floating Paper Sheets inside the Folder */}
    <rect
      x="48"
      y="58"
      width="64"
      height="44"
      rx="4"
      fill="white"
      stroke="#D1D5DB"
      strokeWidth="2"
      transform="rotate(-4 80 80)"
    />
    <rect
      x="54"
      y="54"
      width="64"
      height="44"
      rx="4"
      fill="white"
      stroke="#D1D5DB"
      strokeWidth="2"
      transform="rotate(2 86 76)"
    />

    {/* Folder Body Front (layered to show papers inside) */}
    <path
      d="M32 64C32 61.7909 33.7909 60 36 60H124C126.209 60 128 61.7909 128 64V112C128 114.209 126.209 116 124 116H36C33.7909 116 32 114.209 32 112V64Z"
      fill="#F3F4F6"
      stroke="#9CA3AF"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Decorative details on folder front (document lines) */}
    <line x1="46" y1="76" x2="70" y2="76" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="86" x2="80" y2="86" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="96" x2="60" y2="96" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />

    {/* Magnifying Glass (floating/overlap) */}
    {/* Handle */}
    <path d="M102 102L122 122" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
    <path d="M116 116L126 126" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
    {/* Glass Rim */}
    <circle cx="90" cy="90" r="16" fill="white" stroke="#4B5563" strokeWidth="3" />
    {/* Inner Glass Highlights */}
    <path
      d="M82 82C84.5 79.5 89 78.5 92 80"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="90" cy="90" r="13" fill="#3B82F6" fillOpacity="0.1" />

    {/* Decorative Sparkles / Empty state stars */}
    <path d="M136 36L138 41L143 43L138 45L136 50L134 45L129 43L134 41L136 36Z" fill="#FBBF24" />
    <path d="M24 84L25 87L28 88L25 89L24 92L23 89L20 88L23 87L24 84Z" fill="#FBBF24" />
    <path d="M104 22L105 24L107 25L105 26L104 28L103 26L101 25L103 24L104 22Z" fill="#FBBF24" />

    {/* SVG Gradients */}
    <defs>
      <radialGradient
        id="glowGradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(80 80) rotate(90) scale(64)"
      >
        <stop offset="0%" stopColor="#9CA3AF" stopOpacity="1" />
        <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-xl"
      data-testid="empty-state-container"
    >
      {/* Icon Area */}
      <div className="flex items-center justify-center mb-4">
        {icon ? icon : <DefaultIllustration />}
      </div>

      {/* Content Area */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="empty-state-title">
        {title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6" data-testid="empty-state-description">
        {description}
      </p>

      {/* Action Area */}
      {action && (
        <div className="flex items-center justify-center" data-testid="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};
