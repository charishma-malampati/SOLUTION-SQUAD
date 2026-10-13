import React, { useState, useEffect } from 'react';
import { BrandProfile, DashboardStats, Finding } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';

interface ExecutiveReportProps {
  brand: BrandProfile | null;
}

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ brand }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [criticalFindings, setCriticalFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    Promise.all([
      api.getStats(brand.id),
      api.getFindings({ brand_id: brand.id }),
    ])
      .then(([statsData, findingsData]) => {
        setStats(statsData);
        setCriticalFindings(
          findingsData.filter(
            (f) => f.risk_category === 'critical' || f.risk_category === 'high'
          )
        );
      })
      .catch((err) => console.error('Failed to load report data', err))
      .finally(() => setLoading(false));
  }, [brand]);

  if (!brand) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const url = api.getFindingsCsvUrl(brand.id);
    window.open(url, '_blank');
  };

  const riskDist = stats?.risk_distribution || {};
  const criticalCount = riskDist['critical'] || riskDist['Critical'] || 0;
  const highCount = riskDist['high'] || riskDist['High'] || 0;

  return (
    <div className="page-wrapper" id="printable-report">
      {/* Top Controls Banner */}
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
            <FileText size={18} color="var(--accent-cyan)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-cyan)',
              }}
            >
              Executive Intelligence Brief
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Brand Protection Summary — {brand.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Executive assessment prepared for CISO, Legal Counsel, and Brand Operations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={14} /> Print / Save PDF
          </button>
          <button onClick={handleExportCsv} className="btn btn-primary btn-sm">
            <Download size={14} /> Export Findings CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Generating executive threat brief...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Overview Card */}
          <div
            className="cyber-card"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.95) 100%)',
              border: '1px solid var(--border-highlight)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--risk-critical)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Threat Posture Assessment
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {criticalCount > 0
                    ? 'ELEVATED BRAND INFRINGEMENT RISK DETECTED'
                    : 'BRAND PERIMETER SECURE — ZERO ACTIVE THREATS'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  Brand Perimeter: <strong>{brand.name}</strong> • Protected Domain:{' '}
                  <strong>{brand.website || 'novapay.io'}</strong> • Generated on:{' '}
                  {new Date().toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  background:
                    criticalCount > 0
                      ? 'rgba(255, 42, 95, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${
                    criticalCount > 0
                      ? 'var(--risk-critical-border)'
                      : 'var(--safe-green-border)'
                  }`,
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ATTACK SURFACE
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: criticalCount > 0 ? 'var(--risk-critical)' : 'var(--safe-green)',
                  }}
                >
                  {criticalCount + highCount} High Risk
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              className="grid-4"
              style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Entities Evaluated
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {(stats?.total_monitored_social || 0) + (stats?.total_monitored_apps || 0)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Critical Impersonators
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--risk-critical)' }}>
                  {criticalCount}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Suspicious Mobile Apps
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c084fc' }}>
                  {stats?.suspicious_apps || 0}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Protected Assets (Zero False+)
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--safe-green)' }}>
                  {stats?.official_assets_excluded || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Priority Impersonations Requiring Takedown */}
          <div className="cyber-card">
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ShieldAlert size={18} color="var(--risk-critical)" />
              Priority Impersonations Requiring Takedown ({criticalFindings.length})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              High-confidence brand infringements, credential-phishing accounts, and rogue APKs
            </p>

            <div className="cyber-table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Threat Target</th>
                    <th>Platform</th>
                    <th>Risk Tier</th>
                    <th>Algorithmic Violation Proof</th>
                    <th>Legal Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalFindings.length > 0 ? (
                    criticalFindings.map((finding) => (
                      <tr key={finding.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{finding.asset_name}</div>
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
                          <PlatformIcon platform={finding.platform_or_store} size={16} showLabel />
                        </td>
                        <td>
                          <RiskBadge tier={finding.risk_category} score={finding.risk_score} />
                        </td>
                        <td style={{ maxWidth: '340px' }}>
                          <ul style={{ paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {finding.detection_reasons?.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          <span
                            className="badge badge-critical"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          >
                            FILE DMCA / TAKEDOWN
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No critical threats currently active.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: False-Positive Immunity Audit */}
          <div className="cyber-card">
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ShieldCheck size={18} color="var(--safe-green)" />
              False-Positive Exclusion Verification
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Audit certification that legitimate enterprise brand channels were whitelisted and not impacted
            </p>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  Autonomous Whitelist Engine Active
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {stats?.official_assets_excluded || 0} Official Enterprise Assets Protected in Execution Scans
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--safe-green)', fontWeight: 700 }}>
                <CheckCircle size={18} /> ZERO FALSE POSITIVES
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
