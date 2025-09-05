// Mobile-specific React app for CleanShare Pro with Phase 2.4 features
// This file creates a React application optimized for mobile devices

// Check if React is available at script load
console.log('=== Mobile App Full Script Loading ===');
console.log('React available at script load:', typeof React !== 'undefined');
console.log('ReactDOM available at script load:', typeof ReactDOM !== 'undefined');

// Mobile React components using ES6 modules - will be available when React loads
let useState, useEffect, useCallback, useRef;

function initializeReactHooks() {
  if (typeof React !== 'undefined') {
    ({ useState, useEffect, useCallback, useRef } = React);
    console.log('React hooks initialized');
  }
}

// Import mobile-optimized hooks for undo/redo
function useUndoRedoMobile(initialState, options = {}) {
  const { maxHistorySize = 50, debounceMs = 300 } = options;
  
  const [state, setState] = useState({
    current: initialState,
    history: [],
    currentIndex: -1,
    canUndo: false,
    canRedo: false
  });
  
  const execute = useCallback((type, description, undoFn, redoFn) => {
    const action = {
      type,
      description,
      timestamp: Date.now(),
      undo: undoFn,
      redo: redoFn
    };

    const newCurrent = action.redo();
    const newHistory = [...state.history.slice(0, state.currentIndex + 1), action];
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }
    
    const newIndex = newHistory.length - 1;
    setState({
      current: newCurrent,
      history: newHistory,
      currentIndex: newIndex,
      canUndo: newIndex >= 0,
      canRedo: newIndex < newHistory.length - 1
    });
    
    return newCurrent;
  }, [state, maxHistorySize]);

  const undo = useCallback(() => {
    if (state.canUndo && state.currentIndex >= 0) {
      const action = state.history[state.currentIndex];
      const newCurrent = action.undo();
      const newIndex = state.currentIndex - 1;
      
      setState(prev => ({
        ...prev,
        current: newCurrent,
        currentIndex: newIndex,
        canUndo: newIndex >= 0,
        canRedo: true
      }));
      
      return newCurrent;
    }
    return state.current;
  }, [state]);

  const redo = useCallback(() => {
    if (state.canRedo && state.currentIndex < state.history.length - 1) {
      const nextIndex = state.currentIndex + 1;
      const action = state.history[nextIndex];
      const newCurrent = action.redo();
      
      setState(prev => ({
        ...prev,
        current: newCurrent,
        currentIndex: nextIndex,
        canUndo: true,
        canRedo: nextIndex < prev.history.length - 1
      }));
      
      return newCurrent;
    }
    return state.current;
  }, [state]);

  const getHistoryPreview = useCallback((maxItems = 10) => {
    const items = [];
    const start = Math.max(0, state.currentIndex - maxItems + 1);
    
    for (let i = start; i <= Math.min(state.currentIndex + maxItems, state.history.length - 1); i++) {
      const action = state.history[i];
      if (action) {
        items.push({
          index: i,
          type: action.type,
          description: action.description,
          timestamp: action.timestamp,
          isCurrent: i === state.currentIndex,
          canRevert: i <= state.currentIndex
        });
      }
    }
    
    return items;
  }, [state.history, state.currentIndex]);

  return {
    current: state.current,
    execute,
    undo,
    redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    getHistoryPreview
  };
}

