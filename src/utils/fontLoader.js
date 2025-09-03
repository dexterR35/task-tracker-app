/**
 * Font Loading Utility for optimized font management
 * This utility helps prevent font loading from blocking the critical rendering path
 */

class FontLoader {
  constructor() {
    this.loadedFonts = new Set();
    this.fontQueue = [];
    this.isLoading = false;
  }

  /**
   * Load critical fonts immediately
   */
  async loadCriticalFonts() {
    try {
      const criticalFonts = [
        { weight: 400, style: 'normal' },
        { weight: 500, style: 'normal' }
      ];

      await Promise.all(
        criticalFonts.map(font => this.loadFont(font.weight, font.style))
      );
    } catch (error) {
      console.warn('Failed to load critical fonts:', error);
    }
  }

  /**
   * Load non-critical fonts when idle
   */
  async loadNonCriticalFonts() {
    try {
      const nonCriticalFonts = [
        { weight: 300, style: 'normal' },
        { weight: 300, style: 'italic' },
        { weight: 400, style: 'italic' },
        { weight: 700, style: 'normal' },
        { weight: 800, style: 'normal' },
        { weight: 900, style: 'normal' }
      ];

      // Load fonts in parallel for better performance
      await Promise.all(
        nonCriticalFonts.map(font => this.loadFont(font.weight, font.style))
      );
    } catch (error) {
      console.warn('Failed to load non-critical fonts:', error);
    }
  }

  /**
   * Load a specific font weight and style
   */
  async loadFont(weight, style = 'normal') {
    const fontKey = `${weight}-${style}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return;
    }

    try {
      // Import the font CSS dynamically
      const fontPath = style === 'italic' 
        ? `@fontsource/roboto/${weight}-italic.css`
        : `@fontsource/roboto/${weight}.css`;
      
      await import(fontPath);
      this.loadedFonts.add(fontKey);
      
      // Dispatch custom event for font loaded
      window.dispatchEvent(new CustomEvent('fontLoaded', { 
        detail: { weight, style } 
      }));
    } catch (error) {
      console.warn(`Failed to load font ${fontKey}:`, error);
    }
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(weight, style = 'normal') {
    const fontKey = `${weight}-${style}`;
    return this.loadedFonts.has(fontKey);
  }

  /**
   * Get loading status
   */
  getLoadingStatus() {
    return {
      loadedFonts: Array.from(this.loadedFonts),
      isLoading: this.isLoading,
      totalFonts: 8 // Total number of fonts we're loading
    };
  }

  /**
   * Preload fonts for better performance
   */
  preloadFonts() {
    const criticalFonts = [
      { weight: 400, style: 'normal' },
      { weight: 500, style: 'normal' }
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = `/node_modules/@fontsource/roboto/${font.weight}${font.style === 'italic' ? '-italic' : ''}.css`;
      document.head.appendChild(link);
    });
  }
}

// Create singleton instance
const fontLoader = new FontLoader();

export default fontLoader;
