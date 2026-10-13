import React, { useState } from 'react';
import { Finding } from '../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { PlatformIcon } from './PlatformIcon';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  FileText,
  UserCheck,
  Zap,
} from 'lucide-react';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onUpdateReview: (
    findingId: number,
    data: { review_status: string; reviewer_notes?: string }
  ) => Promise<void>;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onUpdateReview,
}) => {
  if (!finding) return null;

  const [status, setStatus] = useState<string>(finding.review_status || 'unreviewed');
  const [notes, setNotes] = useState<string>(finding.reviewer_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const similarity = finding.similarity_details || {};
  const evidence = finding.evidence_snippets || {};
  const matchedAsset = finding.matched_official_asset || {};

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateReview(finding.id, {
        review_status: status,
        reviewer_notes: notes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Error updating finding: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PlatformIcon platform={finding.platform_or_store} size={28} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {finding.asset_name}
                </h2>
                <RiskBadge tier={finding.risk_category} score={finding.risk_score} />
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.2rem',
                }}
              >
                <span>Platform: {finding.platform_or_store}</span>
                <span>•</span>
                <span style={{ textTransform: 'uppercase' }}>Type: {finding.asset_type}</span>
                <span>•</span>
                {evidence?.data_source === 'synthetic_demo' ? (
                  <span
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    SYNTHETIC DEMO
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    LIVE MONITORING
                  </span>
                )}
                {finding.source_url && (
                  <>
                    <span>•</span>
                    <a
                      href={finding.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent-cyan)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        textDecoration: 'none',
                      }}
                    >
                      Inspect Source <ExternalLink size={12} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Recommended Action / Detection Banner */}
        <div
          style={{
            background:
              finding.risk_category === 'critical'
                ? 'rgba(255, 42, 95, 0.08)'
                : finding.risk_category === 'high'
                ? 'rgba(249, 115, 22, 0.08)'
                : 'rgba(56, 189, 248, 0.08)',
            border: `1px solid ${
              finding.risk_category === 'critical'
                ? 'rgba(255, 42, 95, 0.25)'
                : finding.risk_category === 'high'
                ? 'rgba(249, 115, 22, 0.25)'
                : 'rgba(56, 189, 248, 0.25)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color:
                finding.risk_category === 'critical'
                  ? 'var(--risk-critical)'
                  : 'var(--risk-high)',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.4rem',
            }}
          >
            <ShieldAlert size={18} />
            <span>Detection Reasons & Algorithmic Triggers</span>
          </div>
          <ul
            style={{
              paddingLeft: '1.25rem',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}
          >
            {finding.detection_reasons && finding.detection_reasons.length > 0 ? (
              finding.detection_reasons.map((reason, idx) => (
                <li key={idx}>
                  <strong style={{ color: 'var(--accent-blue)' }}>[FLAG]</strong> {reason}
                </li>
              ))
            ) : (
              <li>Target evaluated without anomalous risk indicators.</li>
            )}
          </ul>
          {finding.recommended_action && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.82rem',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Zap size={14} /> Recommended SOC Action: {finding.recommended_action}
            </div>
          )}
        </div>

        {/* Explainable Algorithmic Breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Search size={16} color="var(--accent-cyan)" />
            Algorithmic Scoring Breakdown
          </h3>

          <div className="grid-2">
            {/* Box 1: Lexical Similarity */}
            <div
              className="cyber-card"
              style={{ padding: '0.9rem', background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  String Similarity (Levenshtein + Jaccard)
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                  }}
                >
                  {similarity.levenshtein_similarity !== undefined
                    ? `${(similarity.levenshtein_similarity * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${
                      similarity.levenshtein_similarity
                        ? Math.min(100, similarity.levenshtein_similarity * 100)
                        : 0
                    }%`,
                    background:
                      (similarity.levenshtein_similarity || 0) > 0.7
                        ? 'var(--risk-critical)'
                        : 'var(--accent-cyan)',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                Levenshtein: {similarity.levenshtein_similarity ?? '—'} • Jaccard:{' '}
                {similarity.jaccard_similarity ?? '—'}
              </p>
            </div>

            {/* Box 2: Visual Homoglyphs & Leetspeak */}
            <div
              className="cyber-card"
              style={{ padding: '0.9rem', background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Visual Homoglyphs / De-Leetspeak
                </span>
                <span
                  style={{
                    color: similarity.homoglyphs_detected
                      ? 'var(--risk-critical)'
                      : 'var(--safe-green)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {similarity.homoglyphs_detected ? 'DETECTED' : 'CLEAR'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                Normalized: <code style={{ color: '#fff' }}>{similarity.normalized_target || '—'}</code>
              </p>
            </div>

            {/* Box 3: Modifiers */}
            <div
              className="cyber-card"
              style={{ padding: '0.9rem', background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Impersonation Affixes Found
                </span>
                <span
                  style={{
                    color:
                      similarity.impersonation_modifiers?.length > 0
                        ? 'var(--risk-high)'
                        : 'var(--safe-green)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {similarity.impersonation_modifiers?.length > 0
                    ? `${similarity.impersonation_modifiers.length} FOUND`
                    : 'NONE'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {similarity.impersonation_modifiers && similarity.impersonation_modifiers.length > 0 ? (
                  similarity.impersonation_modifiers.map((m: string, i: number) => (
                    <span key={i} className="badge badge-high" style={{ fontSize: '0.7rem' }}>
                      +{m}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    No 'official', 'support', or 'care' modifiers
                  </span>
                )}
              </div>
            </div>

            {/* Box 4: Predatory Keywords */}
            <div
              className="cyber-card"
              style={{ padding: '0.9rem', background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Predatory / Scam Language
                </span>
                <span
                  style={{
                    color:
                      similarity.predatory_keywords?.length > 0
                        ? 'var(--risk-critical)'
                        : 'var(--safe-green)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {similarity.predatory_keywords?.length > 0
                    ? `${similarity.predatory_keywords.length} DETECTED`
                    : 'CLEAN'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {similarity.predatory_keywords && similarity.predatory_keywords.length > 0 ? (
                  similarity.predatory_keywords.map((k: string, i: number) => (
                    <span key={i} className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                      {k}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    No credential theft or urgent action phrases
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Snapshot */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FileText size={16} color="var(--accent-blue)" /> Captured Intelligence Evidence
          </h3>
          <div className="evidence-box">
            {evidence && Object.keys(evidence).length > 0 ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(evidence, null, 2)}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-dim)' }}>No additional raw payload attributes captured.</div>
            )}
          </div>
        </div>

        {/* SOC Triage Panel */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-main)',
              }}
            >
              <UserCheck size={18} color="var(--accent-cyan)" />
              Security Analyst Triage & Actions
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Review Status Triage</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="unreviewed">UNREVIEWED (Initial Queue)</option>
                <option value="reviewed">REVIEWED (Investigated)</option>
                <option value="escalated">ESCALATED / TAKEDOWN REQUESTED</option>
                <option value="false_positive">FALSE POSITIVE (Verified Legitimate)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Analyst Case Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Log investigative notes, escalations, DMCA references..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {savedSuccess && (
              <span
                style={{
                  color: 'var(--safe-green)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={16} /> Analyst Triage Saved & Audited!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Recording Audit...' : 'Save Assessment & Audit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
