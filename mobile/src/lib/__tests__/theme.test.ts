import { theme } from '../theme';

describe('theme', () => {
  describe('colors', () => {
    it('should have primary color defined', () => {
      expect(theme.colors.primary).toBeDefined();
    });

    it('should have background colors defined', () => {
      expect(theme.colors.background).toBeDefined();
    });

    it('should have text colors defined', () => {
      expect(theme.colors.text).toBeDefined();
    });
  });

  describe('spacing', () => {
    it('should have consistent spacing values', () => {
      expect(typeof theme.spacing.sm).toBe('number');
      expect(typeof theme.spacing.md).toBe('number');
      expect(typeof theme.spacing.lg).toBe('number');
    });

    it('should have spacing values in increasing order', () => {
      expect(theme.spacing.sm).toBeLessThan(theme.spacing.md);
      expect(theme.spacing.md).toBeLessThan(theme.spacing.lg);
    });

    it('should have xs as smallest spacing', () => {
      expect(theme.spacing.xs).toBeLessThan(theme.spacing.sm);
    });
  });

  describe('borderRadius', () => {
    it('should have border radius values defined', () => {
      expect(theme.borderRadius).toBeDefined();
      expect(typeof theme.borderRadius.sm).toBe('number');
      expect(typeof theme.borderRadius.md).toBe('number');
    });
  });

  describe('fontSize', () => {
    it('should have font size values defined', () => {
      expect(theme.fontSize).toBeDefined();
      expect(typeof theme.fontSize.sm).toBe('number');
      expect(typeof theme.fontSize.md).toBe('number');
      expect(typeof theme.fontSize.lg).toBe('number');
    });

    it('should have font sizes in increasing order', () => {
      expect(theme.fontSize.sm).toBeLessThan(theme.fontSize.md);
      expect(theme.fontSize.md).toBeLessThan(theme.fontSize.lg);
    });
  });
});
