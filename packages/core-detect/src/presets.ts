import type { DetectionKind, RedactionStyle, CustomPattern, RedactionConfig } from './types';

/** A preset defines which detection kinds are enabled and how they should be redacted. */
export interface Preset {
  id: string;
  name: string;
  description?: string;
  domain?: 'Healthcare' | 'Finance' | 'Legal' | 'Government' | 'Education' | 'Technology' | 'General';
  enabledKinds: DetectionKind[];
  /** Optional mapping of detection kinds to a preferred redaction style */
  styleMap?: Partial<Record<DetectionKind, RedactionStyle>>;
  /** Optional array of custom regular expressions to detect additional patterns */
  customRegex?: string[];
  /** Custom detection patterns with full configuration */
  customPatterns?: CustomPattern[];
  /** Default redaction configuration */
  defaultRedactionConfig?: RedactionConfig;
  /** Minimum confidence threshold for this preset */
  confidenceThreshold?: number;
  /** Whether this preset is user-created (vs built-in) */
  isUserCreated?: boolean;
  /** Creation/modification timestamps */
  createdAt?: string;
  updatedAt?: string;
  /** Version for compatibility tracking */
  version?: string;
}

export interface PresetImportResult {
  success: boolean;
  preset?: Preset;
  errors: string[];
  warnings: string[];
}

export interface PresetExportOptions {
  includeMetadata?: boolean;
  format?: 'json' | 'compact';
}

