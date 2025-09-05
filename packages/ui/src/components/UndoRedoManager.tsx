import React, { useState, useEffect } from 'react';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface UndoRedoManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyPreview: Array<{
    index: number;
    type: string;
    description: string;
    timestamp: number;
    isCurrent: boolean;
    canRevert: boolean;
  }>;
  onJumpTo: (index: number) => void;
}

export default function UndoRedoManager({
  isOpen,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  historyPreview,
  onJumpTo
}: UndoRedoManagerProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'toggle-detection':
        return '☑️';
      case 'change-redaction-style':
        return '🎨';
      case 'change-label-text':
        return '📝';
      case 'bulk-toggle':
        return '📋';
      default:
        return '⚙️';
    }
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
        minWidth: '500px',
        maxWidth: '90vw',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="card-header">
          <h3 className="card-title">Action History</h3>
          <p className="card-subtitle">Undo or redo your recent changes</p>
        </div>

        <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
          {/* Action Controls */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            alignItems: 'center'
          }}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="btn btn-primary"
              style={{ opacity: canUndo ? 1 : 0.5 }}
            >
              ↶ Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="btn btn-primary"
              style={{ opacity: canRedo ? 1 : 0.5 }}
            >
              ↷ Redo
            </button>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginLeft: 'auto'
            }}>
              Keyboard: Ctrl+Z / Ctrl+Y
            </div>
          </div>

          {/* History Timeline */}
          <div>
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Recent Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {historyPreview.length > 0 ? (
                historyPreview.map((item) => (
                  <div
                    key={item.index}
                    onClick={() => onJumpTo(item.index)}
                    style={{
                      padding: 'var(--space-sm)',
                      border: `1px solid ${item.isCurrent ? 'var(--color-primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: item.isCurrent ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      transition: 'all var(--transition-fast)',
                      opacity: item.canRevert ? 1 : 0.6
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-lg)' }}>
                      {getActionIcon(item.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: item.isCurrent ? '600' : '400',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {item.description}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}>
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                    {item.isCurrent && (
                      <span style={{
                        padding: '2px 6px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: 'var(--font-size-xs)'
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: 'var(--space-xl)'
                }}>
                  No actions to undo yet. Start making changes to see history here.
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)'
          }}>
            <strong>Tips:</strong>
            <ul style={{ marginTop: 'var(--space-xs)', paddingLeft: '20px' }}>
              <li>Use Ctrl+Z to undo the last action</li>
              <li>Use Ctrl+Y to redo an undone action</li>
              <li>Click on any action in the timeline to jump to that point</li>
              <li>Actions are automatically saved and persist across page refreshes</li>
            </ul>
          </div>
        </div>

        <div className="card-footer">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Floating Undo/Redo Controls Component
export function UndoRedoControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenHistory
}: {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenHistory: () => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      gap: 'var(--space-xs)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xs)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100
    }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="btn btn-outline btn-sm"
        style={{ opacity: canUndo ? 1 : 0.5 }}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="btn btn-outline btn-sm"
        style={{ opacity: canRedo ? 1 : 0.5 }}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
      <div style={{
        width: '1px',
        background: 'var(--border-light)',
        margin: '2px 0'
      }} />
      <button
        onClick={onOpenHistory}
        className="btn btn-outline btn-sm"
        title="View Action History"
      >
        📋
      </button>
    </div>
  );
}