import { useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowLeft, IconArrowRight, IconBolt, IconShieldCheck, IconUsers } from '../../shared/Icons';

// ── Constants ────────────────────────────────────────────────────────────────
const WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const LINKEDIN_PAGE      = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';

const COURSE_OPTIONS  = ['B-Tech', 'MBA', 'Other'];
const BRANCH_OPTIONS  = [
  'Computer Science Engineering (CSE)',
  'Computer Science (CS)',
  'Information Technology (IT)',
  'AI & Machine Learning (AIML)',
  'Computer Science & Design (CSD)',
  'MBA',
  'Other',
];
const SECTION_OPTIONS  = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const GROUP_OPTIONS    = [
  'NexaSphere Cybersecurity',
  'NexaSphere AI/ML',
  'NexaSphere Web Development',
  'NexaSphere Cloud Wing',
  'NexaSphere Management Crew',
  'NexaSphere Android Development',
  'NexaSphere AWS',
  'NexaSphere Career & Placement',
];

// ── Apps Script URL for Membership sheet ─────────────────────────────────────
// Replace this with your deployed Web App URL after deploying Code.gs
const MEMBERSHIP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRQOW3Xjv13vXvft8ezD9sJdvjV3kf-VHm1l_mImHRDUAEqsilK0wb5QBD5GOkixwe/exec';