// Predefined presets.  These can be customised by the user at runtime via the UI.
export const PRESETS: Preset[] = [
  {
    id: 'developer',
    name: 'Developer Secrets',
    description: 'Detects technical secrets like API keys, tokens, and database credentials',
    domain: 'Technology',
    enabledKinds: ['EMAIL', 'PHONE', 'PAN', 'JWT', 'API_KEY', 'IBAN', 'SSN', 'PASSPORT'],
    styleMap: {
      'JWT': 'BOX',
      'API_KEY': 'BOX',
      'EMAIL': 'BLUR',
      'PHONE': 'PIXELATE'
    },
    defaultRedactionConfig: {
      color: '#ff0000',
      opacity: 0.8
    },
    confidenceThreshold: 0.7,
    customRegex: [],
    version: '1.0.0'
  },
  {
    id: 'work',
    name: 'Work Screenshot',
    description: 'Professional document sanitization for workplace sharing',
    domain: 'General',
    enabledKinds: ['EMAIL', 'PHONE', 'PAN', 'JWT', 'API_KEY', 'NAME', 'ADDRESS', 'PASSPORT'],
    styleMap: {
      'NAME': 'LABEL',
      'EMAIL': 'BLUR',
      'PHONE': 'MASK_LAST4',
      'ADDRESS': 'BOX'
    },
    defaultRedactionConfig: {
      color: '#000000',
      opacity: 1.0,
      labelText: '[REDACTED]'
    },
    confidenceThreshold: 0.6,
    customRegex: [],
    version: '1.0.0'
  },
  {
    id: 'all',
    name: 'All Detectors',
    description: 'Maximum security - detects all types of sensitive information',
    domain: 'General',
    enabledKinds: ['FACE','EMAIL','PHONE','PAN','IBAN','SSN','PASSPORT','JWT','API_KEY','BARCODE','NAME','ADDRESS','OTHER'],
    styleMap: {},
    defaultRedactionConfig: {
      color: '#000000',
      opacity: 0.9
    },
    confidenceThreshold: 0.5,
    customRegex: [],
    version: '1.0.0'
  },
  // Domain-specific preset templates
  {
    id: 'healthcare',
    name: 'Healthcare (HIPAA)',
    description: 'HIPAA-compliant sanitization for medical documents and communications',
    domain: 'Healthcare',
    enabledKinds: ['NAME', 'SSN', 'PHONE', 'EMAIL', 'ADDRESS', 'OTHER'],
    styleMap: {
      'SSN': 'BOX',
      'NAME': 'LABEL',
      'PHONE': 'MASK_LAST4',
      'EMAIL': 'BLUR',
      'ADDRESS': 'BOX'
    },
    customPatterns: [
      {
        id: 'mrn',
        name: 'Medical Record Number',
        pattern: '\\b(MRN|Medical Record|Patient ID)\\s*:?\\s*([A-Z0-9]{6,12})\\b',
        kind: 'OTHER',
        confidence: 0.9,
        description: 'Medical record numbers and patient identifiers',
        caseSensitive: false
      },
      {
        id: 'dob',
        name: 'Date of Birth',
        pattern: '\\b(DOB|Date of Birth|Born)\\s*:?\\s*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\b',
        kind: 'OTHER',
        confidence: 0.8,
        description: 'Date of birth patterns',
        caseSensitive: false
      }
    ],
    defaultRedactionConfig: {
      color: '#000000',
      opacity: 1.0,
      labelText: '[PHI REDACTED]'
    },
    confidenceThreshold: 0.8,
    version: '1.0.0'
  },
  {
    id: 'finance',
    name: 'Financial Services',
    description: 'Financial document sanitization including PCI DSS compliance',
    domain: 'Finance',
    enabledKinds: ['PAN', 'IBAN', 'SSN', 'NAME', 'PHONE', 'EMAIL', 'ADDRESS'],
    styleMap: {
      'PAN': 'MASK_LAST4',
      'IBAN': 'MASK_LAST4',
      'SSN': 'BOX',
      'NAME': 'LABEL',
      'PHONE': 'PIXELATE',
      'EMAIL': 'BLUR'
    },
    customPatterns: [
      {
        id: 'account_number',
        name: 'Account Number',
        pattern: '\\b(Account|Acct)\\s*#?:?\\s*([0-9]{8,16})\\b',
        kind: 'PAN',
        confidence: 0.85,
        description: 'Bank account numbers',
        caseSensitive: false
      },
      {
        id: 'routing_number',
        name: 'Routing Number',
        pattern: '\\b(Routing|ABA)\\s*#?:?\\s*([0-9]{9})\\b',
        kind: 'OTHER',
        confidence: 0.9,
        description: 'Bank routing numbers',
        caseSensitive: false
      }
    ],
    defaultRedactionConfig: {
      color: '#000000',
      opacity: 0.95,
      labelText: '[FINANCIAL INFO]'
    },
    confidenceThreshold: 0.75,
    version: '1.0.0'
  },
  {
    id: 'legal',
    name: 'Legal Documents',
    description: 'Attorney-client privilege and legal document sanitization',
    domain: 'Legal',
    enabledKinds: ['NAME', 'SSN', 'PHONE', 'EMAIL', 'ADDRESS', 'OTHER'],
    styleMap: {
      'NAME': 'LABEL',
      'SSN': 'BOX',
      'PHONE': 'BLUR',
      'EMAIL': 'BLUR',
      'ADDRESS': 'LABEL'
    },
    customPatterns: [
      {
        id: 'case_number',
        name: 'Case Number',
        pattern: '\\b(Case|Cause|Docket)\\s*(No\\.?|Number|#)\\s*:?\\s*([A-Z0-9-]{6,20})\\b',
        kind: 'OTHER',
        confidence: 0.9,
        description: 'Legal case and docket numbers',
        caseSensitive: false
      },
      {
        id: 'bar_number',
        name: 'Bar Number',
        pattern: '\\b(Bar|Attorney)\\s*(No\\.?|Number|#)\\s*:?\\s*([A-Z0-9]{5,12})\\b',
        kind: 'OTHER',
        confidence: 0.85,
        description: 'Attorney bar numbers',
        caseSensitive: false
      }
    ],
    defaultRedactionConfig: {
      color: '#000000',
      opacity: 1.0,
      labelText: '[CONFIDENTIAL]'
    },
    confidenceThreshold: 0.7,
    version: '1.0.0'
  }
];

// Local storage key for user presets
const USER_PRESETS_KEY = 'cleanshare_user_presets';

