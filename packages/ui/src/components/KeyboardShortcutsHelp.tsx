import React from 'react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutSection {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    context?: string;
  }>;
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'File Operations',
    shortcuts: [
      {
        keys: ['Ctrl', 'O'],
        description: 'Open file picker to upload files',
        context: 'Global'
      },
      {
        keys: ['Escape'],
        description: 'Close any open modal or dialog',
        context: 'Global'
      }
    ]
  },
  {
    title: 'Editing & Undo/Redo',
    shortcuts: [
      {
        keys: ['Ctrl', 'Z'],
        description: 'Undo last action',
        context: 'When files are loaded'
      },
      {
        keys: ['Ctrl', 'Y'],
        description: 'Redo last undone action',
        context: 'When files are loaded'
      },
      {
        keys: ['Ctrl', 'Shift', 'Z'],
        description: 'Redo last undone action (alternative)',
        context: 'When files are loaded'
      }
    ]
  },
  {
    title: 'Navigation',
    shortcuts: [
      {
        keys: ['Tab'],
        description: 'Navigate to next interactive element',
        context: 'Global'
      },
      {
        keys: ['Shift', 'Tab'],
        description: 'Navigate to previous interactive element',
        context: 'Global'
      },
      {
        keys: ['Space'],
        description: 'Toggle checkboxes and activate buttons',
        context: 'When focused'
      },
      {
        keys: ['Enter'],
        description: 'Activate buttons and submit forms',
        context: 'When focused'
      }
    ]
  },
  {
    title: 'Help & Information',
    shortcuts: [
      {
        keys: ['?'],
        description: 'Show this keyboard shortcuts help',
        context: 'Global'
      },
      {
        keys: ['F1'],
        description: 'Show keyboard shortcuts help (alternative)',
        context: 'Global'
      }
    ]
  }
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const renderKeyCombo = (keys: string[]) => {
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            <kbd style={{
              padding: '2px 6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '3px',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'monospace',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span style={{ fontSize: 'var(--font-size-xs)', margin: '0 2px' }}>+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

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
        minWidth: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="card-header">
          <h3 className="card-title">⌨️ Keyboard Shortcuts</h3>
          <p className="card-subtitle">Power user shortcuts for faster workflow</p>
        </div>

        <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 style={{ 
                  marginBottom: 'var(--space-md)', 
                  color: 'var(--color-primary)',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: 'var(--space-xs)'
                }}>
                  {section.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {section.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-sm)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        gap: 'var(--space-md)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                          {shortcut.description}
                        </div>
                        {shortcut.context && (
                          <div style={{ 
                            fontSize: 'var(--font-size-xs)', 
                            color: 'var(--text-secondary)' 
                          }}>
                            Context: {shortcut.context}
                          </div>
                        )}
                      </div>
                      {renderKeyCombo(shortcut.keys)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Accessibility Features */}
          <div style={{ 
            marginTop: 'var(--space-xl)', 
            padding: 'var(--space-md)', 
            background: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}>
            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
              🌐 Accessibility Features
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)'
            }}>
              <li>Full keyboard navigation support - use Tab to navigate</li>
              <li>Screen reader compatible with proper ARIA labels</li>
              <li>High contrast mode available in system preferences</li>
              <li>Focus indicators clearly show current selection</li>
              <li>Skip navigation links available (press Tab when page loads)</li>
              <li>All interactive elements are keyboard accessible</li>
            </ul>
          </div>

          {/* Tips */}
          <div style={{ 
            marginTop: 'var(--space-lg)', 
            padding: 'var(--space-md)', 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            borderRadius: 'var(--radius-md)',
            color: 'white'
          }}>
            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'white' }}>
              💡 Pro Tips
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              fontSize: 'var(--font-size-sm)',
              color: 'white'
            }}>
              <li>Use <strong>Ctrl+Z/Ctrl+Y</strong> to quickly experiment with different redaction styles</li>
              <li>The floating undo/redo controls appear when you're working with files</li>
              <li>Press <strong>?</strong> anytime to quickly reference these shortcuts</li>
              <li>All shortcuts work even when not focused on buttons - perfect for power users</li>
              <li>Your action history persists across browser sessions</li>
            </ul>
          </div>
        </div>

        <div className="card-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Press <kbd style={{
                padding: '2px 4px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '2px',
                fontSize: 'var(--font-size-xs)'
              }}>Escape</kbd> or click Close to dismiss
            </div>
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}