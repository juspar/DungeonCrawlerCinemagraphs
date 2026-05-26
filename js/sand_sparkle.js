class SandSparkleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        this.elapsed = 0;

        // Configuration via data attributes
        const d = this.canvas.dataset;
        this.sparkleCount = d.sparkleCount ? parseInt(d.sparkleCount, 10) : 300;
        this.colorRGB = d.color || '240, 200, 120'; // Warm sandy gold default
        
        // Vertical distribution range for performance optimization
        this.yMinPercent = d.yMin !== undefined ? parseFloat(d.yMin) : 0.0;
        this.yMaxPercent = d.yMax !== undefined ? parseFloat(d.yMax) : 1.0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    getCoverBounds(w, h) {
        const imgAspect = 1920 / 1080;
        const canvasAspect = w / h;
        let drawW, drawH;
        if (canvasAspect > imgAspect) {
            drawW = w;
            drawH = w / imgAspect;
        } else {
            drawH = h;
            drawW = h * imgAspect;
        }
        return {
            x: (w - drawW) / 2,
            y: (h - drawH) / 2,
            w: drawW,
            h: drawH
        };
    }

    resize() {
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = w;
        this.canvas.height = h;

        const bounds = this.getCoverBounds(w, h);
        this.particles = [];

        // Distribute sand sparkles within the bounded sand region
        const yMin = bounds.y + (bounds.h * this.yMinPercent);
        const yMax = bounds.y + (bounds.h * this.yMaxPercent);

        for (let i = 0; i < this.sparkleCount; i++) {
            this.particles.push({
                x: bounds.x + Math.random() * bounds.w,
                y: yMin + Math.random() * (yMax - yMin),
                size: Math.random() * 0.75 + 0.5, // Tiny sharp points (0.5 to 1.25px)
                period: 0.4 + Math.random() * 1.1, // Rapid sparkling (0.4s to 1.5s per cycle)
                phaseOffset: Math.random() * Math.PI * 2, // Random start phase
                baseOpacity: 0.1 + Math.random() * 0.2, // Floor opacity
                peakOpacity: 0.7 + Math.random() * 0.3 // Sharp glint peak opacity
            });
        }
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap deltaTime to avoid massive jump when returning to active tab
        const dt = Math.min(deltaTime, 0.1);
        this.elapsed += dt;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Rapid sine wave sparkle oscillation
            const sine = Math.sin((this.elapsed / p.period) * Math.PI * 2 + p.phaseOffset);
            
            // Remap to baseOpacity-peakOpacity
            const opacity = p.baseOpacity + ((sine + 1) / 2) * (p.peakOpacity - p.baseOpacity);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this.colorRGB}, ${opacity})`;
            
            // Sharper glow effect (very small blur, matching the tiny particles)
            this.ctx.shadowBlur = 2;
            this.ctx.shadowColor = `rgba(${this.colorRGB}, ${opacity * 0.8})`;
            this.ctx.fill();
        }

        // Reset shadow for subsequent canvas systems
        this.ctx.shadowBlur = 0;

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas.sand-sparkle');
    canvases.forEach(canvas => new SandSparkleSystem(canvas));
});