// Load user presets from localStorage on startup
let userPresets: Preset[] = [];
try {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(USER_PRESETS_KEY);
    if (stored) {
      userPresets = JSON.parse(stored);
    }
  }
} catch (error) {
  console.warn('Failed to load user presets from localStorage:', error);
}

/** Return all registered presets (built-in + user-created). */
export function listPresets(): Preset[] {
  return [...PRESETS, ...userPresets];
}

/** Return only built-in presets. */
export function listBuiltinPresets(): Preset[] {
  return PRESETS.slice();
}

/** Return only user-created presets. */
export function listUserPresets(): Preset[] {
  return userPresets.slice();
}

/** Return presets filtered by domain. */
export function listPresetsByDomain(domain: string): Preset[] {
  return listPresets().filter(p => p.domain === domain);
}

/** Lookup a preset by its ID. */
export function getPreset(id: string): Preset | undefined {
  return listPresets().find(p => p.id === id);
}

/** Generate a unique preset ID */
function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Save user presets to localStorage */
function saveUserPresetsToStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
    }
  } catch (error) {
    console.warn('Failed to save user presets to localStorage:', error);
  }
}

/** Save or update a preset.  If the ID exists, it will be replaced; otherwise it is added. */
export function savePreset(preset: Preset): void {
  // Ensure preset has required metadata
  const now = new Date().toISOString();
  const enhancedPreset: Preset = {
    ...preset,
    id: preset.id || generatePresetId(),
    isUserCreated: true,
    updatedAt: now,
    createdAt: preset.createdAt || now,
    version: preset.version || '1.0.0'
  };

  // Check if it's a built-in preset
  const builtinIndex = PRESETS.findIndex(p => p.id === enhancedPreset.id);
  if (builtinIndex >= 0) {
    // Don't allow overwriting built-in presets, create a copy instead
    enhancedPreset.id = generatePresetId();
    enhancedPreset.name = `${enhancedPreset.name} (Custom)`;
  }

  // Save to user presets
  const userIndex = userPresets.findIndex(p => p.id === enhancedPreset.id);
  if (userIndex >= 0) {
    userPresets[userIndex] = enhancedPreset;
  } else {
    userPresets.push(enhancedPreset);
  }

  saveUserPresetsToStorage();
}

/** Create a new preset from scratch */
export function createPreset(name: string, options: Partial<Preset> = {}): Preset {
  const preset: Preset = {
    id: generatePresetId(),
    name,
    description: options.description || '',
    domain: options.domain || 'General',
    enabledKinds: options.enabledKinds || [],
    styleMap: options.styleMap || {},
    customRegex: options.customRegex || [],
    customPatterns: options.customPatterns || [],
    defaultRedactionConfig: options.defaultRedactionConfig || {
      color: '#000000',
      opacity: 0.9
    },
    confidenceThreshold: options.confidenceThreshold || 0.6,
    isUserCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  savePreset(preset);
  return preset;
}

/** Duplicate an existing preset */
export function duplicatePreset(id: string, newName?: string): Preset | undefined {
  const original = getPreset(id);
  if (!original) return undefined;

  const preset: Preset = {
    ...original,
    id: generatePresetId(),
    name: newName || `${original.name} (Copy)`,
    isUserCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  savePreset(preset);
  return preset;
}

/** Delete a preset by its ID.  Built-in presets cannot be deleted. */
export function deletePreset(id: string): boolean {
  // Don't allow deleting built-in presets
  const isBuiltin = PRESETS.some(p => p.id === id);
  if (isBuiltin) return false;

  const index = userPresets.findIndex(p => p.id === id);
  if (index >= 0) {
    userPresets.splice(index, 1);
    saveUserPresetsToStorage();
    return true;
  }
  return false;
}

/** Validate a preset object */
export function validatePreset(preset: any): PresetImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!preset.id || typeof preset.id !== 'string') {
    errors.push('Preset must have a valid ID');
  }
  if (!preset.name || typeof preset.name !== 'string') {
    errors.push('Preset must have a valid name');
  }
  if (!Array.isArray(preset.enabledKinds)) {
    errors.push('Preset must have an enabledKinds array');
  }

  // Validate detection kinds
  const validKinds: DetectionKind[] = ['FACE','EMAIL','PHONE','PAN','IBAN','SSN','PASSPORT','JWT','API_KEY','BARCODE','NAME','ADDRESS','OTHER'];
  if (preset.enabledKinds) {
    const invalidKinds = preset.enabledKinds.filter((kind: string) => !validKinds.includes(kind as DetectionKind));
    if (invalidKinds.length > 0) {
      warnings.push(`Unknown detection kinds: ${invalidKinds.join(', ')}`);
    }
  }

  // Validate custom patterns
  if (preset.customPatterns && Array.isArray(preset.customPatterns)) {
    preset.customPatterns.forEach((pattern: any, index: number) => {
      if (!pattern.id || !pattern.name || !pattern.pattern) {
        errors.push(`Custom pattern ${index + 1} is missing required fields (id, name, pattern)`);
      }
      if (pattern.pattern) {
        try {
          new RegExp(pattern.pattern);
        } catch (error) {
          errors.push(`Custom pattern ${index + 1} has invalid regex: ${pattern.pattern}`);
        }
      }
    });
  }

  // Validate confidence threshold
  if (preset.confidenceThreshold !== undefined) {
    if (typeof preset.confidenceThreshold !== 'number' || preset.confidenceThreshold < 0 || preset.confidenceThreshold > 1) {
      warnings.push('Confidence threshold should be a number between 0 and 1');
    }
  }

  return {
    success: errors.length === 0,
    preset: errors.length === 0 ? preset as Preset : undefined,
    errors,
    warnings
  };
}

