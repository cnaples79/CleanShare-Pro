import type { DetectionKind, RedactionStyle } from './types';

/** A preset defines which detection kinds are enabled and how they should be redacted. */
export interface Preset {
  id: string;
  name: string;
  enabledKinds: DetectionKind[];
  /** Optional mapping of detection kinds to a preferred redaction style */
  styleMap?: Partial<Record<DetectionKind, RedactionStyle>>;
  /** Optional array of custom regular expressions to detect additional patterns */
  customRegex?: string[];
}

// Predefined presets.  These can be customised by the user at runtime via the UI.
export const PRESETS: Preset[] = [
  {
    id: 'developer',
    name: 'Developer Secrets',
    enabledKinds: ['EMAIL', 'PHONE', 'PAN', 'JWT', 'API_KEY', 'IBAN', 'SSN', 'PASSPORT'],
    styleMap: {},
    customRegex: []
  },
  {
    id: 'work',
    name: 'Work Screenshot',
    enabledKinds: ['EMAIL', 'PHONE', 'PAN', 'JWT', 'API_KEY', 'NAME', 'ADDRESS', 'PASSPORT'],
    styleMap: {},
    customRegex: []
  },
  {
    id: 'all',
    name: 'All Detectors',
    enabledKinds: ['FACE','EMAIL','PHONE','PAN','IBAN','SSN','PASSPORT','JWT','API_KEY','BARCODE','NAME','ADDRESS','OTHER'],
    styleMap: {},
    customRegex: []
  }
];

/** Return all registered presets. */
export function listPresets(): Preset[] {
  return PRESETS.slice();
}

/** Lookup a preset by its ID. */
export function getPreset(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}

/** Save or update a preset.  If the ID exists, it will be replaced; otherwise it is added. */
export function savePreset(preset: Preset): void {
  const index = PRESETS.findIndex(p => p.id === preset.id);
  if (index >= 0) {
    PRESETS[index] = preset;
  } else {
    PRESETS.push(preset);
  }
}

/** Delete a preset by its ID.  If the preset does not exist, no action is taken. */
export function deletePreset(id: string): void {
  const index = PRESETS.findIndex(p => p.id === id);
  if (index >= 0) {
    PRESETS.splice(index, 1);
  }
}
