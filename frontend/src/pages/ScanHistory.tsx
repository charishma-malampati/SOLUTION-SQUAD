import React from 'react';
import { ScanHistory as ScanHistoryType } from '../types';
import { StatCard } from '../components/StatCard';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface ScanHistoryProps {
  scans: ScanHistoryType[];
  onRefresh: () => Promise<void>;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ scans }) => {
  const totalScans = scans.length;
  const totalEvaluated = scans.reduce((acc, s) => acc + (s.records_processed || 0), 0);
  const totalAlerts = scans.reduce((acc, s) => acc + (s.alerts_generated || 0), 0);
  const totalExcluded = scans.reduce((acc, s) => acc + (s.excluded_assets_count || 0), 0);

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
            <History size={18} color="var(--accent-purple)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-purple)',
              }}
            >
              Audit Trail
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Detection Engine Execution Log ({scans.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Historical audit log tracking scan execution times, entity counts, and exclusion metrics
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Scans Run"
          value={totalScans}
          subtitle="Autonomous sweeps"
          icon={<History size={22} />}
          variant="indigo"
        />
        <StatCard
          title="Entities Evaluated"
          value={totalEvaluated}
          subtitle="Profiles & app listings"
          icon={<Layers size={22} />}
          variant="blue"
        />
        <StatCard
          title="Alerts Generated"
          value={totalAlerts}
          subtitle="Identified threat vectors"
          icon={<AlertTriangle size={22} />}
          variant="red"
        />
        <StatCard
          title="Assets Protected"
          value={totalExcluded}
          subtitle="Cumulative safe exclusions"
          icon={<ShieldCheck size={22} />}
          variant="green"
        />
      </div>

      {/* Scans Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Execution Type</th>
              <th>Records Processed</th>
              <th>Alerts Generated</th>
              <th>Excluded Assets</th>
              <th>Status</th>
              <th>Notes & Details</th>
              <th style={{ textAlign: 'right' }}>Executed At</th>
            </tr>
          </thead>
          <tbody>
            {scans.length > 0 ? (
              scans.map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      #SCAN-{scan.id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color:
                          scan.scan_type === 'full'
                            ? 'var(--accent-cyan)'
                            : scan.scan_type === 'social'
                            ? '#38bdf8'
                            : '#818cf8',
                      }}
                    >
                      {scan.scan_type} Scan
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {scan.records_processed}
                    </span>
                  </td>
                  <td>
                    {scan.alerts_generated > 0 ? (
                      <span
                        className="badge badge-critical"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {scan.alerts_generated} ALERTS
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>0 alerts</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge badge-safe"
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {scan.excluded_assets_count} EXCLUDED
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8rem',
                        color:
                          scan.status === 'completed' || scan.status === 'COMPLETED'
                            ? 'var(--safe-green)'
                            : '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={14} /> {scan.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {scan.notes || 'Routine autonomous sweep'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(scan.started_at).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  No scans have run yet. Click "Trigger Scan Engine" or "Load Demo" to initialize.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
