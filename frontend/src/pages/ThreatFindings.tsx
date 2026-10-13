import React, { useState, useMemo } from 'react';
import { Finding } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  ShieldAlert,
  Search,
  Download,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';

interface ThreatFindingsProps {
  brandId: number;
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onRefresh: () => Promise<void>;
}

export const ThreatFindings: React.FC<ThreatFindingsProps> = ({
  brandId,
  findings,
  onSelectFinding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'social' | 'app'>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (f.asset_name || '').toLowerCase().includes(term);
        const matchPlatform = (f.platform_or_store || '').toLowerCase().includes(term);
        const matchReason = (f.detection_reasons || []).some((r) =>
          r.toLowerCase().includes(term)
        );
        if (!matchName && !matchPlatform && !matchReason) return false;
      }
      // Source filter
      if (sourceFilter !== 'all' && f.asset_type !== sourceFilter) return false;
      // Risk filter
      if (riskFilter !== 'all' && f.risk_category !== riskFilter.toLowerCase()) return false;
      // Status filter
      if (statusFilter !== 'all' && f.review_status !== statusFilter.toLowerCase()) return false;

      return true;
    });
  }, [findings, searchTerm, sourceFilter, riskFilter, statusFilter]);

  const handleExportCsv = () => {
    const url = api.getFindingsCsvUrl(brandId);
    window.open(url, '_blank');
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div
        className="cyber-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--risk-critical)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--risk-critical)',
              }}
            >
              SOC Incident Queue
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Threat Findings & Incident Triage ({filteredFindings.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Investigate suspicious impersonations, audit algorithmic evidence, and file takedowns
          </p>
        </div>

        <div>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={14} /> Export Findings CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="cyber-card"
        style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search asset name, platform, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SlidersHorizontal size={14} color="var(--text-dim)" />
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
            >
              <option value="all">All Sources</option>
              <option value="social">Social Media</option>
              <option value="app">Mobile Apps</option>
            </select>
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Tiers</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="safe">Safe</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Review Statuses</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
            <option value="escalated">Escalated / Takedown</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Target Asset</th>
              <th>Channel / Platform</th>
              <th>Vector</th>
              <th>Risk Tier</th>
              <th>Detection Evidence</th>
              <th>Analyst Triage</th>
              <th>Detected At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.length > 0 ? (
              filteredFindings.map((finding) => (
                <tr key={finding.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {finding.asset_name}
                    </div>
                    {finding.source_url && (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {finding.source_url}
                      </div>
                    )}
                  </td>
                  <td>
                    <PlatformIcon platform={finding.platform_or_store} size={18} showLabel />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {finding.asset_type}
                      </span>
                      {finding.evidence_snippets?.data_source === 'synthetic_demo' ? (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            fontWeight: 700,
                          }}
                        >
                          DEMO
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontWeight: 700,
                          }}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <RiskBadge tier={finding.risk_category} score={finding.risk_score} />
                  </td>
                  <td style={{ maxWidth: '340px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {finding.detection_reasons && finding.detection_reasons.length > 0 ? (
                        finding.detection_reasons.slice(0, 2).map((r, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            • {r}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          No specific anomalies
                        </span>
                      )}
                      {finding.detection_reasons && finding.detection_reasons.length > 2 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>
                          +{finding.detection_reasons.length - 2} more flags
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={finding.review_status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(finding.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectFinding(finding)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '0.3rem' }}
                    >
                      <span>Triage</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  No threat findings match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
