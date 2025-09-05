import React, { useState, useEffect } from 'react';
import type { Preset, CustomPattern, DetectionKind, RedactionStyle } from '@cleanshare/core-detect';
import {
  listPresets,
  listBuiltinPresets,
  listUserPresets,
  listPresetsByDomain,
  getPreset,
  savePreset,
  createPreset,
  duplicatePreset,
  deletePreset,
  importPreset,
  exportPreset,
  exportAllUserPresets,
  importMultiplePresets,
  resetUserPresets,
  validatePreset,
  type PresetImportResult
} from '@cleanshare/core-detect';

interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresetId: string;
  onPresetSelect: (presetId: string) => void;
}

type TabType = 'browse' | 'edit' | 'import' | 'export';

const DETECTION_KINDS: DetectionKind[] = [
  'FACE', 'EMAIL', 'PHONE', 'PAN', 'IBAN', 'SSN', 'PASSPORT', 
  'JWT', 'API_KEY', 'BARCODE', 'NAME', 'ADDRESS', 'OTHER'
];

const REDACTION_STYLES: RedactionStyle[] = [
  'BOX', 'BLUR', 'PIXELATE', 'LABEL', 'MASK_LAST4', 'PATTERN', 
  'GRADIENT', 'SOLID_COLOR', 'VECTOR_OVERLAY', 'REMOVE_METADATA'
];

const DOMAINS = ['Healthcare', 'Finance', 'Legal', 'Government', 'Education', 'Technology', 'General'];

