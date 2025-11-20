/**
 * Animated Favicon Utility
 * Creates a glowing/pulsing effect for the xiXoi favicon
 */

export class AnimatedFavicon {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private link: HTMLLinkElement | null;
  private img: HTMLImageElement;
  private animationFrame: number | null = null;
  private startTime: number = 0;

  constructor(faviconPath: string = '/favicon.png') {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.img = new Image();
    this.img.src = faviconPath;
    
    // Find or create favicon link element
    this.link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!this.link) {
      this.link = document.createElement('link');
      this.link.rel = 'icon';
      document.head.appendChild(this.link);
    }

    // Start animation when image loads
    this.img.onload = () => {
      this.startAnimation();
    };
  }

  private draw(glowIntensity: number) {
    const { width, height } = this.canvas;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Apply glow effect
    this.ctx.shadowBlur = 10 + glowIntensity * 5;
    this.ctx.shadowColor = `rgba(0, 212, 255, ${0.5 + glowIntensity * 0.5})`;
    
    // Draw the favicon image
    this.ctx.drawImage(this.img, 0, 0, width, height);
    
    // Update favicon
    if (this.link) {
      this.link.href = this.canvas.toDataURL('image/png');
    }
  }

  private animate = (timestamp: number) => {
    if (!this.startTime) this.startTime = timestamp;
    const elapsed = timestamp - this.startTime;
    
    // Pulse effect: sin wave for smooth breathing animation (2s cycle)
    const glowIntensity = (Math.sin(elapsed / 1000) + 1) / 2; // 0 to 1
    
    this.draw(glowIntensity);
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  public startAnimation() {
    if (this.animationFrame) return;
    this.startTime = 0;
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  public stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public destroy() {
    this.stopAnimation();
    if (this.link && this.link.href.startsWith('data:')) {
      this.link.href = '/favicon.png';
    }
  }
}

// Initialize animated favicon
let animatedFavicon: AnimatedFavicon | null = null;

export const initAnimatedFavicon = () => {
  if (typeof window === 'undefined') return;
  
  if (!animatedFavicon) {
    animatedFavicon = new AnimatedFavicon();
  }
  
  return animatedFavicon;
};

export const stopAnimatedFavicon = () => {
  if (animatedFavicon) {
    animatedFavicon.destroy();
    animatedFavicon = null;
  }
};
