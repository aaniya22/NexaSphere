import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Award,
  Clock,
  Users,
  BookOpen,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { mentors as fallbackMentors, mentorDomains } from '../../data/mentorshipData.js';
import './MentorsPage.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(null);
  const [requestForm, setRequestForm] = useState({
    mentee_name: '',
    mentee_email: '',
    mentee_domain: '',
    mentee_goals: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (domainFilter) params.set('domain', domainFilter);
      params.set('limit', '50');
      const data = await apiFetch(`/api/mentorship/mentors?${params}`);
      setMentors(data.mentors || []);
    } catch {
      const filtered = fallbackMentors.filter((m) => {
        const bySearch =
          !search.trim() ||
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.bio.toLowerCase().includes(search.toLowerCase()) ||
          m.domains.some((d) => d.toLowerCase().includes(search.toLowerCase()));
        const byDomain = !domainFilter || m.domains.includes(domainFilter);
        return m.isAvailable && bySearch && byDomain;
      });
      setMentors(filtered);
    } finally {
      setLoading(false);
    }
  }, [search, domainFilter]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleRequest = async (mentorId) => {
    setSubmitting(true);
    try {
      await apiFetch('/api/mentorship/requests', {
        method: 'POST',
        body: JSON.stringify({ ...requestForm, mentor_id: mentorId }),
      });
      showToast('Mentorship request sent successfully!', 'success');
      setShowRequestForm(null);
      setRequestForm({
        mentee_name: '',
        mentee_email: '',
        mentee_domain: '',
        mentee_goals: '',
        message: '',
      });
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Find Your Mentor
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Connect with experienced mentors who can guide you through your learning journey. Browse
            our directory and request a mentorship today.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search mentors by name, skills, or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All Domains</option>
              {mentorDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No mentors found matching your criteria.</p>
          </div>
        ) : (
          <div className="mentor-grid">
            {mentors.map((mentor) => {
              const gradientClasses = [
                'mentor-avatar-purple',
                'mentor-avatar-blue',
                'mentor-avatar-green',
                'mentor-avatar-orange',
                'mentor-avatar-indigo',
                'mentor-avatar-pink',
              ];
              const gradientClass =
                gradientClasses[(mentor.name?.charCodeAt(0) || 0) % gradientClasses.length];
              const initials =
                mentor.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?';

              return (
                <div key={mentor.id} className="mentor-card">
                  {/* Header */}
                  <div className="mentor-card-header">
                    <div className="mentor-card-header-left">
                      <div className="mentor-avatar-wrapper">
                        <div className={`mentor-avatar ${gradientClass}`}>{initials}</div>
                        {mentor.isAvailable && <div className="mentor-status-dot"></div>}
                      </div>
                      <div className="mentor-info">
                        <h3 className="mentor-name">{mentor.name}</h3>
                        <div className="mentor-experience">
                          <Award />
                          <span>{mentor.experience || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {mentor.isAvailable ? (
                      <span className="mentor-badge mentor-badge-available">
                        <CheckCircle style={{ width: 12, height: 12 }} />
                        Available
                      </span>
                    ) : (
                      <span className="mentor-badge mentor-badge-busy">
                        <Clock style={{ width: 12, height: 12 }} />
                        Busy
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mentor-bio">{mentor.bio}</p>

                  {/* Tags */}
                  <div className="mentor-tags">
                    {mentor.domains?.slice(0, 4).map((domain) => (
                      <span key={domain} className="mentor-tag">
                        {domain}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="mentor-meta">
                    {mentor.availability && (
                      <div className="mentor-meta-item">
                        <Clock />
                        <span>{mentor.availability}</span>
                      </div>
                    )}
                    <div className="mentor-meta-item">
                      <Users />
                      <span>{mentor.menteeCount || 0} mentees</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      setShowRequestForm(showRequestForm === mentor.id ? null : mentor.id)
                    }
                    disabled={!mentor.isAvailable}
                    className={`mentor-action-button ${showRequestForm === mentor.id ? 'active' : ''}`}
                  >
                    <Send />
                    {showRequestForm === mentor.id ? 'Cancel' : 'Request Mentorship'}
                  </button>

                  {/* Request Form */}
                  {showRequestForm === mentor.id && (
                    <div className="mentor-request-form">
                      <input
                        placeholder="Your Name *"
                        value={requestForm.mentee_name}
                        onChange={(e) =>
                          setRequestForm((p) => ({ ...p, mentee_name: e.target.value }))
                        }
                      />
                      <input
                        placeholder="Your Email *"
                        type="email"
                        value={requestForm.mentee_email}
                        onChange={(e) =>
                          setRequestForm((p) => ({ ...p, mentee_email: e.target.value }))
                        }
                      />
                      <input
                        placeholder="Domain (optional)"
                        value={requestForm.mentee_domain}
                        onChange={(e) =>
                          setRequestForm((p) => ({ ...p, mentee_domain: e.target.value }))
                        }
                      />
                      <textarea
                        placeholder="Your goals (optional)"
                        rows={2}
                        value={requestForm.mentee_goals}
                        onChange={(e) =>
                          setRequestForm((p) => ({ ...p, mentee_goals: e.target.value }))
                        }
                      />
                      <textarea
                        placeholder="Message to mentor (optional)"
                        rows={2}
                        value={requestForm.message}
                        onChange={(e) => setRequestForm((p) => ({ ...p, message: e.target.value }))}
                      />
                      <button
                        onClick={() => handleRequest(mentor.id)}
                        disabled={
                          submitting || !requestForm.mentee_name || !requestForm.mentee_email
                        }
                        className="mentor-submit-button"
                      >
                        {submitting ? (
                          <Loader style={{ width: 16, height: 16 }} className="animate-spin" />
                        ) : (
                          <Send style={{ width: 16, height: 16 }} />
                        )}
                        {submitting ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MentorsPage;
