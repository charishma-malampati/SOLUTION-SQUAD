import React from 'react';
import { BrandProfile, DashboardStats, Finding } from '../types';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PlatformIcon } from '../components/PlatformIcon';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface DashboardProps {
  brand: BrandProfile | null;
  stats: DashboardStats | null;
  recentFindings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onNavigate: (page: any) => void;
  onRunScan: () => void;
  isScanning: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  brand,
  stats,
  recentFindings,
  onSelectFinding,
  onNavigate,
  onRunScan,
  isScanning,
}) => {
  const riskDist = stats?.risk_distribution || {};
  const criticalCount = riskDist['critical'] || riskDist['Critical'] || 0;
  const highCount = riskDist['high'] || riskDist['High'] || 0;
  const mediumCount = riskDist['medium'] || riskDist['Medium'] || 0;
  const lowCount = riskDist['low'] || riskDist['Low'] || 0;
  const totalFindings = criticalCount + highCount + mediumCount + lowCount;

  const totalMonitored =
    (stats?.total_monitored_social || 0) + (stats?.total_monitored_apps || 0);

  return (
    <div className="page-wrapper">
      {/* Brand Header Banner */}
      <div
        className="cyber-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.9) 0%, rgba(10, 15, 29, 0.95) 100%)',
          borderColor: 'var(--border-highlight)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-cyan)',
              }}
            >
              Active Brand Perimeter
            </span>
            <span className="badge badge-safe">MONITORING ACTIVE</span>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              marginTop: '0.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            {brand?.name || 'NovaPay'} — Threat Protection Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Protected Domain: <strong style={{ color: '#fff' }}>{brand?.website || 'novapay.io'}</strong> •
            Keywords: {brand?.keywords || 'novapay, mobile payments, instant credit'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onNavigate('findings')}
            className="btn btn-secondary btn-sm"
          >
            Review All Threats <ArrowRight size={14} />
          </button>
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="btn btn-primary btn-sm"
          >
            <Zap size={14} />
            {isScanning ? 'Scanning...' : 'Trigger Scan Engine'}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          title="Critical Impersonations"
          value={criticalCount}
          subtitle="Immediate takedown candidates"
          icon={<ShieldAlert size={22} />}
          variant="red"
          highlight={criticalCount > 0}
        />
        <StatCard
          title="High Risk Anomalies"
          value={highCount}
          subtitle="Homoglyphs & unauthorized affixes"
          icon={<AlertTriangle size={22} />}
          variant="amber"
        />
        <StatCard
          title="Monitored Entities"
          value={totalMonitored}
          subtitle={`${stats?.total_monitored_social || 0} Social / ${stats?.total_monitored_apps || 0} Apps`}
          icon={<Layers size={22} />}
          variant="blue"
        />
        <StatCard
          title="Protected Official Assets"
          value={stats?.official_assets_excluded || 0}
          subtitle="Guaranteed false-positive immunity"
          icon={<ShieldCheck size={22} />}
          variant="green"
        />
      </div>

      {/* Threat Posture & Risk Distribution */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Risk Severity Breakdown */}
        <div className="cyber-card">
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Activity size={18} color="var(--accent-cyan)" />
            Threat Severity Distribution
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--risk-critical)', fontWeight: 600 }}>Critical Severity</span>
                <span style={{ fontWeight: 700 }}>
                  {criticalCount} ({totalFindings ? Math.round((criticalCount / totalFindings) * 100) : 0}%)
                </span>
              </div>
              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${totalFindings ? (criticalCount / totalFindings) * 100 : 0}%`,
                    background: 'var(--risk-critical)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--risk-high)', fontWeight: 600 }}>High Severity</span>
                <span style={{ fontWeight: 700 }}>
                  {highCount} ({totalFindings ? Math.round((highCount / totalFindings) * 100) : 0}%)
                </span>
              </div>
              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${totalFindings ? (highCount / totalFindings) * 100 : 0}%`,
                    background: 'var(--risk-high)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--risk-medium)', fontWeight: 600 }}>Medium Severity</span>
                <span style={{ fontWeight: 700 }}>
                  {mediumCount} ({totalFindings ? Math.round((mediumCount / totalFindings) * 100) : 0}%)
                </span>
              </div>
              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${totalFindings ? (mediumCount / totalFindings) * 100 : 0}%`,
                    background: 'var(--risk-medium)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Low / Safe</span>
                <span style={{ fontWeight: 700 }}>
                  {lowCount} ({totalFindings ? Math.round((lowCount / totalFindings) * 100) : 0}%)
                </span>
              </div>
              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${totalFindings ? (lowCount / totalFindings) * 100 : 0}%`,
                    background: 'var(--risk-low)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Vectors Breakdown */}
        <div className="cyber-card">
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Layers size={18} color="var(--accent-blue)" />
            Attack Surface by Platform
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {stats?.platform_distribution && Object.keys(stats.platform_distribution).length > 0 ? (
              Object.entries(stats.platform_distribution).map(([platform, count]) => (
                <div
                  key={platform}
                  style={{
                    flex: '1 1 calc(50% - 0.5rem)',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PlatformIcon platform={platform} size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
                      {platform.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '1rem' }}>
                No platform threats identified yet. Run a scan to discover vectors.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority Threat Alerts Table */}
      <div className="cyber-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Priority Threat Detections</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Top impersonation suspects requiring security analyst triage
            </p>
          </div>
          <button
            onClick={() => onNavigate('findings')}
            className="btn btn-outline btn-sm"
          >
            View All ({recentFindings.length})
          </button>
        </div>

        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Target Asset</th>
                <th>Platform / Channel</th>
                <th>Asset Type</th>
                <th>Risk Tier</th>
                <th>Primary Detection Reason</th>
                <th>Review Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentFindings.length > 0 ? (
                recentFindings.slice(0, 6).map((finding) => (
                  <tr key={finding.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{finding.asset_name}</div>
                      {finding.source_url && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-dim)',
                            maxWidth: '220px',
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
                    </td>
                    <td>
                      <RiskBadge tier={finding.risk_category} score={finding.risk_score} />
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-main)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {finding.detection_reasons?.[0] || 'High similarity match'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={finding.review_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectFinding(finding)}
                        className="btn btn-secondary btn-sm"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No threats detected yet. Click "Trigger Scan Engine" or "Load Demo" in the top bar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
