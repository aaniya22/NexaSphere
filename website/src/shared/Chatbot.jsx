import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../utils/apiClient.js';
import '../styles/chatbot.css';
import PromptHistorySidebar from '../components/history/PromptHistorySidebar';
import SearchBar from '../components/history/SearchBar';
import PinnedChats from '../components/history/PinnedChats';
import { savePrompt, exportPrompts } from '../lib/promptStore';
import { initializeWorkspaces } from '../lib/workspaceService';
import { buildUrl, getAiApiBase } from '../utils/runtimeConfig';

const knowledgeBase = [
  {
    keywords: ['nexasphere', 'about', 'community', 'what is'],
    answer:
      'NexaSphere is the official tech ecosystem at GL Bajaj Group of Institutions, Mathura, run by students for students to foster innovation and learning.',
  },
  {
    keywords: ['hackathon', 'codathon', 'ideathon', 'promptathon'],
    answer:
      'NexaSphere hosts various competitions: Hackathons (building apps), Codathons (DSA/Competitive Programming), Ideathons (pitching ideas), and Promptathons (AI prompting).',
  },
  {
    keywords: ['workshop', 'git', 'github', 'react', 'learn'],
    answer:
      'We conduct hands-on workshops on Git, GitHub, React, and emerging tech. Check the "Activities" page for upcoming sessions!',
  },
  {
    keywords: ['event', 'kss', 'insight', 'session'],
    answer:
      'NexaSphere organizes Knowledge Sharing Sessions (KSS) and Insight Sessions where peers share technical expertise and industry trends.',
  },
  {
    keywords: ['team', 'mentor', 'leader', 'organizer', 'ayush', 'tanishk'],
    answer:
      'NexaSphere is led by Ayush Sharma and Tanishk Bansal, supported by a dedicated Core Team of developers, designers, and content creators.',
  },
  {
    keywords: ['join', 'member', 'membership', 'register'],
    answer:
      'To join as a member, click the "Join" button on our homepage. Note: You must use your @glbajajgroup.org email address.',
  },
  {
    keywords: ['apply', 'core team', 'recruitment', 'hiring'],
    answer:
      'Core Team applications open periodically. Keep an eye on the "Apply" button in the navigation bar or our WhatsApp community updates.',
  },
  {
    keywords: ['contact', 'email', 'reach out', 'help'],
    answer:
      'You can reach us at nexasphere@glbajajgroup.org or via the official contact form on the website.',
  },
  {
    keywords: ['history', 'save', 'workspace'],
    answer:
      'Your chats are automatically saved! Use the 📋 icon to toggle history, or use the workspace selector to organize your queries into General, Coding, or Research.',
  },
];

function queryLocalKnowledge(input) {
  const text = input.toLowerCase();

  for (const item of knowledgeBase) {
    if (item.keywords.some((keyword) => text.includes(keyword))) {
      return item.answer;
    }
  }

  return "I didn't quite understand that. Try asking about NexaSphere, Events, Team, or Membership.";
}
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: `msg-init`,
      role: 'bot',
      text: 'Nexa-Intelligence Online. How can I assist your journey?',
    },
  ]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('default');
  const scrollRef = useRef(null);

  // Initialize workspaces on mount
  useEffect(() => {
    initializeWorkspaces();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Auto-save last prompt-response pair when new bot message arrives
  useEffect(() => {
    if (messages.length >= 2) {
      const lastBotMsg = [...messages].reverse().find((m) => m.role === 'bot');
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');

      if (lastBotMsg && lastUserMsg) {
        const lastBotIndex = messages.indexOf(lastBotMsg);
        const lastUserIndex = messages.indexOf(lastUserMsg);

        // Only save if the bot message is more recent than the last saved one
        if (lastBotIndex > lastUserIndex) {
          savePrompt(lastUserMsg.text, lastBotMsg.text, currentWorkspace).catch((err) => {
            if (import.meta.env.DEV) {
              console.error('[Chatbot] Error saving prompt:', err.message);
            }
          });
        }
      }
    }
  }, [messages, currentWorkspace]);

  const sendFallbackResponse = (query) => {
    const fallbackResponse = queryLocalKnowledge(query);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        text: fallbackResponse,
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userMsg = { id: `msg-${Date.now()}-user`, role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsSending(true);
    const controller = new AbortController();
    const aiChatUrl = buildUrl(getAiApiBase(), '/ai/chat');

    if (!aiChatUrl) {
      sendFallbackResponse(currentInput);
      setIsSending(false);
      return;
    }
    try {
      const data = await apiClient(aiChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
        signal: controller.signal,
      });
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-bot`, role: 'bot', text: data.reply },
      ]);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Chatbot] AI chat request failed:', e.message);
      }
      sendFallbackResponse(currentInput);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    setMessages([
      {
        id: 'msg-init',
        role: 'bot',
        text: 'Nexa-Intelligence Online. How can I assist your journey?',
      },
      { id: `msg-${Date.now()}-user`, role: 'user', text: prompt.userPrompt },
      { id: `msg-${Date.now() + 1}-bot`, role: 'bot', text: prompt.botResponse },
    ]);
    setShowSidebar(false);
  };

  return (
    <div className="ns-chatbot-wrapper">
      {!isOpen ? (
        <button
          className="chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="chatbot-window"
        >
          <div className="pulse-ring"></div>
          💬
        </button>
      ) : (
        <div id="chatbot-window" className="chat-window-glass">
          <PromptHistorySidebar
            isOpen={showSidebar}
            onSelectPrompt={handleSelectPrompt}
            currentWorkspace={currentWorkspace}
          />

          <div className={`chat-main ${showSidebar ? 'sidebar-open' : ''}`}>
            <div className="chat-header">
              <button
                className="history-toggle-btn"
                onClick={() => setShowSidebar(!showSidebar)}
                title="Toggle History"
                aria-expanded={showSidebar}
                aria-controls="prompt-history-sidebar"
              >
                📋
              </button>
              <button
                className="export-btn"
                onClick={() => exportPrompts(currentWorkspace)}
                title="Export chat history"
              >
                ⬇
              </button>
              <div className="header-status">
                <span className="status-dot"></span>
                <span>NEXA-AI</span>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            <div className="chat-content">
              <PinnedChats onSelectPrompt={handleSelectPrompt} workspace={currentWorkspace} />

              <SearchBar onSelectPrompt={handleSelectPrompt} workspace={currentWorkspace} />

              <div className="chat-messages" ref={scrollRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`msg-bubble ${m.role}`}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-input-container">
              <select
                value={currentWorkspace}
                onChange={(e) => setCurrentWorkspace(e.target.value)}
                className="workspace-selector-inline"
              >
                <option value="default">General</option>
                <option value="coding">Coding & Debug</option>
                <option value="research">Research</option>
              </select>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isSending ? 'Transmitting...' : 'Query system...'}
                disabled={isSending}
              />
              <button onClick={handleSend} className="send-btn" disabled={isSending}>
                {isSending ? '...' : '🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
