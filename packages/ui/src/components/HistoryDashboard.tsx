import React, { useState, useEffect } from 'react';
import {
  getSessions,
  getAllRecords,
  getProcessingStats,
  exportHistory,
  clearHistory,
  type ProcessingSession,
  type FileProcessingRecord,
  type ProcessingStats
} from '@cleanshare/core-detect';

interface HistoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'sessions' | 'analytics' | 'export';

export default function HistoryDashboard({ isOpen, onClose }: HistoryDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [sessions, setSessions] = useState<ProcessingSession[]>([]);
  const [records, setRecords] = useState<FileProcessingRecord[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    setSessions(getSessions());
    setRecords(getAllRecords());
    setStats(getProcessingStats());
  };

  const handleDateRangeChange = () => {
    if (dateRange.start && dateRange.end) {
      const filteredStats = getProcessingStats({
        start: dateRange.start,
        end: dateRange.end
      });
      setStats(filteredStats);
    } else {
      setStats(getProcessingStats());
    }
  };

  const handleExport = () => {
    const exported = exportHistory({
      format: exportFormat,
      dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
      includeFileDetails: true,
      includeDetectionDetails: false
    });

    const blob = new Blob([exported], { 
      type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleanshare-history.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all processing history? This cannot be undone.')) {
      clearHistory();
      refreshData();
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }}>
      <div className="card" style={{
        minWidth: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="card-header">
          <h3 className="card-title">Processing History & Analytics</h3>
          <p className="card-subtitle">View processing statistics and audit trail</p>
        </div>

        {/* Tabs */}
        <div style={{
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          gap: '1px',
          background: 'var(--bg-secondary)'
        }}>
          {(['overview', 'sessions', 'analytics', 'export'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                border: 'none',
                background: selectedTab === tab ? 'var(--bg-primary)' : 'transparent',
                color: selectedTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: selectedTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: selectedTab === tab ? '600' : '400',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
          {/* Date Range Filter */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <label style={{ fontWeight: '600' }}>Date Range:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="form-input"
                style={{ width: '150px' }}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="form-input"
                style={{ width: '150px' }}
              />
              <button onClick={handleDateRangeChange} className="btn btn-outline btn-sm">
                Apply Filter
              </button>
              <button 
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setStats(getProcessingStats());
                }}
                className="btn btn-outline btn-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {selectedTab === 'overview' && stats && (
            <div>
              {/* Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)'
              }}>
                <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {stats.totalSessions}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Total Sessions</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {stats.totalFiles}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Files Processed</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {stats.totalDetections.toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Detections Made</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {Math.round(stats.successRate * 100)}%
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Success Rate</div>
                </div>
              </div>

              {/* Detection Types Chart */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                  <h4 className="card-title">Detection Types</h4>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {Object.entries(stats.detectionsByType)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => {
                        const percentage = (count / stats.totalDetections) * 100;
                        return (
                          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ minWidth: '100px', fontWeight: '600' }}>{type}</div>
                            <div style={{ 
                              flex: 1, 
                              height: '20px', 
                              background: 'var(--bg-secondary)', 
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${percentage}%`,
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <div style={{ minWidth: '60px', textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                              {count} ({percentage.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Recent Activity</h4>
                </div>
                <div className="card-body">
                  {records.slice(0, 10).map(record => {
                    const session = sessions.find(s => s.id === record.sessionId);
                    return (
                      <div
                        key={record.id}
                        style={{
                          padding: 'var(--space-sm)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: 'var(--space-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600' }}>{record.fileName}</div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {record.totalDetections} detections • {formatDuration(record.processingTime)}
                            {session?.presetName && ` • ${session.presetName}`}
                          </div>
                        </div>
                        <div style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                          background: record.status === 'completed' ? 'var(--color-success)' : 
                                    record.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)',
                          color: 'white'
                        }}>
                          {record.status}
                        </div>
                      </div>
                    );
                  })}
                  {records.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--space-xl)' }}>
                      No processing history yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'sessions' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                  >
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                              Session {formatDate(session.startTime)}
                            </span>
                            {session.presetName && (
                              <span style={{
                                padding: '2px 6px',
                                background: 'var(--color-secondary)',
                                color: 'white',
                                borderRadius: '3px',
                                fontSize: 'var(--font-size-xs)'
                              }}>
                                {session.presetName}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            {session.processedFiles}/{session.totalFiles} files processed
                            {session.failedFiles > 0 && ` • ${session.failedFiles} failed`}
                            {session.endTime && ` • Duration: ${formatDuration(new Date(session.endTime).getTime() - new Date(session.startTime).getTime())}`}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          background: session.status === 'completed' ? 'var(--color-success)' :
                                    session.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)',
                          color: 'white'
                        }}>
                          {session.status}
                        </div>
                      </div>

                      {selectedSession === session.id && (
                        <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-md)' }}>
                          <h5 style={{ marginBottom: 'var(--space-sm)' }}>Session Files</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {records
                              .filter(r => r.sessionId === session.id)
                              .map(record => (
                                <div
                                  key={record.id}
                                  style={{
                                    padding: 'var(--space-xs) var(--space-sm)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: '600' }}>{record.fileName}</span>
                                    <span style={{ marginLeft: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                                      ({formatFileSize(record.fileSize)})
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                      {record.totalDetections} detections
                                    </span>
                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                      {formatDuration(record.processingTime)}
                                    </span>
                                    <span style={{
                                      padding: '1px 6px',
                                      borderRadius: '8px',
                                      fontSize: 'var(--font-size-xs)',
                                      background: record.status === 'completed' ? 'var(--color-success)' :
                                                record.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)',
                                      color: 'white'
                                    }}>
                                      {record.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--space-xl)' }}>
                    No processing sessions yet
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && stats && (
            <div>
              {/* Processing Time Trends */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                  <h4 className="card-title">Processing Performance</h4>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <strong>Average Processing Time:</strong> {formatDuration(stats.averageProcessingTime)}
                  </div>
                  {stats.processingTimesByDate.length > 0 && (
                    <div>
                      <h5>Daily Processing Times</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {stats.processingTimesByDate.slice(-10).map(({ date, averageTime, fileCount }) => (
                          <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{new Date(date).toLocaleDateString()}</span>
                            <span>{fileCount} files</span>
                            <span>{formatDuration(averageTime)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Distribution */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                  <h4 className="card-title">Detection Confidence Distribution</h4>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {[
                      { label: 'High Confidence (80%+)', count: stats.detectionsByConfidence.high, color: 'var(--color-success)' },
                      { label: 'Medium Confidence (50-80%)', count: stats.detectionsByConfidence.medium, color: 'var(--color-warning)' },
                      { label: 'Low Confidence (<50%)', count: stats.detectionsByConfidence.low, color: 'var(--color-error)' }
                    ].map(({ label, count, color }) => {
                      const percentage = stats.totalDetections > 0 ? (count / stats.totalDetections) * 100 : 0;
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                          <div style={{ minWidth: '180px' }}>{label}</div>
                          <div style={{ 
                            flex: 1, 
                            height: '20px', 
                            background: 'var(--bg-secondary)', 
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${percentage}%`,
                              background: color,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <div style={{ minWidth: '80px', textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                            {count} ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preset Usage */}
              {Object.keys(stats.presetUsage).length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">Preset Usage</h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                      {Object.entries(stats.presetUsage)
                        .sort(([,a], [,b]) => b - a)
                        .map(([presetName, usage]) => {
                          const totalUsage = Object.values(stats.presetUsage).reduce((sum, count) => sum + count, 0);
                          const percentage = (usage / totalUsage) * 100;
                          return (
                            <div key={presetName} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                              <div style={{ minWidth: '150px', fontWeight: '600' }}>{presetName}</div>
                              <div style={{ 
                                flex: 1, 
                                height: '20px', 
                                background: 'var(--bg-secondary)', 
                                borderRadius: '10px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: 'var(--color-secondary)',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <div style={{ minWidth: '80px', textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                                {usage} ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'export' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div>
                  <h4 style={{ marginBottom: 'var(--space-md)' }}>Export Processing History</h4>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <input
                        type="radio"
                        value="json"
                        checked={exportFormat === 'json'}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      />
                      JSON (Complete Data)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <input
                        type="radio"
                        value="csv"
                        checked={exportFormat === 'csv'}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      />
                      CSV (Tabular Data)
                    </label>
                  </div>

                  <button onClick={handleExport} className="btn btn-primary">
                    📊 Export {exportFormat.toUpperCase()}
                  </button>
                </div>

                <div>
                  <h4 style={{ marginBottom: 'var(--space-md)' }}>Clear History</h4>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    This will permanently delete all processing history and cannot be undone.
                  </p>
                  <button 
                    onClick={handleClearHistory} 
                    className="btn btn-outline"
                    style={{ color: 'var(--color-error)' }}
                  >
                    🗑️ Clear All History
                  </button>
                </div>

                {stats && (
                  <div className="card">
                    <div className="card-header">
                      <h4 className="card-title">Export Preview</h4>
                    </div>
                    <div className="card-body">
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Your export will include:
                        <ul style={{ marginTop: 'var(--space-xs)', paddingLeft: '20px' }}>
                          <li>{stats.totalSessions} processing sessions</li>
                          <li>{stats.totalFiles} file records</li>
                          <li>{stats.totalDetections} detection entries</li>
                          <li>Processing performance metrics</li>
                          <li>Detection confidence statistics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {sessions.length} sessions • {records.length} files processed
              {stats && ` • ${Math.round(stats.successRate * 100)}% success rate`}
            </div>
            <button onClick={onClose} className="btn btn-ghost">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}