// CleanShare Pro - Modern UI Implementation
import React, { useState, useEffect } from 'react';
import type {
  Detection,
  RedactionAction,
  RedactionStyle,
  Preset,
  DetectionKind
} from '@cleanshare/core-detect';
import { analyzeDocument, applyRedactions, listPresets, savePreset, deletePreset } from '@cleanshare/core-detect';

interface FileState {
  file: File;
  detections: Detection[];
  selected: Record<string, boolean>;
  actions: Record<string, { style: RedactionStyle; labelText?: string }>;
  pages: number;
  pageImages: string[];
  currentPage: number;
  outputUri?: string;
  previewUri?: string; // Preview of sanitized file
  processing?: boolean;
  error?: string;
}

export default function CleanSharePro() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [showPresetEditor, setShowPresetEditor] = useState(false);

  // Load presets on mount
  useEffect(() => {
    const ps = listPresets();
    setPresets(ps);
    if (ps.length > 0) {
      setPresetId(ps[0].id);
    }
  }, []);

  // Process files when they change
  useEffect(() => {
    if (files.length === 0) return;
    
    async function processFiles() {
      setLoading(true);
      const newStates: FileState[] = [];
      
      for (const file of files) {
        try {
          const result = await analyzeDocument(file, { presetId });
          const selected: Record<string, boolean> = {};
          const actions: Record<string, { style: RedactionStyle; labelText?: string }> = {};
          
          result.detections.forEach(det => {
            selected[det.id] = true;
            actions[det.id] = { style: 'BOX' };
          });

          newStates.push({
            file,
            detections: result.detections,
            selected,
            actions,
            pages: result.pages || 1,
            pageImages: [],
            currentPage: 0,
            processing: false
          });
        } catch (error) {
          console.error('Failed to process file:', file.name, error);
          // Add the file with error state
          newStates.push({
            file,
            detections: [],
            selected: {},
            actions: {},
            pages: 1,
            pageImages: [],
            currentPage: 0,
            processing: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      setFileStates(newStates);
      setLoading(false);
    }
    
    processFiles();
  }, [files, presetId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setCurrentFileIndex(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setCurrentFileIndex(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSanitize = async (fileIndex: number) => {
    const fileState = fileStates[fileIndex];
    if (!fileState) return;

    // Update processing state
    setFileStates(prev => prev.map((state, i) => 
      i === fileIndex ? { ...state, processing: true } : state
    ));

    try {
      // Re-analyze the file to ensure lastResult is set correctly
      await analyzeDocument(fileState.file, { presetId });
      
      const redactionActions: RedactionAction[] = fileState.detections
        .filter(det => fileState.selected[det.id])
        .map(det => ({
          id: det.id,
          action: 'REDACT' as const,
          style: fileState.actions[det.id]?.style || 'BOX',
          labelText: fileState.actions[det.id]?.labelText
        }));

      const result = await applyRedactions(fileState.file, redactionActions, {
        style: 'BOX'
      });

      // Convert data URI to blob for download
      const response = await fetch(result.fileUri);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Update file state with result
      setFileStates(prev => prev.map((state, i) => 
        i === fileIndex ? { ...state, outputUri: url, previewUri: result.fileUri, processing: false } : state
      ));

    } catch (error) {
      console.error('Sanitization failed:', error);
      // Show error to user
      alert(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFileStates(prev => prev.map((state, i) => 
        i === fileIndex ? { ...state, processing: false } : state
      ));
    }
  };

  const handleDownload = (fileIndex: number) => {
    const fileState = fileStates[fileIndex];
    if (!fileState?.outputUri) return;

    const link = document.createElement('a');
    link.href = fileState.outputUri;
    link.download = `sanitized_${fileState.file.name}`;
    link.click();
  };

  const currentFileState = fileStates[currentFileIndex];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo">
            CleanShare Pro
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {presets.length > 0 && (
              <select 
                value={presetId} 
                onChange={(e) => setPresetId(e.target.value)}
                className="form-select"
                style={{ minWidth: '150px' }}
              >
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setProUnlocked(!proUnlocked)}
              className={`btn ${proUnlocked ? 'btn-secondary' : 'btn-outline'} btn-sm`}
            >
              {proUnlocked ? '✓ Pro Unlocked' : '🔓 Unlock Pro'}
            </button>
            {proUnlocked && (
              <button
                onClick={() => setShowPresetEditor(true)}
                className="btn btn-primary btn-sm"
              >
                Manage Presets
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* File Upload Section */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header">
            <h2 className="card-title">Upload Files</h2>
            <p className="card-subtitle">Select images or PDF documents to sanitize</p>
          </div>
          <div className="card-body">
            <div 
              className="file-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">
                Drop files here or click to browse
              </div>
              <div className="file-upload-subtext">
                Supports JPG, PNG, PDF files up to 10MB each
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            
            {loading && (
              <div className="loading-text" style={{ marginTop: 'var(--space-md)' }}>
                <div className="loading-spinner"></div>
                Processing files...
              </div>
            )}
          </div>
        </div>

        {/* File Processing Results */}
        {fileStates.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
            {/* File List Sidebar */}
            <div className="sidebar" style={{ minWidth: '250px' }}>
              <h3 className="sidebar-title">Files ({fileStates.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {fileStates.map((state, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentFileIndex(index)}
                    style={{
                      padding: 'var(--space-md)',
                      border: `2px solid ${index === currentFileIndex ? 'var(--color-primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: index === currentFileIndex ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-xs)' }}>
                      {state.file.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: state.error ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                      {state.error ? `Error: ${state.error}` : `${state.detections.length} detections found`}
                    </div>
                    <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSanitize(index);
                        }}
                        className="btn btn-primary btn-sm"
                        disabled={state.processing || !!state.error}
                        style={{ flex: 1 }}
                      >
                        {state.processing ? 'Processing...' : 'Sanitize'}
                      </button>
                      {state.outputUri && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(index);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1 }}>
              {currentFileState && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">{currentFileState.file.name}</h3>
                    <p className="card-subtitle">
                      {currentFileState.error ? 'Processing failed' : `Found ${currentFileState.detections.length} sensitive items`}
                    </p>
                  </div>
                  <div className="card-body">
                    {currentFileState.error ? (
                      <div className="alert alert-error">
                        <div>
                          <strong>Processing Error</strong>
                          <p style={{ margin: '0', marginTop: 'var(--space-xs)' }}>
                            Failed to analyze this file: {currentFileState.error}
                          </p>
                        </div>
                      </div>
                    ) : currentFileState.detections.length > 0 ? (
                      <div>
                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-lg)' }}>
                          Detected Sensitive Information
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                          {currentFileState.detections.map(detection => (
                            <div
                              key={detection.id}
                              style={{
                                padding: 'var(--space-md)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <input
                                  type="checkbox"
                                  checked={currentFileState.selected[detection.id] || false}
                                  onChange={(e) => {
                                    setFileStates(prev => prev.map((state, i) => 
                                      i === currentFileIndex ? {
                                        ...state,
                                        selected: {
                                          ...state.selected,
                                          [detection.id]: e.target.checked
                                        }
                                      } : state
                                    ));
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
                                    {detection.kind}: {detection.text}
                                  </div>
                                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                    Confidence: {Math.round(detection.confidence * 100)}%
                                  </div>
                                </div>
                              </div>
                              <select
                                value={currentFileState.actions[detection.id]?.style || 'BOX'}
                                onChange={(e) => {
                                  setFileStates(prev => prev.map((state, i) => 
                                    i === currentFileIndex ? {
                                      ...state,
                                      actions: {
                                        ...state.actions,
                                        [detection.id]: {
                                          ...state.actions[detection.id],
                                          style: e.target.value as RedactionStyle
                                        }
                                      }
                                    } : state
                                  ));
                                }}
                                className="form-select"
                                style={{ minWidth: '120px' }}
                              >
                                <option value="BOX">Black Box</option>
                                <option value="BLUR">Blur</option>
                                <option value="PIXELATE">Pixelate</option>
                                <option value="LABEL">Label</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        
                        <div className="card-footer" style={{ marginTop: 'var(--space-xl)' }}>
                          <button
                            onClick={() => handleSanitize(currentFileIndex)}
                            className="btn btn-primary btn-lg"
                            disabled={currentFileState.processing}
                          >
                            {currentFileState.processing ? (
                              <>
                                <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                                Processing...
                              </>
                            ) : (
                              <>🔒 Sanitize Document</>
                            )}
                          </button>
                          {currentFileState.outputUri && (
                            <button
                              onClick={() => handleDownload(currentFileIndex)}
                              className="btn btn-secondary btn-lg"
                            >
                              📥 Download Clean File
                            </button>
                          )}
                        </div>
                        
                        {/* Preview of sanitized file */}
                        {currentFileState.previewUri && (
                          <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                              🔒 Sanitized Preview
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                              {currentFileState.file.type.startsWith('image/') ? (
                                <img
                                  src={currentFileState.previewUri}
                                  alt="Sanitized preview"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-md)'
                                  }}
                                />
                              ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                                  <div style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-md)' }}>📄</div>
                                  <p>PDF sanitized successfully</p>
                                  <p style={{ fontSize: 'var(--font-size-sm)' }}>Click download to save the clean file</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="alert alert-success">
                        <div>
                          <strong>No sensitive information detected!</strong>
                          <p style={{ margin: '0', marginTop: 'var(--space-xs)' }}>
                            This document appears to be clean and safe to share.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preset Management Modal */}
        {showPresetEditor && proUnlocked && (
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
            zIndex: 1000
          }}>
            <div className="card" style={{ minWidth: '500px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="card-header">
                <h3 className="card-title">Manage Presets</h3>
                <p className="card-subtitle">Create and manage detection presets</p>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <strong>Pro Feature</strong>
                  <p style={{ margin: 0, marginTop: 'var(--space-xs)' }}>
                    Preset management is available in the Pro version.
                  </p>
                </div>
              </div>
              <div className="card-footer">
                <button
                  onClick={() => setShowPresetEditor(false)}
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}