export default function PresetManager({ isOpen, onClose, currentPresetId, onPresetSelect }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('browse');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importText, setImportText] = useState<string>('');
  const [importResults, setImportResults] = useState<PresetImportResult[]>([]);
  const [exportResult, setExportResult] = useState<string>('');

  // Load presets when modal opens
  useEffect(() => {
    if (isOpen) {
      setPresets(listPresets());
    }
  }, [isOpen]);

  const refreshPresets = () => {
    setPresets(listPresets());
  };

  const filteredPresets = presets.filter(preset => {
    const matchesDomain = !filterDomain || preset.domain === filterDomain;
    const matchesSearch = !searchQuery || 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.description && preset.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const handleCreateNew = () => {
    const newPreset: Preset = {
      id: '',
      name: 'New Preset',
      description: '',
      domain: 'General',
      enabledKinds: ['EMAIL', 'PHONE'],
      styleMap: {},
      customRegex: [],
      customPatterns: [],
      defaultRedactionConfig: {
        color: '#000000',
        opacity: 0.9
      },
      confidenceThreshold: 0.6
    };
    setEditingPreset(newPreset);
    setSelectedTab('edit');
  };

  const handleEdit = (preset: Preset) => {
    setEditingPreset({ ...preset });
    setSelectedTab('edit');
  };

  const handleDuplicate = (preset: Preset) => {
    const duplicated = duplicatePreset(preset.id);
    if (duplicated) {
      refreshPresets();
      setEditingPreset(duplicated);
      setSelectedTab('edit');
    }
  };

  const handleDelete = (presetId: string) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      const deleted = deletePreset(presetId);
      if (deleted) {
        refreshPresets();
        // Switch to default preset if current was deleted
        if (presetId === currentPresetId) {
          onPresetSelect('all');
        }
      } else {
        alert('Cannot delete built-in presets');
      }
    }
  };

  const handleSavePreset = () => {
    if (!editingPreset) return;

    try {
      savePreset(editingPreset);
      refreshPresets();
      setEditingPreset(null);
      setSelectedTab('browse');
    } catch (error) {
      alert(`Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    try {
      // Try single preset first
      let results = [importPreset(importText)];
      
      // If that fails, try multiple presets
      if (!results[0].success) {
        results = importMultiplePresets(importText);
      }

      setImportResults(results);
      
      if (results.some(r => r.success)) {
        refreshPresets();
      }
    } catch (error) {
      setImportResults([{
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }]);
    }
  };

  const handleExportPreset = (presetId: string) => {
    const exported = exportPreset(presetId, { format: 'json', includeMetadata: false });
    if (exported) {
      setExportResult(exported);
      setSelectedTab('export');
    }
  };

  const handleExportAll = () => {
    const exported = exportAllUserPresets({ format: 'json', includeMetadata: false });
    setExportResult(exported);
    setSelectedTab('export');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportResult);
    alert('Copied to clipboard!');
  };

  const downloadAsFile = () => {
    const blob = new Blob([exportResult], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleanshare-presets.json';
    link.click();
    URL.revokeObjectURL(url);
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
        minWidth: '800px', 
        maxWidth: '95vw', 
        maxHeight: '90vh', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="card-header">
          <h3 className="card-title">Preset Manager</h3>
          <p className="card-subtitle">Create, edit, and manage detection presets</p>
        </div>

        {/* Tabs */}
        <div style={{ 
          borderBottom: '1px solid var(--border-light)', 
          display: 'flex', 
          gap: '1px',
          background: 'var(--bg-secondary)'
        }}>
          {(['browse', 'edit', 'import', 'export'] as TabType[]).map(tab => (
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
              {tab} {tab === 'edit' && editingPreset && '✏️'}
            </button>
          ))}
        </div>

        <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
          {selectedTab === 'browse' && (
            <div>
              {/* Search and Filter Controls */}
              <div style={{ 
                display: 'flex', 
                gap: 'var(--space-md)', 
                marginBottom: 'var(--space-lg)',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Search presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '200px' }}
                />
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="form-select"
                >
                  <option value="">All Domains</option>
                  {DOMAINS.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                <button onClick={handleCreateNew} className="btn btn-primary">
                  ➕ Create New
                </button>
              </div>

              {/* Presets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {filteredPresets.map(preset => (
                  <div
                    key={preset.id}
                    style={{
                      padding: 'var(--space-md)',
                      border: `2px solid ${preset.id === currentPresetId ? 'var(--color-primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: preset.id === currentPresetId ? 'var(--bg-secondary)' : 'var(--bg-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                          <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{preset.name}</h4>
                          {preset.domain && (
                            <span style={{ 
                              padding: '2px 6px', 
                              background: 'var(--color-primary)', 
                              color: 'white', 
                              borderRadius: '3px', 
                              fontSize: 'var(--font-size-xs)' 
                            }}>
                              {preset.domain}
                            </span>
                          )}
                          {!preset.isUserCreated && (
                            <span style={{ 
                              padding: '2px 6px', 
                              background: 'var(--color-secondary)', 
                              color: 'white', 
                              borderRadius: '3px', 
                              fontSize: 'var(--font-size-xs)' 
                            }}>
                              Built-in
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <p style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {preset.description}
                          </p>
                        )}
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          {preset.enabledKinds.length} detectors • Confidence: {Math.round((preset.confidenceThreshold || 0.6) * 100)}%
                          {preset.customPatterns && preset.customPatterns.length > 0 && (
                            <> • {preset.customPatterns.length} custom patterns</>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                        <button
                          onClick={() => onPresetSelect(preset.id)}
                          className={`btn btn-sm ${preset.id === currentPresetId ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {preset.id === currentPresetId ? '✓ Active' : 'Use'}
                        </button>
                        <button
                          onClick={() => handleEdit(preset)}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(preset)}
                          className="btn btn-outline btn-sm"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleExportPreset(preset.id)}
                          className="btn btn-outline btn-sm"
                        >
                          Export
                        </button>
                        {preset.isUserCreated && (
                          <button
                            onClick={() => handleDelete(preset.id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-error)' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPresets.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  No presets match your search criteria
                </div>
              )}
            </div>
          )}

          {selectedTab === 'edit' && editingPreset && (
            <EditPresetForm
              preset={editingPreset}
              onChange={setEditingPreset}
              onSave={handleSavePreset}
              onCancel={() => {
                setEditingPreset(null);
                setSelectedTab('browse');
              }}
            />
          )}

          {selectedTab === 'import' && (
            <div>
              <h4 style={{ marginBottom: 'var(--space-md)' }}>Import Presets</h4>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }}>
                  JSON Data
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste preset JSON data here..."
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: 'var(--space-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button onClick={handleImport} className="btn btn-primary">
                  Import Presets
                </button>
                <button 
                  onClick={() => setImportText('')} 
                  className="btn btn-outline"
                >
                  Clear
                </button>
              </div>

              {importResults.length > 0 && (
                <div>
                  <h5 style={{ marginBottom: 'var(--space-sm)' }}>Import Results</h5>
                  {importResults.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        padding: 'var(--space-sm)',
                        border: `1px solid ${result.success ? 'var(--color-success)' : 'var(--color-error)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: result.success ? 'var(--bg-success)' : 'var(--bg-error)',
                        marginBottom: 'var(--space-sm)'
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>
                        {result.success ? '✅ Success' : '❌ Failed'}
                        {result.preset && `: ${result.preset.name}`}
                      </div>
                      {result.errors.length > 0 && (
                        <ul style={{ margin: 'var(--space-xs) 0 0 0', paddingLeft: '20px' }}>
                          {result.errors.map((error, i) => (
                            <li key={i} style={{ color: 'var(--color-error)' }}>{error}</li>
                          ))}
                        </ul>
                      )}
                      {result.warnings.length > 0 && (
                        <ul style={{ margin: 'var(--space-xs) 0 0 0', paddingLeft: '20px' }}>
                          {result.warnings.map((warning, i) => (
                            <li key={i} style={{ color: 'var(--color-warning)' }}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'export' && (
            <div>
              <h4 style={{ marginBottom: 'var(--space-md)' }}>Export Presets</h4>
              
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button onClick={handleExportAll} className="btn btn-primary">
                  Export All User Presets
                </button>
              </div>

              {exportResult && (
                <div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <button onClick={copyToClipboard} className="btn btn-secondary">
                      📋 Copy to Clipboard
                    </button>
                    <button onClick={downloadAsFile} className="btn btn-secondary">
                      💾 Download File
                    </button>
                  </div>
                  
                  <textarea
                    readOnly
                    value={exportResult}
                    style={{
                      width: '100%',
                      height: '300px',
                      padding: 'var(--space-sm)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)',
                      background: 'var(--bg-secondary)'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {presets.filter(p => p.isUserCreated).length} user presets • {presets.filter(p => !p.isUserCreated).length} built-in
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

// Edit Preset Form Component
function EditPresetForm({ 
  preset, 
  onChange, 
  onSave, 
  onCancel 
}: { 
  preset: Preset; 
  onChange: (preset: Preset) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [activeSection, setActiveSection] = useState<'basic' | 'detectors' | 'styles' | 'patterns' | 'advanced'>('basic');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h4>{preset.id ? 'Edit Preset' : 'Create New Preset'}</h4>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={onSave} className="btn btn-primary">
            💾 Save Preset
          </button>
          <button onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {(['basic', 'detectors', 'styles', 'patterns', 'advanced'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`btn btn-sm ${activeSection === section ? 'btn-primary' : 'btn-outline'}`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {activeSection === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }}>
              Name *
            </label>
            <input
              type="text"
              value={preset.name}
              onChange={(e) => onChange({ ...preset, name: e.target.value })}
              className="form-input"
              placeholder="Enter preset name"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }}>
              Description
            </label>
            <textarea
              value={preset.description || ''}
              onChange={(e) => onChange({ ...preset, description: e.target.value })}
              className="form-input"
              placeholder="Describe what this preset is for"
              rows={3}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }}>
              Domain
            </label>
            <select
              value={preset.domain || 'General'}
              onChange={(e) => onChange({ ...preset, domain: e.target.value as any })}
              className="form-select"
            >
              {DOMAINS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }}>
              Confidence Threshold: {Math.round((preset.confidenceThreshold || 0.6) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preset.confidenceThreshold || 0.6}
              onChange={(e) => onChange({ ...preset, confidenceThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Only show detections above this confidence level
            </div>
          </div>
        </div>
      )}

      {activeSection === 'detectors' && (
        <div>
          <h5 style={{ marginBottom: 'var(--space-md)' }}>Enabled Detection Types</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
            {DETECTION_KINDS.map(kind => (
              <label key={kind} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <input
                  type="checkbox"
                  checked={preset.enabledKinds.includes(kind)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...preset.enabledKinds, kind]
                      : preset.enabledKinds.filter(k => k !== kind);
                    onChange({ ...preset, enabledKinds: updated });
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{kind}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'styles' && (
        <div>
          <h5 style={{ marginBottom: 'var(--space-md)' }}>Default Redaction Styles</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {preset.enabledKinds.map(kind => (
              <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span style={{ minWidth: '120px', fontWeight: '600' }}>{kind}:</span>
                <select
                  value={preset.styleMap?.[kind] || 'BOX'}
                  onChange={(e) => onChange({
                    ...preset,
                    styleMap: {
                      ...preset.styleMap,
                      [kind]: e.target.value as RedactionStyle
                    }
                  })}
                  className="form-select"
                  style={{ minWidth: '150px' }}
                >
                  {REDACTION_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'patterns' && (
        <div>
          <h5 style={{ marginBottom: 'var(--space-md)' }}>Custom Detection Patterns</h5>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <button 
              onClick={() => {
                const newPattern: CustomPattern = {
                  id: `pattern_${Date.now()}`,
                  name: 'New Pattern',
                  pattern: '',
                  kind: 'OTHER',
                  confidence: 0.8,
                  description: '',
                  caseSensitive: false
                };
                onChange({
                  ...preset,
                  customPatterns: [...(preset.customPatterns || []), newPattern]
                });
              }}
              className="btn btn-primary btn-sm"
            >
              ➕ Add Pattern
            </button>
          </div>
          
          {(preset.customPatterns || []).map((pattern, index) => (
            <div 
              key={pattern.id}
              style={{
                padding: 'var(--space-md)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <h6 style={{ margin: 0 }}>Pattern {index + 1}</h6>
                <button
                  onClick={() => {
                    const updated = preset.customPatterns?.filter((_, i) => i !== index) || [];
                    onChange({ ...preset, customPatterns: updated });
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--color-error)' }}
                >
                  Remove
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                <div>
                  <label>Name</label>
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => {
                      const updated = [...(preset.customPatterns || [])];
                      updated[index] = { ...pattern, name: e.target.value };
                      onChange({ ...preset, customPatterns: updated });
                    }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label>Kind</label>
                  <select
                    value={pattern.kind}
                    onChange={(e) => {
                      const updated = [...(preset.customPatterns || [])];
                      updated[index] = { ...pattern, kind: e.target.value as DetectionKind };
                      onChange({ ...preset, customPatterns: updated });
                    }}
                    className="form-select"
                  >
                    {DETECTION_KINDS.map(kind => (
                      <option key={kind} value={kind}>{kind}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <label>Regular Expression Pattern</label>
                <input
                  type="text"
                  value={pattern.pattern}
                  onChange={(e) => {
                    const updated = [...(preset.customPatterns || [])];
                    updated[index] = { ...pattern, pattern: e.target.value };
                    onChange({ ...preset, customPatterns: updated });
                  }}
                  className="form-input"
                  placeholder="e.g., \\b\\d{3}-\\d{2}-\\d{4}\\b"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-md)' }}>
                <div>
                  <label>Description</label>
                  <input
                    type="text"
                    value={pattern.description}
                    onChange={(e) => {
                      const updated = [...(preset.customPatterns || [])];
                      updated[index] = { ...pattern, description: e.target.value };
                      onChange({ ...preset, customPatterns: updated });
                    }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label>Confidence</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={pattern.confidence}
                    onChange={(e) => {
                      const updated = [...(preset.customPatterns || [])];
                      updated[index] = { ...pattern, confidence: parseFloat(e.target.value) };
                      onChange({ ...preset, customPatterns: updated });
                    }}
                    className="form-input"
                    style={{ width: '80px' }}
                  />
                </div>
                <div>
                  <label>Case Sensitive</label>
                  <input
                    type="checkbox"
                    checked={pattern.caseSensitive || false}
                    onChange={(e) => {
                      const updated = [...(preset.customPatterns || [])];
                      updated[index] = { ...pattern, caseSensitive: e.target.checked };
                      onChange({ ...preset, customPatterns: updated });
                    }}
                    style={{ marginTop: 'var(--space-sm)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <h5>Default Redaction Configuration</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <label>Color</label>
                <input
                  type="color"
                  value={preset.defaultRedactionConfig?.color || '#000000'}
                  onChange={(e) => onChange({
                    ...preset,
                    defaultRedactionConfig: {
                      ...preset.defaultRedactionConfig,
                      color: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>
              <div>
                <label>Opacity: {Math.round((preset.defaultRedactionConfig?.opacity || 0.9) * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preset.defaultRedactionConfig?.opacity || 0.9}
                  onChange={(e) => onChange({
                    ...preset,
                    defaultRedactionConfig: {
                      ...preset.defaultRedactionConfig,
                      opacity: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
            
            <div style={{ marginTop: 'var(--space-md)' }}>
              <label>Default Label Text</label>
              <input
                type="text"
                value={preset.defaultRedactionConfig?.labelText || ''}
                onChange={(e) => onChange({
                  ...preset,
                  defaultRedactionConfig: {
                    ...preset.defaultRedactionConfig,
                    labelText: e.target.value
                  }
                })}
                className="form-input"
                placeholder="[REDACTED]"
              />
            </div>
          </div>

          <div>
            <h5>Legacy Custom Regex (Deprecated)</h5>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Use Custom Patterns instead for better control
            </div>
            <textarea
              value={preset.customRegex?.join('\n') || ''}
              onChange={(e) => onChange({
                ...preset,
                customRegex: e.target.value.split('\n').filter(line => line.trim())
              })}
              className="form-input"
              rows={4}
              placeholder="One regex pattern per line"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}