// Mobile Preset Manager Component
function MobilePresetManager({ isOpen, onClose, currentPresetId, onPresetSelect, presets = [] }) {
  const [selectedTab, setSelectedTab] = useState('browse');
  const [editingPreset, setEditingPreset] = useState(null);
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleCreateNew = () => {
    const newPreset = {
      id: '',
      name: 'New Mobile Preset',
      description: '',
      domain: 'General',
      enabledKinds: ['EMAIL', 'PHONE'],
      styleMap: {},
      customPatterns: [],
      defaultRedactionConfig: { color: '#000000', opacity: 0.9 }
    };
    setEditingPreset(newPreset);
    setSelectedTab('edit');
  };

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }
  }, React.createElement('div', {
    className: 'mobile-card',
    style: { 
      height: '90vh', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'mobile-card-header'
    }, [
      React.createElement('h3', {
        key: 'title',
        className: 'mobile-card-title'
      }, '🎛️ Preset Manager'),
      React.createElement('p', {
        key: 'subtitle', 
        className: 'mobile-card-subtitle'
      }, 'Manage detection presets')
    ]),
    
    // Tabs
    React.createElement('div', {
      key: 'tabs',
      style: {
        display: 'flex',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)'
      }
    }, ['browse', 'edit', 'import'].map(tab => 
      React.createElement('button', {
        key: tab,
        onClick: () => setSelectedTab(tab),
        className: 'btn btn-ghost btn-sm',
        style: {
          flex: 1,
          background: selectedTab === tab ? 'var(--color-primary)' : 'transparent',
          color: selectedTab === tab ? 'white' : 'var(--text-secondary)',
          margin: '2px',
          borderRadius: 'var(--radius-sm)',
          textTransform: 'capitalize'
        }
      }, tab)
    )),
    
    // Content
    React.createElement('div', {
      key: 'content',
      className: 'mobile-card-body',
      style: { flex: 1, overflow: 'auto' }
    }, 
      selectedTab === 'browse' ? 
        React.createElement('div', {}, [
          React.createElement('button', {
            key: 'create',
            onClick: handleCreateNew,
            className: 'btn btn-primary'
          }, '➕ Create New Preset'),
          React.createElement('div', {
            key: 'presets',
            style: { marginTop: 'var(--space-lg)' }
          }, presets.map(preset => 
            React.createElement('div', {
              key: preset.id,
              style: {
                padding: 'var(--space-md)',
                border: `2px solid ${preset.id === currentPresetId ? 'var(--color-primary)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                background: preset.id === currentPresetId ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                marginBottom: 'var(--space-md)'
              }
            }, [
              React.createElement('div', {
                key: 'info',
                style: { marginBottom: 'var(--space-sm)' }
              }, [
                React.createElement('div', {
                  key: 'name',
                  style: { fontWeight: '600', marginBottom: 'var(--space-xs)' }
                }, preset.name),
                preset.description && React.createElement('div', {
                  key: 'desc',
                  style: { fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }
                }, preset.description),
                React.createElement('div', {
                  key: 'details',
                  style: { fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }
                }, `${preset.enabledKinds.length} detectors`)
              ]),
              React.createElement('div', {
                key: 'actions',
                style: { display: 'flex', gap: 'var(--space-sm)' }
              }, [
                React.createElement('button', {
                  key: 'select',
                  onClick: () => onPresetSelect(preset.id),
                  className: `btn btn-sm ${preset.id === currentPresetId ? 'btn-secondary' : 'btn-primary'}`
                }, preset.id === currentPresetId ? '✓ Active' : 'Use'),
                React.createElement('button', {
                  key: 'edit',
                  onClick: () => {
                    setEditingPreset(preset);
                    setSelectedTab('edit');
                  },
                  className: 'btn btn-outline btn-sm'
                }, 'Edit')
              ])
            ])
          ))
        ]) : 
      selectedTab === 'edit' && editingPreset ?
        React.createElement(MobilePresetEditor, {
          preset: editingPreset,
          onSave: (preset) => {
            // Save logic here
            console.log('Saving mobile preset:', preset);
            setEditingPreset(null);
            setSelectedTab('browse');
          },
          onCancel: () => {
            setEditingPreset(null);
            setSelectedTab('browse');
          }
        }) :
      selectedTab === 'import' ?
        React.createElement('div', {}, [
          React.createElement('h4', {
            key: 'title',
            style: { marginBottom: 'var(--space-md)' }
          }, 'Import Presets'),
          React.createElement('textarea', {
            key: 'input',
            value: importText,
            onChange: (e) => setImportText(e.target.value),
            placeholder: 'Paste preset JSON data here...',
            style: {
              width: '100%',
              height: '200px',
              padding: 'var(--space-sm)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-sm)'
            }
          }),
          React.createElement('button', {
            key: 'import',
            onClick: () => {
              console.log('Importing mobile presets:', importText);
              setImportText('');
            },
            className: 'btn btn-primary',
            style: { marginTop: 'var(--space-md)' }
          }, 'Import Presets')
        ]) : null
    ),
    
    // Footer
    React.createElement('div', {
      key: 'footer',
      style: {
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-secondary)'
      }
    }, React.createElement('button', {
      onClick: onClose,
      className: 'btn btn-ghost'
    }, 'Close'))
  ]));
}

// Mobile Preset Editor Component
function MobilePresetEditor({ preset, onSave, onCancel }) {
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState(preset);

  const DETECTION_KINDS = [
    'FACE', 'EMAIL', 'PHONE', 'PAN', 'IBAN', 'SSN', 'PASSPORT',
    'JWT', 'API_KEY', 'BARCODE', 'NAME', 'ADDRESS', 'OTHER'
  ];

  return React.createElement('div', {}, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }
    }, [
      React.createElement('h4', {
        key: 'title'
      }, formData.id ? 'Edit Preset' : 'Create New Preset'),
      React.createElement('div', {
        key: 'actions',
        style: { display: 'flex', gap: 'var(--space-sm)' }
      }, [
        React.createElement('button', {
          key: 'save',
          onClick: () => onSave(formData),
          className: 'btn btn-primary btn-sm'
        }, '💾 Save'),
        React.createElement('button', {
          key: 'cancel',
          onClick: onCancel,
          className: 'btn btn-outline btn-sm'
        }, 'Cancel')
      ])
    ]),
    
    // Section Tabs
    React.createElement('div', {
      key: 'tabs',
      style: { 
        display: 'flex',
        gap: 'var(--space-xs)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }
    }, ['basic', 'detectors'].map(section =>
      React.createElement('button', {
        key: section,
        onClick: () => setActiveSection(section),
        className: `btn btn-sm ${activeSection === section ? 'btn-primary' : 'btn-outline'}`,
        style: { textTransform: 'capitalize' }
      }, section)
    )),
    
    // Form Content
    activeSection === 'basic' ?
      React.createElement('div', {
        key: 'basic-form',
        style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }
      }, [
        React.createElement('div', { key: 'name' }, [
          React.createElement('label', {
            style: { display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }
          }, 'Name *'),
          React.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            className: 'form-input',
            style: {
              width: '100%',
              padding: 'var(--space-sm)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)'
            },
            placeholder: 'Enter preset name'
          })
        ]),
        React.createElement('div', { key: 'desc' }, [
          React.createElement('label', {
            style: { display: 'block', marginBottom: 'var(--space-xs)', fontWeight: '600' }
          }, 'Description'),
          React.createElement('textarea', {
            value: formData.description || '',
            onChange: (e) => setFormData({ ...formData, description: e.target.value }),
            style: {
              width: '100%',
              height: '80px',
              padding: 'var(--space-sm)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical'
            },
            placeholder: 'Describe what this preset is for'
          })
        ])
      ]) :
    activeSection === 'detectors' ?
      React.createElement('div', {
        key: 'detectors-form'
      }, [
        React.createElement('h5', {
          key: 'title',
          style: { marginBottom: 'var(--space-md)' }
        }, 'Enabled Detection Types'),
        React.createElement('div', {
          key: 'checkboxes',
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-sm)' }
        }, DETECTION_KINDS.map(kind => 
          React.createElement('label', {
            key: kind,
            style: { 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-xs)',
              padding: 'var(--space-xs)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }
          }, [
            React.createElement('input', {
              key: 'checkbox',
              type: 'checkbox',
              checked: formData.enabledKinds.includes(kind),
              onChange: (e) => {
                const updated = e.target.checked
                  ? [...formData.enabledKinds, kind]
                  : formData.enabledKinds.filter(k => k !== kind);
                setFormData({ ...formData, enabledKinds: updated });
              }
            }),
            React.createElement('span', {
              key: 'label',
              style: { fontSize: 'var(--font-size-sm)' }
            }, kind)
          ])
        ))
      ]) : null
  ]);
}

// Mobile History Dashboard Component
function MobileHistoryDashboard({ isOpen, onClose }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Load history data from localStorage or API
      try {
        const mockStats = {
          totalSessions: 3,
          totalFiles: 12,
          totalDetections: 28,
          successRate: 0.92,
          detectionsByType: {
            'EMAIL': 8,
            'PHONE': 6,
            'PAN': 4,
            'SSN': 3,
            'OTHER': 7
          }
        };
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to load mobile history stats:', error);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }
  }, React.createElement('div', {
    className: 'mobile-card',
    style: { 
      height: '90vh', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'mobile-card-header'
    }, [
      React.createElement('h3', {
        key: 'title',
        className: 'mobile-card-title'
      }, '📊 Processing History'),
      React.createElement('p', {
        key: 'subtitle',
        className: 'mobile-card-subtitle'
      }, 'Analytics and audit trail')
    ]),

    // Content
    React.createElement('div', {
      key: 'content',
      className: 'mobile-card-body',
      style: { flex: 1, overflow: 'auto' }
    }, stats ? [
      // Key Metrics
      React.createElement('div', {
        key: 'metrics',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }
      }, [
        ['Total Sessions', stats.totalSessions, 'var(--color-primary)'],
        ['Files Processed', stats.totalFiles, 'var(--color-secondary)'],
        ['Detections Made', stats.totalDetections, 'var(--color-accent)'],
        ['Success Rate', `${Math.round(stats.successRate * 100)}%`, 'var(--color-success)']
      ].map(([label, value, color], index) =>
        React.createElement('div', {
          key: index,
          style: {
            padding: 'var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px solid var(--border-light)'
          }
        }, [
          React.createElement('div', {
            key: 'value',
            style: { 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 'bold',
              color: color,
              marginBottom: 'var(--space-xs)'
            }
          }, value),
          React.createElement('div', {
            key: 'label',
            style: { 
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)'
            }
          }, label)
        ])
      )),

      // Detection Types Chart
      React.createElement('div', {
        key: 'chart',
        style: {
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          border: '1px solid var(--border-light)'
        }
      }, [
        React.createElement('h4', {
          key: 'title',
          style: { 
            marginBottom: 'var(--space-md)',
            color: 'var(--color-primary)'
          }
        }, 'Detection Types'),
        React.createElement('div', {
          key: 'bars',
          style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }
        }, Object.entries(stats.detectionsByType).map(([type, count]) => {
          const percentage = (count / stats.totalDetections) * 100;
          return React.createElement('div', {
            key: type,
            style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }
          }, [
            React.createElement('div', {
              key: 'type',
              style: { minWidth: '60px', fontSize: 'var(--font-size-sm)', fontWeight: '600' }
            }, type),
            React.createElement('div', {
              key: 'bar',
              style: {
                flex: 1,
                height: '20px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                position: 'relative'
              }
            }, React.createElement('div', {
              style: {
                height: '100%',
                width: `${percentage}%`,
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-sm)'
              }
            })),
            React.createElement('div', {
              key: 'count',
              style: { 
                minWidth: '40px', 
                textAlign: 'right',
                fontSize: 'var(--font-size-sm)'
              }
            }, count)
          ]);
        }))
      ])
    ] : React.createElement('div', {
      style: { 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px'
      }
    }, 'Loading history data...')),

    // Footer
    React.createElement('div', {
      key: 'footer',
      style: {
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-secondary)'
      }
    }, React.createElement('button', {
      onClick: onClose,
      className: 'btn btn-ghost'
    }, 'Close'))
  ]));
}

// Mobile Undo/Redo Controls Component
function MobileUndoRedoControls({ onUndo, onRedo, canUndo, canRedo, onOpenHistory }) {
  return React.createElement('div', {
    style: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xs)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100
    }
  }, [
    React.createElement('button', {
      key: 'undo',
      onClick: onUndo,
      disabled: !canUndo,
      className: 'btn btn-outline btn-sm',
      style: { 
        opacity: canUndo ? 1 : 0.5,
        minWidth: '60px',
        padding: 'var(--space-sm)'
      },
      title: 'Undo'
    }, '↶'),
    React.createElement('button', {
      key: 'redo',
      onClick: onRedo,
      disabled: !canRedo,
      className: 'btn btn-outline btn-sm',
      style: { 
        opacity: canRedo ? 1 : 0.5,
        minWidth: '60px',
        padding: 'var(--space-sm)'
      },
      title: 'Redo'
    }, '↷'),
    React.createElement('div', {
      key: 'divider',
      style: {
        height: '1px',
        background: 'var(--border-light)',
        margin: '2px 0'
      }
    }),
    React.createElement('button', {
      key: 'history',
      onClick: onOpenHistory,
      className: 'btn btn-outline btn-sm',
      style: { 
        minWidth: '60px',
        padding: 'var(--space-sm)'
      },
      title: 'View History'
    }, '📋')
  ]);
}

// Mobile Keyboard Shortcuts Help Component  
function MobileKeyboardHelp({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Long press'], description: 'Context menu actions', context: 'Touch interface' },
    { keys: ['Double tap'], description: 'Quick actions', context: 'Touch interface' },
    { keys: ['Swipe left'], description: 'Back navigation', context: 'Mobile gestures' },
    { keys: ['Swipe down'], description: 'Refresh content', context: 'Mobile gestures' },
    { keys: ['Space'], description: 'Toggle checkboxes', context: 'External keyboard' },
    { keys: ['Enter'], description: 'Activate buttons', context: 'External keyboard' },
    { keys: ['Escape'], description: 'Close modals', context: 'External keyboard' }
  ];

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }
  }, React.createElement('div', {
    className: 'mobile-card',
    style: { 
      height: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'mobile-card-header'
    }, [
      React.createElement('h3', {
        key: 'title',
        className: 'mobile-card-title'
      }, '📱 Mobile Controls'),
      React.createElement('p', {
        key: 'subtitle',
        className: 'mobile-card-subtitle'
      }, 'Touch gestures and shortcuts')
    ]),

    // Content
    React.createElement('div', {
      key: 'content',
      className: 'mobile-card-body',
      style: { flex: 1, overflow: 'auto' }
    }, [
      React.createElement('div', {
        key: 'shortcuts',
        style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }
      }, shortcuts.map((shortcut, index) =>
        React.createElement('div', {
          key: index,
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            gap: 'var(--space-md)'
          }
        }, [
          React.createElement('div', {
            key: 'info',
            style: { flex: 1 }
          }, [
            React.createElement('div', {
              key: 'desc',
              style: { fontWeight: '600', marginBottom: '2px' }
            }, shortcut.description),
            React.createElement('div', {
              key: 'context',
              style: { 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)'
              }
            }, `Context: ${shortcut.context}`)
          ]),
          React.createElement('div', {
            key: 'keys',
            style: {
              padding: '4px 8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600'
            }
          }, shortcut.keys.join(' + '))
        ])
      )),

      // Mobile-specific tips
      React.createElement('div', {
        key: 'tips',
        style: {
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-md)',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          borderRadius: 'var(--radius-md)',
          color: 'white'
        }
      }, [
        React.createElement('h4', {
          key: 'title',
          style: { marginBottom: 'var(--space-sm)', color: 'white' }
        }, '💡 Mobile Tips'),
        React.createElement('ul', {
          key: 'list',
          style: { 
            margin: 0,
            paddingLeft: '20px',
            fontSize: 'var(--font-size-sm)',
            color: 'white'
          }
        }, [
          React.createElement('li', { key: 'tip1' }, 'Use touch gestures for quick navigation'),
          React.createElement('li', { key: 'tip2' }, 'Long press for additional options'),
          React.createElement('li', { key: 'tip3' }, 'External keyboard shortcuts work when connected'),
          React.createElement('li', { key: 'tip4' }, 'Swipe gestures provide quick access to features')
        ])
      ])
    ]),

    // Footer
    React.createElement('div', {
      key: 'footer',
      style: {
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-secondary)'
      }
    }, React.createElement('button', {
      onClick: onClose,
      className: 'btn btn-primary'
    }, 'Close'))
  ]));
}

// Main Mobile App Component
function MobileCleanSharePro() {
  // State management
  const [files, setFiles] = useState([]);
  const [fileStates, setFileStates] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [presets] = useState([
    { id: 'mobile-basic', name: 'Mobile Basic', description: 'Essential detections for mobile', enabledKinds: ['EMAIL', 'PHONE'] },
    { id: 'mobile-enhanced', name: 'Mobile Enhanced', description: 'Enhanced security for mobile', enabledKinds: ['EMAIL', 'PHONE', 'PAN', 'SSN'] }
  ]);
  const [presetId, setPresetId] = useState('mobile-basic');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showHistoryDashboard, setShowHistoryDashboard] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Undo/Redo system
  const undoRedoSystem = useUndoRedoMobile([], { maxHistorySize: 50 });

  // File processing functions
  const handleFileSelect = (selectedFiles) => {
    setFiles(Array.from(selectedFiles));
    setCurrentFileIndex(0);
    processFiles(Array.from(selectedFiles));
  };

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setLoading(true);
    const newStates = [];
    
    for (const file of fileList) {
      try {
        if (!window.CleanSharePro) {
          throw new Error('CleanShare Pro API not loaded');
        }
        
        const result = await window.CleanSharePro.processFile(file);
        
        if (result.success) {
          const selected = {};
          const actions = {};
          
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
            processing: false
          });
        } else {
          newStates.push({
            file,
            detections: [],
            selected: {},
            actions: {},
            pages: 1,
            processing: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Failed to process mobile file:', file.name, error);
        newStates.push({
          file,
          detections: [],
          selected: {},
          actions: {},
          pages: 1,
          processing: false,
          error: error.message
        });
      }
    }
    
    setFileStates(newStates);
    setLoading(false);
  };

  const updateFileStates = (newStates, actionType, description) => {
    if (actionType && description) {
      const oldStates = fileStates;
      undoRedoSystem.execute(
        actionType,
        description,
        () => {
          setFileStates(oldStates);
          return oldStates;
        },
        () => {
          setFileStates(newStates);
          return newStates;
        }
      );
    } else {
      setFileStates(newStates);
    }
  };

  const handleSanitize = async (fileIndex) => {
    const fileState = fileStates[fileIndex];
    if (!fileState) return;

    setFileStates(prev => prev.map((state, i) => 
      i === fileIndex ? { ...state, processing: true } : state
    ));

    try {
      const redactionActions = fileState.detections
        .filter(det => fileState.selected[det.id])
        .map(det => ({
          detectionId: det.id,
          style: fileState.actions[det.id]?.style || 'BOX'
        }));

      const result = await window.CleanSharePro.applyRedactions(
        fileState.file, 
        redactionActions,
        { detections: fileState.detections }
      );

      if (result.success) {
        // Store for download
        const mimeType = fileState.file.type.startsWith('image/') ? fileState.file.type : 'application/pdf';
        window.processedFiles = window.processedFiles || new Map();
        window.processedFiles.set(result.filename, {
          data: result.data,
          mimeType: mimeType,
          originalName: fileState.file.name
        });

        setFileStates(prev => prev.map((state, i) => 
          i === fileIndex ? { 
            ...state, 
            outputUri: result.filename,
            processing: false 
          } : state
        ));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Mobile sanitization failed:', error);
      setFileStates(prev => prev.map((state, i) => 
        i === fileIndex ? { ...state, processing: false } : state
      ));
      alert(`Sanitization failed: ${error.message}`);
    }
  };

  const handleDownload = (fileIndex) => {
    const fileState = fileStates[fileIndex];
    if (!fileState?.outputUri || !window.CleanSharePro) return;

    const fileData = window.processedFiles?.get(fileState.outputUri);
    if (fileData) {
      window.CleanSharePro.downloadFile(
        fileData.data, 
        fileState.outputUri,
        fileData.mimeType
      );
    }
  };

  const currentFileState = fileStates[currentFileIndex];

  // Main render
  return React.createElement('div', {
    className: 'app-container'
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'mobile-header'
    }, [
      React.createElement('h1', {
        key: 'title'
      }, 'CleanShare Pro'),
      React.createElement('p', {
        key: 'subtitle'
      }, 'Privacy-focused document sanitization'),
      React.createElement('div', {
        key: 'controls',
        style: { 
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-md)'
        }
      }, [
        React.createElement('button', {
          key: 'presets',
          onClick: () => setShowPresetManager(true),
          className: 'btn btn-outline btn-sm',
          style: { minWidth: 'auto', padding: 'var(--space-sm)' }
        }, '🎛️'),
        React.createElement('button', {
          key: 'history',
          onClick: () => setShowHistoryDashboard(true),
          className: 'btn btn-outline btn-sm',
          style: { minWidth: 'auto', padding: 'var(--space-sm)' }
        }, '📊'),
        React.createElement('button', {
          key: 'help',
          onClick: () => setShowKeyboardHelp(true),
          className: 'btn btn-outline btn-sm',
          style: { minWidth: 'auto', padding: 'var(--space-sm)' }
        }, '❓')
      ])
    ]),

    // Content
    React.createElement('div', {
      key: 'content',
      className: 'mobile-content'
    }, [
      // File Upload Card
      React.createElement('div', {
        key: 'upload-card',
        className: 'mobile-card'
      }, [
        React.createElement('div', {
          key: 'header',
          className: 'mobile-card-header'
        }, [
          React.createElement('h2', {
            key: 'title',
            className: 'mobile-card-title'
          }, 'Upload Files'),
          React.createElement('p', {
            key: 'subtitle',
            className: 'mobile-card-subtitle'
          }, 'Select images or PDF documents to sanitize')
        ]),
        React.createElement('div', {
          key: 'body',
          className: 'mobile-card-body'
        }, [
          React.createElement('div', {
            key: 'upload-zone',
            className: 'file-drop-zone',
            onClick: () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*,.pdf';
              input.onchange = (e) => handleFileSelect(e.target.files);
              input.click();
            }
          }, [
            React.createElement('div', {
              key: 'icon',
              className: 'file-drop-icon'
            }, '📄'),
            React.createElement('div', {
              key: 'text',
              className: 'file-drop-text'
            }, 'Select Files'),
            React.createElement('div', {
              key: 'subtext',
              className: 'file-drop-subtext'
            }, 'Tap to select images or PDFs up to 10MB each')
          ]),
          
          loading && React.createElement('div', {
            key: 'loading',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginTop: 'var(--space-md)',
              justifyContent: 'center'
            }
          }, [
            React.createElement('div', {
              key: 'spinner',
              className: 'processing-spinner'
            }),
            React.createElement('span', {
              key: 'text'
            }, 'Processing files...')
          ])
        ])
      ]),

      // File Results
      fileStates.length > 0 && React.createElement('div', {
        key: 'results',
        style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }
      }, [
        // File list
        fileStates.length > 1 && React.createElement('div', {
          key: 'file-list',
          className: 'mobile-card'
        }, [
          React.createElement('div', {
            key: 'header',
            className: 'mobile-card-header'
          }, [
            React.createElement('h3', {
              key: 'title',
              className: 'mobile-card-title'
            }, `Files (${fileStates.length})`),
            React.createElement('p', {
              key: 'subtitle',
              className: 'mobile-card-subtitle'
            }, 'Tap a file to view details')
          ]),
          React.createElement('div', {
            key: 'body',
            className: 'mobile-card-body'
          }, React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }
          }, fileStates.map((state, index) => 
            React.createElement('div', {
              key: index,
              onClick: () => setCurrentFileIndex(index),
              style: {
                padding: 'var(--space-md)',
                border: `2px solid ${index === currentFileIndex ? 'var(--color-primary)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                background: index === currentFileIndex ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                cursor: 'pointer'
              }
            }, [
              React.createElement('div', {
                key: 'info',
                style: { fontWeight: '600', marginBottom: 'var(--space-xs)' }
              }, state.file.name),
              React.createElement('div', {
                key: 'details',
                style: { fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }
              }, state.error ? `Error: ${state.error}` : `${state.detections.length} detections found`)
            ])
          )))
        ]),

        // Current file details
        currentFileState && React.createElement('div', {
          key: 'current-file',
          className: 'mobile-card'
        }, [
          React.createElement('div', {
            key: 'header',
            className: 'mobile-card-header'
          }, [
            React.createElement('h3', {
              key: 'title',
              className: 'mobile-card-title'
            }, currentFileState.file.name),
            React.createElement('p', {
              key: 'subtitle',
              className: 'mobile-card-subtitle'
            }, currentFileState.error ? 'Processing failed' : `Found ${currentFileState.detections.length} sensitive items`)
          ]),
          React.createElement('div', {
            key: 'body',
            className: 'mobile-card-body'
          }, currentFileState.error ? 
            React.createElement('div', {
              className: 'alert alert-error'
            }, [
              React.createElement('strong', { key: 'title' }, 'Processing Error'),
              React.createElement('p', { 
                key: 'message',
                style: { margin: '0', marginTop: 'var(--space-xs)' }
              }, `Failed to analyze this file: ${currentFileState.error}`)
            ]) :
            currentFileState.detections.length > 0 ?
              React.createElement('div', {}, [
                React.createElement('h4', {
                  key: 'detections-title',
                  style: { marginBottom: 'var(--space-md)' }
                }, 'Detected Sensitive Information'),
                React.createElement('div', {
                  key: 'detections',
                  style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }
                }, currentFileState.detections.map(detection => 
                  React.createElement('div', {
                    key: detection.id,
                    style: {
                      padding: 'var(--space-md)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)'
                    }
                  }, [
                    React.createElement('div', {
                      key: 'info',
                      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                    }, [
                      React.createElement('div', {
                        key: 'details',
                        style: { flex: 1 }
                      }, [
                        React.createElement('label', {
                          key: 'label',
                          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }
                        }, [
                          React.createElement('input', {
                            key: 'checkbox',
                            type: 'checkbox',
                            checked: currentFileState.selected[detection.id] || false,
                            onChange: (e) => {
                              const newStates = fileStates.map((state, i) => 
                                i === currentFileIndex ? {
                                  ...state,
                                  selected: {
                                    ...state.selected,
                                    [detection.id]: e.target.checked
                                  }
                                } : state
                              );
                              updateFileStates(
                                newStates,
                                'toggle-detection',
                                `${e.target.checked ? 'Selected' : 'Deselected'} ${detection.kind} detection`
                              );
                            }
                          }),
                          React.createElement('div', {
                            key: 'text'
                          }, [
                            React.createElement('div', {
                              key: 'kind',
                              style: { fontWeight: '600' }
                            }, `${detection.kind}: ${detection.preview || 'N/A'}`),
                            React.createElement('div', {
                              key: 'confidence',
                              style: { fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }
                            }, `Confidence: ${Math.round(detection.confidence * 100)}%`)
                          ])
                        ])
                      ])
                    ])
                  ])
                )),
                
                React.createElement('div', {
                  key: 'actions',
                  style: { marginTop: 'var(--space-xl)' }
                }, [
                  React.createElement('button', {
                    key: 'sanitize',
                    onClick: () => handleSanitize(currentFileIndex),
                    className: 'btn btn-primary',
                    disabled: currentFileState.processing
                  }, currentFileState.processing ? 'Processing...' : '🔒 Sanitize Document'),
                  
                  currentFileState.outputUri && React.createElement('button', {
                    key: 'download',
                    onClick: () => handleDownload(currentFileIndex),
                    className: 'btn btn-secondary',
                    style: { marginTop: 'var(--space-sm)' }
                  }, '📥 Download Clean File')
                ])
              ]) :
              React.createElement('div', {
                className: 'alert alert-success'
              }, [
                React.createElement('strong', { key: 'title' }, 'No sensitive information detected!'),
                React.createElement('p', {
                  key: 'message',
                  style: { margin: '0', marginTop: 'var(--space-xs)' }
                }, 'This document appears to be clean and safe to share.')
              ])
          )
        ])
      ])
    ]),

    // Modals
    React.createElement(MobilePresetManager, {
      key: 'preset-manager',
      isOpen: showPresetManager,
      onClose: () => setShowPresetManager(false),
      currentPresetId: presetId,
      onPresetSelect: setPresetId,
      presets: presets
    }),

    React.createElement(MobileHistoryDashboard, {
      key: 'history-dashboard',
      isOpen: showHistoryDashboard,
      onClose: () => setShowHistoryDashboard(false)
    }),

    React.createElement(MobileKeyboardHelp, {
      key: 'keyboard-help',
      isOpen: showKeyboardHelp,
      onClose: () => setShowKeyboardHelp(false)
    }),

    // Floating Controls
    fileStates.length > 0 && React.createElement(MobileUndoRedoControls, {
      key: 'undo-redo',
      onUndo: () => undoRedoSystem.undo(),
      onRedo: () => undoRedoSystem.redo(),
      canUndo: undoRedoSystem.canUndo,
      canRedo: undoRedoSystem.canRedo,
      onOpenHistory: () => console.log('Open mobile undo history')
    })
  ]);
}

// Wait for React to be available before initializing
function waitForReact() {
  return new Promise((resolve) => {
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log('React already available');
      resolve();
      return;
    }
    
    const checkReact = () => {
      if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
        console.log('React became available');
        resolve();
      } else {
        setTimeout(checkReact, 50);
      }
    };
    
    checkReact();
  });
}

// Initialize mobile app when DOM is ready and React is available
async function initializeMobileApp() {
  console.log('Initializing mobile app with Phase 2.4 features...');
  
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('Mobile app container not found');
    return false;
  }

  try {
    // Wait for React to be available
    await waitForReact();
    console.log('React confirmed available, proceeding with full mobile app...');
    
    // Initialize React hooks now that React is available
    initializeReactHooks();
    
    // Clear existing content and render React app
    appContainer.innerHTML = '';
    ReactDOM.render(React.createElement(MobileCleanSharePro), appContainer);
    console.log('✅ Mobile React app with Phase 2.4 features initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize mobile React app:', error);
    console.error('Error details:', error.stack);
    return false;
  }
}

// Export for global access
window.MobileCleanSharePro = {
  initializeMobileApp,
  MobileCleanSharePro
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for React to be loaded
  setTimeout(initializeMobileApp, 1000);
});