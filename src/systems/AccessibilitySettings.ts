/**
 * Accessibility settings — persisted to localStorage.
 * Provides toggles for reduced motion, vibration, color assist, etc.
 */

export interface AccessibilityConfig {
  vibration: boolean;
  reducedScreenShake: boolean;
  reducedFlash: boolean;
  largerUI: boolean;
  colorAssist: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  inputSensitivity: number; // 0.5 – 2.0, default 1.0
}

const STORAGE_KEY = 'neon_descent_accessibility';

const DEFAULTS: AccessibilityConfig = {
  vibration: true,
  reducedScreenShake: false,
  reducedFlash: false,
  largerUI: false,
  colorAssist: 'none',
  inputSensitivity: 1.0,
};

export class AccessibilitySettings {
  config: AccessibilityConfig;

  constructor() {
    this.config = { ...DEFAULTS };
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.config = { ...DEFAULTS, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
  }

  toggle(key: keyof AccessibilityConfig): void {
    const val = this.config[key];
    if (typeof val === 'boolean') {
      (this.config as any)[key] = !val;
      this.save();
    }
  }

  setColorAssist(mode: AccessibilityConfig['colorAssist']): void {
    this.config.colorAssist = mode;
    this.save();
  }

  setInputSensitivity(value: number): void {
    this.config.inputSensitivity = Math.max(0.5, Math.min(2.0, value));
    this.save();
  }

  /** Screen shake multiplier (0.2 if reduced, 1.0 normal) */
  get shakeMultiplier(): number {
    return this.config.reducedScreenShake ? 0.2 : 1.0;
  }

  /** Flash intensity multiplier (0.15 if reduced, 1.0 normal) */
  get flashMultiplier(): number {
    return this.config.reducedFlash ? 0.15 : 1.0;
  }

  /** UI scale multiplier (1.25 if larger, 1.0 normal) */
  get uiScale(): number {
    return this.config.largerUI ? 1.25 : 1.0;
  }
}
