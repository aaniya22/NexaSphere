import React, { useRef, useState, useEffect } from 'react';
import { useSocketSync } from '../../hooks/useSocketSync';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Users, Wifi, WifiOff, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import './WorkspacePage.css';

interface WorkspacePageProps {
  roomId: string;
  onBack: () => void;
}

/** Derive a stable anonymous identity persisted for the browser session.
 *  Falls back to a new random identity if sessionStorage is unavailable.
 */
function getOrCreateAnonUser() {
  const STORAGE_KEY = 'ns_workspace_anon_user';
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // sessionStorage unavailable (private browsing) — fall through to create
  }
  const id = Math.floor(Math.random() * 9000) + 1000;
  const hue = Math.floor(Math.random() * 360);
  const user = {
    name: `User-${id}`,
    color: `hsl(${hue}, 70%, 50%)`,
    initials: `U${String(id).slice(-1)}`,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore write failure
  }
  return user;
}

export default function WorkspacePage({ roomId, onBack }: WorkspacePageProps) {
  // Stable anonymous identity — persisted for the session so hot reloads
  // and re-mounts do not generate a new user name and color each time.
  const [user] = useState(getOrCreateAnonUser);

  const { emitDocumentChange, emitCursorMove, emitTyping } = useSocketSync(roomId, user);
  const { documentContent, users, status } = useWorkspaceStore();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initials safely
    user.initials = user.name.substring(0, 2).toUpperCase();
  }, [user]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    useWorkspaceStore.getState().setDocumentContent(val);
    emitDocumentChange(val);
    emitTyping();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    emitCursorMove({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Connected':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'Disconnected':
        return <WifiOff size={16} className="text-red-500" />;
      case 'Reconnecting...':
        return <RefreshCw size={16} className="text-yellow-500 animate-spin" />;
      case 'Syncing changes...':
        return <Wifi size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <Wifi size={16} />;
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <div className="workspace-header-left">
          <button onClick={onBack} className="workspace-back-btn">
            <ChevronLeft size={20} /> Back
          </button>
          <h2>Room: {roomId}</h2>
          <div className="workspace-status">
            {getStatusIcon()}
            <span className="status-text">{status}</span>
          </div>
        </div>
        <div className="workspace-presence">
          <Users size={20} className="presence-icon" />
          <div className="avatar-group">
            {Object.values(users).map((u) => (
              <div
                key={u.socketId}
                className={`avatar ${u.isTyping ? 'typing' : ''}`}
                style={{ backgroundColor: u.user?.color || '#555' }}
                title={`${u.user?.name || 'Anonymous'} ${u.isTyping ? '(typing...)' : ''}`}
              >
                {u.user?.initials || '?'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="workspace-editor-area" ref={containerRef} onMouseMove={handleMouseMove}>
        {Object.values(users).map((u) => {
          if (!u.cursor || u.socketId === 'local') return null; // Don't show local cursor as a fake one
          return (
            <div
              key={`cursor-${u.socketId}`}
              className="remote-cursor"
              style={{
                transform: `translate(${u.cursor.x}px, ${u.cursor.y}px)`,
                backgroundColor: u.user?.color || '#ff0000',
              }}
            >
              <div className="cursor-label" style={{ backgroundColor: u.user?.color || '#ff0000' }}>
                {u.user?.name || 'Unknown'}
              </div>
            </div>
          );
        })}

        <textarea
          ref={editorRef}
          className="workspace-textarea"
          value={documentContent}
          onChange={handleTextChange}
          placeholder="Start typing collaboratively..."
        />
      </div>
    </div>
  );
}