/** Import a preset from JSON */
export function importPreset(json: string): PresetImportResult {
  try {
    const data = JSON.parse(json);
    const validation = validatePreset(data);
    
    if (validation.success && validation.preset) {
      // Check for ID conflicts and generate new ID if needed
      const existingPreset = getPreset(validation.preset.id);
      if (existingPreset) {
        validation.preset.id = generatePresetId();
        validation.preset.name = `${validation.preset.name} (Imported)`;
        validation.warnings.push('Preset ID already exists, generated new ID');
      }

      // Mark as user-created and update timestamps
      validation.preset.isUserCreated = true;
      validation.preset.createdAt = new Date().toISOString();
      validation.preset.updatedAt = new Date().toISOString();

      savePreset(validation.preset);
    }

    return validation;
  } catch (error) {
    return {
      success: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/** Export a preset to JSON */
export function exportPreset(id: string, options: PresetExportOptions = {}): string | null {
  const preset = getPreset(id);
  if (!preset) return null;

  const exportData = { ...preset };

  // Remove metadata if requested
  if (!options.includeMetadata) {
    delete exportData.createdAt;
    delete exportData.updatedAt;
    delete exportData.isUserCreated;
  }

  if (options.format === 'compact') {
    return JSON.stringify(exportData);
  } else {
    return JSON.stringify(exportData, null, 2);
  }
}

/** Export all user presets */
export function exportAllUserPresets(options: PresetExportOptions = {}): string {
  const presets = listUserPresets();
  const exportData = presets.map(preset => {
    const data = { ...preset };
    if (!options.includeMetadata) {
      delete data.createdAt;
      delete data.updatedAt;
      delete data.isUserCreated;
    }
    return data;
  });

  if (options.format === 'compact') {
    return JSON.stringify(exportData);
  } else {
    return JSON.stringify(exportData, null, 2);
  }
}

/** Import multiple presets from JSON array */
export function importMultiplePresets(json: string): PresetImportResult[] {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      return [{
        success: false,
        errors: ['Expected JSON array of presets'],
        warnings: []
      }];
    }

    return data.map(presetData => importPreset(JSON.stringify(presetData)));
  } catch (error) {
    return [{
      success: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    }];
  }
}

/** Reset all user presets (clear localStorage) */
export function resetUserPresets(): void {
  userPresets = [];
  saveUserPresetsToStorage();
}