// ── Utility ──────────────────────────────────────────────────────────────────
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          fontFamily: 'Orbitron,monospace',
          fontSize: '.72rem',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--t1)',
        }}>
          {label}{required ? <span style={{ color: 'var(--c4)', marginLeft: 6 }}>*</span> : null}
        </div>
        {hint ? <div style={{ color: 'var(--t3)', fontSize: '.82rem' }}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', maxLength, inputMode: inputModeProp, onPaste }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onPaste={onPaste}
      placeholder={placeholder}
      type={type}
      maxLength={maxLength}
      inputMode={inputModeProp || (type === 'tel' ? 'numeric' : undefined)}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: 'var(--t1)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: 'var(--t1)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
        resize: 'vertical',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
    />
  );
}

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300d4ff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`;

function StyledSelect({ value, onChange, children, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: value ? 'var(--t1)' : 'var(--t3)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: SELECT_ARROW,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: '36px',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}

function PillRadio({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="btn btn-outline btn-sm"
            style={{
              background:   active ? 'linear-gradient(135deg,var(--c1),var(--c2))' : undefined,
              color:        active ? '#fff' : undefined,
              borderColor:  active ? 'transparent' : undefined,
              boxShadow:    active ? '0 0 18px var(--c1g)' : undefined,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectChips({ options, values, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="btn btn-outline btn-sm"
            style={{
              background:  active ? 'rgba(0,212,255,.12)' : undefined,
              borderColor: active ? 'var(--c1)' : undefined,
              color:       active ? 'var(--t1)' : undefined,
              boxShadow:   active ? '0 0 14px var(--c1g)' : undefined,
              textTransform: 'none',
              letterSpacing: '.03em',
              fontSize: '.82rem',
            }}
          >
            {active ? '✓ ' : ''}{opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MembershipPage({ onBack }) {
  const [step, setStep]   = useState(0); // 0 = Section 1, 1 = Section 2
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [err,  setErr]    = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const topRef = useRef(null);

  // Check for duplicate submission on mount
  useEffect(() => {
    try {
      const submitted = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
      if (submitted.length > 0) setAlreadySubmitted(true);
    } catch { /* ignore */ }
  }, []);

  const [form, setForm] = useState({
    // Section 1
    fullName:    '',
    rollNumber:  '',
    course:      '',
    courseOther: '',
    branch:      '',
    branchOther: '',
    section:     '',
    semester:    '',
    whatsapp:    '',
    // Section 2
    groups:      [],
    whyJoin:     '',
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  // ── Validation per step ──────────────────────────────────────────────────
  const missingRequired = useMemo(() => {
    const missing = [];
    if (step === 0) {
      if (!form.fullName.trim())   missing.push('fullName');
      if (!form.rollNumber.trim()) missing.push('rollNumber');
      if (!form.course)            missing.push('course');
      if (form.course === 'Other' && !form.courseOther.trim()) missing.push('courseOther');
      if (!form.branch)            missing.push('branch');
      if (form.branch === 'Other' && !form.branchOther.trim()) missing.push('branchOther');
      if (!form.section)           missing.push('section');
      if (!form.semester)          missing.push('semester');
      const phone = String(form.whatsapp || '').trim();
      if (!phone || !/^\d{10}$/.test(phone)) missing.push('whatsapp');
    }
    if (step === 1) {
      if (form.groups.length === 0) missing.push('groups');
      if (!form.whyJoin.trim())     missing.push('whyJoin');
    }
    return missing;
  }, [form, step]);

  const canNext = missingRequired.length === 0;

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const emailKey = String(form.whatsapp || '').trim(); // use WhatsApp as dedup key
      try {
        const existing = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
        if (existing.includes(emailKey)) {
          setErr('This number has already been used to submit a membership form. Each member may submit only once.');
          setBusy(false);
          return;
        }
      } catch { /* ignore */ }

      const payload = {
        fullName:    form.fullName.trim(),
        rollNumber:  form.rollNumber.trim(),
        course:      form.course === 'Other' ? (form.courseOther.trim() || 'Other') : form.course,
        branch:      form.branch === 'Other' ? (form.branchOther.trim() || 'Other') : form.branch,
        section:     form.section,
        semester:    form.semester,
        whatsapp:    form.whatsapp,
        groups:      form.groups.join(', '),
        whyJoin:     form.whyJoin.trim(),
        submittedAt: new Date().toISOString(),
        userAgent:   navigator.userAgent,
        // tells the Apps Script which handler to use
        formType:    'membership',
      };

      const gasUrl = import.meta?.env?.VITE_MEMBERSHIP_SCRIPT_URL || MEMBERSHIP_SCRIPT_URL;
      const useGas = gasUrl && !gasUrl.includes('PLACEHOLDER') && !gasUrl.includes('YOUR_MEMBERSHIP');

      if (useGas) {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });
      }

      // Save to localStorage to prevent re-submit from same device
      try {
        const existing = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
        existing.push(emailKey);
        localStorage.setItem('ns_member_emails', JSON.stringify(existing));
      } catch { /* ignore */ }

      setDone(true);
      scrollTop();
    } catch (e) {
      setErr(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── Intersection observer for pop animations ────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('#pg-member .pop-flip, #pg-member .pop-in, #pg-member .pop-word, #pg-member .pop-scale')
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [step]);

  // ── Step content ─────────────────────────────────────────────────────────
  const steps = useMemo(() => [
    {
      title:    'Personal Details',
      subtitle: 'Fill in your basic information accurately using your college details.',
      icon:     <IconUsers style={{ width: 18, height: 18 }} />,
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* LinkedIn notice */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(0,119,181,.12),rgba(0,212,255,.06))',
            border: '1px solid rgba(0,119,181,.28)',
            borderRadius: 'var(--r3)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🔗</span>
            <div style={{ fontSize: '.88rem', color: 'var(--t2)', lineHeight: 1.7 }}>
              Before submitting, please follow our official LinkedIn page:{' '}
              <a
                href={LINKEDIN_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--c1)', fontWeight: 600, wordBreak: 'break-all' }}
              >
                {LINKEDIN_PAGE}
              </a>
            </div>
          </div>

          <Field label="Full Name" required>
            <Input
              value={form.fullName}
              onChange={v => set('fullName', v.replace(/[^a-zA-Z\s.\-']/g, ''))}
              placeholder="Your full name"
              maxLength={60}
            />
          </Field>

          <Field label="University Roll Number" required>
            <Input
              value={form.rollNumber}
              onChange={v => set('rollNumber', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
              placeholder="e.g. 2301234"
              maxLength={15}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field label="Course" required>
              <div style={{ display: 'grid', gap: 8 }}>
                <StyledSelect value={form.course} onChange={v => set('course', v)} placeholder="Select course">
                  {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </StyledSelect>
                {form.course === 'Other' && (
                  <Input
                    value={form.courseOther}
                    onChange={v => set('courseOther', v.replace(/[^a-zA-Z0-9\s\-&().]/g, ''))}
                    placeholder="Specify your course"
                    maxLength={60}
                  />
                )}
              </div>
            </Field>

            <Field label="Branch / Department" required>
              <div style={{ display: 'grid', gap: 8 }}>
                <StyledSelect value={form.branch} onChange={v => set('branch', v)} placeholder="Select branch">
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </StyledSelect>
                {form.branch === 'Other' && (
                  <Input
                    value={form.branchOther}
                    onChange={v => set('branchOther', v.replace(/[^a-zA-Z0-9\s\-&().]/g, ''))}
                    placeholder="Specify your branch"
                    maxLength={60}
                  />
                )}
              </div>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Section" required>
              <StyledSelect value={form.section} onChange={v => set('section', v)} placeholder="Select section">
                {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Semester" required>
              <StyledSelect value={form.semester} onChange={v => set('semester', v)} placeholder="Select semester">
                {SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </StyledSelect>
            </Field>
          </div>

          <Field label="WhatsApp Number" required hint="10-digit mobile number">
            <Input
              value={form.whatsapp}
              onChange={v => set('whatsapp', String(v || '').replace(/[^\d]/g, '').slice(0, 10))}
              onPaste={e => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 10);
                set('whatsapp', pasted);
              }}
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
        </div>
      ),
    },
    {
      title:    'Domain Selection',
      subtitle: 'Choose the NexaSphere groups you want to join and share your motivation.',
      icon:     <IconBolt style={{ width: 18, height: 18 }} />,
      render: () => (
        <div style={{ display: 'grid', gap: 20 }}>
          <Field label="Which NexaSphere groups would you like to join?" required hint="Select one or more.">
            <MultiSelectChips
              options={GROUP_OPTIONS}
              values={form.groups}
              onToggle={opt => set('groups', form.groups.includes(opt)
                ? form.groups.filter(x => x !== opt)
                : [...form.groups, opt]
              )}
            />
          </Field>

          <Field label="Why do you want to join NexaSphere?" required>
            <TextArea
              value={form.whyJoin}
              onChange={v => set('whyJoin', v)}
              placeholder="Share your motivation and what you hope to learn or contribute."
              rows={6}
            />
          </Field>
        </div>
      ),
    },
  ], [form]);

  const current  = steps[step];
  const progress = step / (steps.length - 1);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div id="pg-member" ref={topRef}>
      <style>{`
        .member-hero { text-align:center; padding:64px 24px 46px; position:relative; }
        .member-hero-bg {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(123,111,255,.10) 0%, transparent 62%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(0,212,255,.07) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(189,92,255,.05) 0%, transparent 55%);
        }
        [data-theme="light"] .member-hero-bg {
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(109,40,217,.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(194,119,10,.04) 0%, transparent 55%);
        }
        .member-divider {
          width:100%; height:1px;
          background:linear-gradient(90deg,transparent,var(--c2) 18%,var(--c1) 50%,var(--c3) 82%,transparent);
          opacity:.18; margin:0 auto;
        }
        .member-shell {
          max-width:860px; margin:0 auto;
          background:var(--card); border:1px solid var(--bdr);
          border-radius:var(--r4); overflow:hidden;
          position:relative; box-shadow:var(--shcard);
        }
        [data-theme="light"] .member-shell {
          background:#fff; border-color:rgba(28,25,23,.1);
          box-shadow:0 8px 44px rgba(0,0,0,.10);
        }
        .member-topbar {
          padding:18px 18px 14px; border-bottom:1px solid var(--bdr);
          background:linear-gradient(180deg,rgba(123,111,255,.04),transparent);
        }
        [data-theme="light"] .member-topbar { background:linear-gradient(180deg,rgba(109,40,217,.03),transparent); }
        .member-progress {
          height:8px; background:rgba(255,255,255,.04);
          border:1px solid var(--bdr); border-radius:999px; overflow:hidden;
        }
        [data-theme="light"] .member-progress { background:rgba(28,25,23,.04); }
        .member-progress > div {
          height:100%; width:0%;
          background:linear-gradient(90deg,var(--c2),var(--c1),var(--c3));
          box-shadow:0 0 18px var(--c1g);
          transition:width .35s cubic-bezier(.22,1,.36,1);
        }
        .member-body { padding:22px 18px 18px; }
        @media (min-width:720px){
          .member-body  { padding:26px 26px 22px; }
          .member-topbar{ padding:18px 26px 14px; }
        }
      `}</style>

      {/* Hero */}
      <div className="member-hero">
        <div className="member-hero-bg"/>
        {onBack ? (
          <button
            onClick={onBack}
            className="btn btn-outline btn-sm"
            style={{ position:'absolute', top:24, left:24 }}
          >
            <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <IconArrowLeft style={{ width:14, height:14 }}/> Back
            </span>
          </button>
        ) : null}

        <div className="pop-in" style={{
          display:'inline-block',
          background:'linear-gradient(135deg,var(--c2),var(--c3))',
          borderRadius:999, padding:'7px 22px',
          fontFamily:'Orbitron,monospace', fontSize:'.85rem',
          fontWeight:700, letterSpacing:'.1em',
          color:'#fff', textTransform:'uppercase',
          boxShadow:'0 0 24px rgba(123,111,255,.4)',
          marginBottom:16,
        }}>
          Membership Form
        </div>

        <h1 className="section-title pop-word" style={{ marginBottom:14 }}>
          Join NexaSphere Community
        </h1>
        <p className="pop-in" style={{
          color:'var(--t2)',
          fontSize:'clamp(.9rem,2vw,1.08rem)',
          maxWidth:660, margin:'0 auto',
          lineHeight:1.75, animationDelay:'.12s',
        }}>
          NexaSphere connects students with opportunities across Tech and Non-Tech domains —
          development, cloud, cybersecurity, management, and career growth.
        </p>
        <div className="member-divider" style={{ marginTop:34, maxWidth:780 }}/>
      </div>

      <div className="container" style={{ paddingBottom:86 }}>
        <div className="member-shell pop-scale">
          <div className="corner-tl"/><div className="corner-br"/>

          {/* Top bar */}
          <div className="member-topbar">
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:12,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:'linear-gradient(135deg,rgba(123,111,255,.25),rgba(0,212,255,.15))',
                  border:'1px solid var(--bdr2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 20px rgba(123,111,255,.12)',
                  fontSize:'1.25rem',
                }}>
                  {done ? <IconShieldCheck style={{ width:18, height:18 }}/> : current.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily:'Orbitron,monospace', fontSize:'.9rem',
                    letterSpacing:'.08em', color:'var(--t1)',
                    display:'flex', gap:10, alignItems:'baseline', flexWrap:'wrap',
                  }}>
                    <span>{done ? 'Submission Complete' : current.title}</span>
                    {!done ? (
                      <span style={{ fontFamily:'Space Mono,monospace', fontSize:'.62rem', letterSpacing:'.18em', color:'var(--t3)' }}>
                        SECTION {step + 1}/{steps.length}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color:'var(--t2)', fontSize:'.9rem' }}>
                    {done
                      ? 'Thank you for joining NexaSphere — GL Bajaj Group of Institutions 🚀'
                      : current.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily:'Space Mono,monospace', fontSize:'.62rem', letterSpacing:'.14em', color:'var(--t3)', textTransform:'uppercase', textAlign:'right' }}>
                {done ? 'Form Submitted' : `Section ${step + 1} of ${steps.length}`}
              </div>
            </div>

            <div className="member-progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }}/>
            </div>
          </div>

          {/* Body */}
          <div className="member-body">
            {alreadySubmitted && !done ? (
              <div style={{
                background:'rgba(255,45,120,.08)', border:'1px solid rgba(255,45,120,.22)',
                borderRadius:'var(--r3)', padding:'20px 22px', textAlign:'center',
              }}>
                <div style={{ fontSize:'1.4rem', marginBottom:10 }}>⚠️</div>
                <div style={{ color:'var(--t1)', fontWeight:700, fontSize:'1rem', marginBottom:8 }}>
                  Membership Form Already Submitted
                </div>
                <div style={{ color:'var(--t2)', fontSize:'.92rem', lineHeight:1.7 }}>
                  A membership form has already been submitted from this device.<br/>
                  If you believe this is an error, please contact us directly.
                </div>
              </div>
            ) : done ? (
              /* ── Success screen ── */
              <div style={{ display:'grid', gap:18 }}>
                <div style={{
                  background:'linear-gradient(135deg,rgba(123,111,255,.08),rgba(0,212,255,.06))',
                  border:'1px solid var(--bdr2)', borderRadius:'var(--r3)',
                  padding:22, position:'relative', overflow:'hidden', textAlign:'center',
                }}>
                  <div className="corner-tl"/><div className="corner-br"/>
                  <div style={{ fontSize:'2.4rem', marginBottom:14 }}>🚀</div>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1rem', color:'var(--t1)', fontWeight:700, marginBottom:12 }}>
                    Thank you for filling the NexaSphere Membership Form!
                  </div>
                  <p style={{ color:'var(--t2)', lineHeight:1.8, maxWidth:540, margin:'0 auto' }}>
                    Your form has been successfully submitted. 🎉
                    <br/><br/>
                    Now request to join the NexaSphere WhatsApp group using the link below — and
                    <b style={{ color:'var(--t1)' }}> mention that you have already filled the NexaSphere form</b>.
                    <br/><br/>
                    Our team will verify your responses and add you to the respective NexaSphere spaces/groups.
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
                  <a
                    className="btn btn-whatsapp"
                    href={WHATSAPP_COMMUNITY}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      Join NexaSphere WhatsApp Group <IconArrowRight/>
                    </span>
                  </a>
                  <a
                    className="btn btn-outline"
                    href={LINKEDIN_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      Follow on LinkedIn <IconArrowRight/>
                    </span>
                  </a>
                </div>

                <div style={{
                  background:'var(--card)', border:'1px solid var(--bdr)',
                  borderRadius:'var(--r2)', padding:'14px 16px',
                  fontSize:'.88rem', color:'var(--t3)', lineHeight:1.7, textAlign:'center',
                }}>
                  📌 Also make sure to follow the official NexaSphere LinkedIn page for updates.<br/>
                  <b style={{ color:'var(--t2)' }}>Stay connected and keep building 🚀 — NexaSphere Team</b>
                </div>
              </div>
            ) : (
              <>
                {current.render()}

                {err ? (
                  <div style={{
                    marginTop:18,
                    background:'rgba(255,45,120,.10)', border:'1px solid rgba(255,45,120,.22)',
                    color:'var(--t1)', borderRadius:'var(--r2)', padding:'12px 14px', fontWeight:600,
                  }}>
                    {err}
                  </div>
                ) : null}

                {/* Navigation buttons */}
                <div style={{ marginTop:22, display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setErr('');
                      if (step === 0) { if (onBack) onBack(); }
                      else { setStep(s => clamp(s - 1, 0, steps.length - 1)); scrollTop(); }
                    }}
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      <IconArrowLeft/> Back
                    </span>
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext}
                      onClick={() => {
                        if (!canNext) { setErr('Please complete the required fields (*) to proceed.'); return; }
                        setErr('');
                        setStep(s => clamp(s + 1, 0, steps.length - 1));
                        scrollTop();
                      }}
                      style={{ opacity: canNext ? 1 : .65 }}
                    >
                      <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                        Continue <IconArrowRight/>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext}
                      onClick={() => {
                        if (!canNext) { setErr('Please complete the required fields (*) to submit.'); return; }
                        submit();
                      }}
                    >
                      {busy ? 'Submitting…' : 'Submit Membership Form'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pop-in" style={{
          marginTop:18, textAlign:'center',
          color:'var(--t3)', fontFamily:'Space Mono,monospace',
          fontSize:'.62rem', letterSpacing:'.18em',
          textTransform:'uppercase', opacity:.9,
        }}>
          Powered by NexaSphere
        </div>
      </div>
    </div>
  );
}
