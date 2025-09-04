// Main CleanShare Pro UI component
import React, { useState, useEffect } from 'react';
import type {
  Detection,
  RedactionAction,
  RedactionStyle,
  Preset
  , DetectionKind
} from '@cleanshare/core-detect';
import { analyzeDocument, applyRedactions, listPresets, savePreset, deletePreset } from '@cleanshare/core-detect';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker when running in the browser.  Without this,
// pdfjs will attempt to load a worker script from the wrong path.  We
// require the worker via webpack/Next.js which exposes a proper
// module.  If this import fails silently (e.g., SSR), the default
// worker may still be used.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const workerSrc = require('pdfjs-dist/build/pdf.worker.js');
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
} catch (e) {
  // ignore in SSR or test environments
}

/** Helper to load a PDF file and return an array of Data URLs for each page. */
async function loadPdfPages(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) {
      pages.push('');
      continue;
    }
    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;
    pages.push(canvas.toDataURL());
  }
  return pages;
}

/** Convert a Data URI to a Uint8Array for binary blobs. */
function dataURIToUint8Array(dataURI: string): Uint8Array {
  const parts = dataURI.split(',');
  const base64String = parts[1];
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** File state structure for each selected file. */
interface FileState {
  file: File;
  detections: Detection[];
  // map of detection id to whether the user wants to redact it
  selected: Record<string, boolean>;
  // map of detection id to style and optional label
  actions: Record<string, { style: RedactionStyle; labelText?: string }>;
  pages: number;
  // data URLs for PDF pages or a single image
  pageImages: string[];
  currentPage: number;
  outputUri?: string;
  report?: any;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Pro gating.  Some features such as preset editing are locked behind a
  // simple “Pro” toggle.  In a real app this would be tied to a purchase or
  // subscription.  For demonstration it is a boolean state.
  const [proUnlocked, setProUnlocked] = useState(false);
  // Preset editor state.  When showPresetEditor is true the UI displays a
  // management view where the user can create, edit, and delete presets.
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  // Define the list of all possible detection kinds and redaction styles.
  const DETECTION_KINDS: DetectionKind[] = [
    'FACE',
    'EMAIL',
    'PHONE',
    'PAN',
    'IBAN',
    'SSN',
    'JWT',
    'API_KEY',
    'BARCODE',
    'NAME',
    'ADDRESS',
    'OTHER'
  ];
  const STYLE_OPTIONS: RedactionStyle[] = [
    'BOX',
    'BLUR',
    'PIXELATE',
    'LABEL',
    'MASK_LAST4'
  ];

  // Load presets on mount
  useEffect(() => {
    const ps = listPresets();
    setPresets(ps);
    // default to the first preset
    if (ps.length > 0) {
      setPresetId(ps[0].id);
    }
  }, []);

  // Analyse files when they change or when preset changes
  useEffect(() => {
    if (files.length === 0) return;
    let isCancelled = false;
    async function analyseAll() {
      setLoading(true);
      const newStates: FileState[] = [];
      for (const file of files) {
        try {
          const result = await analyzeDocument(file, { presetId });
          // Initialise selections and actions
          const sel: Record<string, boolean> = {};
          const act: Record<string, { style: RedactionStyle; labelText?: string }> = {};
          result.detections.forEach(det => {
            sel[det.id] = true;
            act[det.id] = { style: 'BOX' };
          });
          let pageImages: string[] = [];
          let pages = result.pages || 1;
          if ((file as any).type === 'application/pdf') {
            try {
              pageImages = await loadPdfPages(file);
              pages = pageImages.length;
            } catch (err) {
              // fallback: leave empty; preview will show nothing
              pageImages = [];
            }
          } else {
            // For images use a single preview via Object URL
            pageImages = [URL.createObjectURL(file)];
            pages = 1;
          }
          if (!isCancelled) {
            newStates.push({
              file,
              detections: result.detections,
              selected: sel,
              actions: act,
              pages,
              pageImages,
              currentPage: 0,
              outputUri: undefined,
              report: undefined
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (!isCancelled) {
        setFileStates(newStates);
        setCurrentFileIndex(0);
        setLoading(false);
      }
    }
    analyseAll();
    return () => {
      isCancelled = true;
    };
  }, [files, presetId]);

  /** Handle change of file input */
  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const arr = Array.from(selected);
    setFiles(arr);
    // reset previous exported data
    setZipUrl(null);
    setReportUrl(null);
  }

  /** Toggle a detection on or off */
  function toggleDetection(detId: string) {
    setFileStates(prev => {
      const copy = [...prev];
      const fs = copy[currentFileIndex];
      fs.selected[detId] = !fs.selected[detId];
      return copy;
    });
  }

  /** Change the redaction style for a detection */
  function changeStyle(detId: string, style: RedactionStyle) {
    setFileStates(prev => {
      const copy = [...prev];
      const fs = copy[currentFileIndex];
      fs.actions[detId].style = style;
      // Clear label text when style changes away from LABEL
      if (style !== 'LABEL') {
        delete fs.actions[detId].labelText;
      }
      return copy;
    });
  }

  /** Change the label text for a detection (used when style is LABEL) */
  function changeLabel(detId: string, text: string) {
    setFileStates(prev => {
      const copy = [...prev];
      const fs = copy[currentFileIndex];
      fs.actions[detId].labelText = text;
      return copy;
    });
  }

  /** Change current page for PDF preview */
  function changePage(delta: number) {
    setFileStates(prev => {
      const copy = [...prev];
      const fs = copy[currentFileIndex];
      const next = fs.currentPage + delta;
      if (next >= 0 && next < fs.pages) {
        fs.currentPage = next;
      }
      return copy;
    });
  }

  /** Sanitise the currently selected file */
  async function sanitiseCurrent() {
    const fs = fileStates[currentFileIndex];
    if (!fs) return;
    setLoading(true);
    try {
      // Build actions from selected detections
      const actions: RedactionAction[] = [];
      fs.detections.forEach(det => {
        if (fs.selected[det.id]) {
          const act = fs.actions[det.id];
          actions.push({
            detectionId: det.id,
            style: act.style,
            labelText: act.labelText
          });
        }
      });
      const outputType = (fs.file as any).type === 'application/pdf' ? 'pdf' : 'image';
      const result = await applyRedactions(fs.file, actions, { output: outputType as any, quality: 0.92 });
      setFileStates(prev => {
        const copy = [...prev];
        copy[currentFileIndex] = {
          ...copy[currentFileIndex],
          outputUri: result.fileUri,
          report: result.report
        };
        return copy;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /** Export all files as a zip archive with reports */
  async function exportAll() {
    if (fileStates.length === 0) return;
    setExporting(true);
    const zip = new JSZip();
    const aggregatedReport: any = {};
    // Ensure each file is sanitised and added to zip
    for (let idx = 0; idx < fileStates.length; idx++) {
      const fs = fileStates[idx];
      // If not yet sanitised, process it
      if (!fs.outputUri) {
        try {
          const actions: RedactionAction[] = [];
          fs.detections.forEach(det => {
            if (fs.selected[det.id]) {
              const act = fs.actions[det.id];
              actions.push({
                detectionId: det.id,
                style: act.style,
                labelText: act.labelText
              });
            }
          });
          const outputType = (fs.file as any).type === 'application/pdf' ? 'pdf' : 'image';
          const result = await applyRedactions(fs.file, actions, { output: outputType as any, quality: 0.92 });
          fs.outputUri = result.fileUri;
          fs.report = result.report;
        } catch (err) {
          console.error(err);
        }
      }
      // Add to zip if sanitised
      if (fs.outputUri) {
        const ext = (fs.file as any).type === 'application/pdf' ? 'pdf' : 'jpg';
        const filename = fs.file.name ? fs.file.name.replace(/\.[^.]+$/, '') : `file${idx + 1}`;
        const data = dataURIToUint8Array(fs.outputUri);
        zip.file(`${filename}-sanitised.${ext}`, data, { binary: true });
        aggregatedReport[filename] = fs.report;
      }
    }
    // Add report JSON
    zip.file('report.json', JSON.stringify(aggregatedReport, null, 2));
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      setZipUrl(url);
      // Create report blob separately for convenience
      const reportBlob = new Blob([JSON.stringify(aggregatedReport, null, 2)], { type: 'application/json' });
      const reportURL = URL.createObjectURL(reportBlob);
      setReportUrl(reportURL);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
      // Force state update to reflect new fs values
      setFileStates([...fileStates]);
    }
  }

  /** Change preset selection and reanalyse */
  function onPresetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setPresetId(id);
  }

  const currentFileState = fileStates[currentFileIndex];
  const detectionsOnPage = currentFileState
    ? currentFileState.detections.filter(det => (det.box.page ?? 0) === currentFileState.currentPage)
    : [];

  return (
    <div style={{ padding: '1rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>CleanShare Pro</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept="image/*,application/pdf" multiple onChange={onFilesChange} />
        {presets.length > 0 && (
          <select value={presetId} onChange={onPresetChange} style={{ marginLeft: '1rem' }}>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {/* Pro unlock and preset management */}
        <button
          onClick={() => {
            // Toggle proUnlocked state.  In a real app this would trigger a purchase flow.
            setProUnlocked(!proUnlocked);
          }}
          style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', border: '1px solid #10b981', borderRadius: '4px', backgroundColor: proUnlocked ? '#10b981' : '#f3f4f6', color: proUnlocked ? 'white' : '#111827' }}
        >
          {proUnlocked ? 'Pro Unlocked' : 'Unlock Pro'}
        </button>
        {proUnlocked && (
          <button
            onClick={() => setShowPresetEditor(true)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #2563eb', borderRadius: '4px', backgroundColor: '#2563eb', color: 'white' }}
          >
            Manage Presets
          </button>
        )}
      </div>
      {loading && <p>Processing…</p>}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Sidebar with file list */}
        <div style={{ width: '200px', borderRight: '1px solid #ddd', paddingRight: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Files</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {fileStates.map((fs, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem', cursor: 'pointer', fontWeight: idx === currentFileIndex ? 'bold' : 'normal' }} onClick={() => setCurrentFileIndex(idx)}>
                {fs.file.name || `File ${idx + 1}`} ({fs.detections.length})
              </li>
            ))}
          </ul>
          {fileStates.length > 0 && (
            <button onClick={exportAll} disabled={exporting} style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', width: '100%' }}>
              {exporting ? 'Exporting…' : 'Export All'}
            </button>
          )}
          {zipUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <a href={zipUrl} download="cleanshare-sanitised.zip" style={{ color: '#2563eb' }}>Download Zip</a>
              {reportUrl && (
                <div style={{ marginTop: '0.25rem' }}>
                  <a href={reportUrl} download="report.json" style={{ color: '#2563eb' }}>Download Report</a>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Main area: preview and detections */}
        {currentFileState && (
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Preview</h2>
            {/* Page navigation for PDFs */}
            {currentFileState.pages > 1 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => changePage(-1)} disabled={currentFileState.currentPage === 0} style={{ marginRight: '0.5rem' }}>Prev</button>
                <button onClick={() => changePage(1)} disabled={currentFileState.currentPage === currentFileState.pages - 1}>Next</button>
                <span style={{ marginLeft: '0.5rem' }}>Page {currentFileState.currentPage + 1} / {currentFileState.pages}</span>
              </div>
            )}
            {/* Preview container */}
            <div style={{ position: 'relative', border: '1px solid #ddd', display: 'inline-block', maxWidth: '100%' }}>
              {currentFileState.pageImages[currentFileState.currentPage] ? (
                <img
                  src={currentFileState.pageImages[currentFileState.currentPage]}
                  alt="Preview"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <div style={{ padding: '1rem' }}>No preview available</div>
              )}
              {/* Overlay detections for current page */}
              {detectionsOnPage.map(det => {
                const sel = currentFileState.selected[det.id];
                // Only draw if selected
                if (!sel) return null;
                const style: React.CSSProperties = {
                  position: 'absolute',
                  border: '2px solid red',
                  left: `${det.box.x * 100}%`,
                  top: `${det.box.y * 100}%`,
                  width: `${det.box.w * 100}%`,
                  height: `${det.box.h * 100}%`,
                  boxSizing: 'border-box'
                };
                return <div key={det.id} style={style} title={`${det.kind}: ${det.reason}`} />;
              })}
            </div>
            {/* Sanitised preview or download link */}
            {currentFileState.outputUri && (
              <div style={{ marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Sanitised</h3>
                {((currentFileState.file as any).type === 'application/pdf') ? (
                  <p>
                    <a href={currentFileState.outputUri} download={`${currentFileState.file.name.replace(/\.[^.]+$/, '')}-sanitised.pdf`} style={{ color: '#2563eb' }}>Download PDF</a>
                  </p>
                ) : (
                  <img src={currentFileState.outputUri} alt="Sanitised preview" style={{ maxWidth: '100%', height: 'auto' }} />
                )}
              </div>
            )}
            {/* Detections list */}
            <div style={{ marginTop: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Detections</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {currentFileState.detections.map(det => (
                  <li key={det.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                    <div>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!currentFileState.selected[det.id]}
                          onChange={() => toggleDetection(det.id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <strong>{det.kind}</strong> — {det.reason} {det.preview ? `(“${det.preview}”)` : ''}
                      </label>
                    </div>
                    {/* Style selector and label input */}
                    <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                      <select
                        value={currentFileState.actions[det.id].style}
                        onChange={e => changeStyle(det.id, e.target.value as RedactionStyle)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        <option value="BOX">Box</option>
                        <option value="BLUR">Blur</option>
                        <option value="PIXELATE">Pixelate</option>
                        <option value="LABEL">Label</option>
                        <option value="MASK_LAST4">Mask Last 4</option>
                      </select>
                      {currentFileState.actions[det.id].style === 'LABEL' && (
                        <input
                          type="text"
                          placeholder="Label text"
                          value={currentFileState.actions[det.id].labelText || ''}
                          onChange={e => changeLabel(det.id, e.target.value)}
                          style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '3px' }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={sanitiseCurrent}
                disabled={loading}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none' }}
              >
                Sanitise Current
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Preset Editor Overlay.  Only visible when showPresetEditor is true and Pro is unlocked. */}
      {showPresetEditor && proUnlocked && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', width: '90%', maxWidth: '600px', maxHeight: '90%', overflowY: 'auto' }}
          >
            {/* If editingPreset is null, show the list of presets with edit/delete and create new */}
            {!editingPreset && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Manage Presets</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {presets.map(p => (
                    <li key={p.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                      <strong>{p.name}</strong> ({p.id})
                      <div style={{ marginTop: '0.25rem' }}>
                        <button
                          onClick={() => {
                            // Start editing this preset by cloning its object.  Clone to avoid
                            // direct mutation of the PRESETS array.
                            setEditingPreset({
                              id: p.id,
                              name: p.name,
                              enabledKinds: [...p.enabledKinds],
                              styleMap: { ...(p.styleMap || {}) },
                              customRegex: p.customRegex ? [...p.customRegex] : []
                            });
                          }}
                          style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #2563eb', backgroundColor: '#2563eb', color: 'white', borderRadius: '4px' }}
                        >Edit</button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete preset "${p.name}"?`)) {
                              deletePreset(p.id);
                              // Reload presets from core after deletion
                              setPresets(listPresets());
                            }
                          }}
                          style={{ padding: '0.25rem 0.5rem', border: '1px solid #dc2626', backgroundColor: '#dc2626', color: 'white', borderRadius: '4px' }}
                        >Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    // Create a new preset template
                    setEditingPreset({ id: '', name: '', enabledKinds: [], styleMap: {}, customRegex: [] });
                  }}
                  style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#10b981', color: 'white', border: 'none' }}
                >Add New Preset</button>
                <button
                  onClick={() => {
                    setShowPresetEditor(false);
                    setEditingPreset(null);
                  }}
                  style={{ marginLeft: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#6b7280', color: 'white', border: 'none' }}
                >Close</button>
              </div>
            )}
            {/* Editing/Creating a preset */}
            {editingPreset && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{editingPreset.id ? 'Edit Preset' : 'Create Preset'}</h2>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Preset Name</label>
                  <input
                    type="text"
                    value={editingPreset.name}
                    onChange={e => setEditingPreset({ ...editingPreset, name: e.target.value })}
                    style={{ width: '100%', padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Enabled Detectors</label>
                  {DETECTION_KINDS.map(kind => (
                    <div key={kind} style={{ marginBottom: '0.25rem' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={editingPreset.enabledKinds.includes(kind)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEditingPreset(prev => {
                              const enabled = new Set(prev?.enabledKinds || []);
                              if (checked) enabled.add(kind); else enabled.delete(kind);
                              return { ...prev!, enabledKinds: Array.from(enabled) } as any;
                            });
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {kind}
                      </label>
                      {/* Style selector for each detection kind */}
                      {editingPreset.enabledKinds.includes(kind) && (
                        <select
                          value={(editingPreset.styleMap && editingPreset.styleMap[kind]) || 'BOX'}
                          onChange={e => {
                            const style = e.target.value as RedactionStyle;
                            setEditingPreset(prev => {
                              const newMap = { ...(prev?.styleMap || {}) } as any;
                              newMap[kind] = style;
                              return { ...prev!, styleMap: newMap } as any;
                            });
                          }}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          {STYLE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Custom Regex Patterns (one per line)</label>
                  <textarea
                    value={(editingPreset.customRegex || []).join('\n')}
                    onChange={e => {
                      const lines = e.target.value.split(/\n+/).map(s => s.trim()).filter(Boolean);
                      setEditingPreset(prev => ({ ...prev, customRegex: lines } as any));
                    }}
                    style={{ width: '100%', height: '80px', padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setEditingPreset(null);
                    }}
                    style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px' }}
                  >Back</button>
                  <button
                    onClick={() => {
                      // When creating a new preset, generate an ID based on the name
                      let id = editingPreset.id;
                      const name = editingPreset.name.trim();
                      if (!id) {
                        id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      }
                      const presetToSave: Preset = {
                        id,
                        name: editingPreset.name,
                        enabledKinds: editingPreset.enabledKinds,
                        styleMap: editingPreset.styleMap,
                        customRegex: editingPreset.customRegex
                      };
                      savePreset(presetToSave);
                      setPresets(listPresets());
                      setPresetId(id);
                      setEditingPreset(null);
                      setShowPresetEditor(false);
                    }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}
                  >Save</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}