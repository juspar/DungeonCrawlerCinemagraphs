class TwinkleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = performance.now();
        
        // Configuration via data attributes
        this.spotColorRGB = this.canvas.dataset.spotColor || '255,255,255';
        this.pulseSpeed = this.canvas.dataset.pulseSpeed ? parseFloat(this.canvas.dataset.pulseSpeed) : 3.0; 
        this.rays = this.canvas.dataset.rays ? parseInt(this.canvas.dataset.rays) : 4;
        this.size = this.canvas.dataset.size ? parseFloat(this.canvas.dataset.size) : 0.04; // Fraction of screen width
        
        // Advanced configurations
        this.minOpacity = this.canvas.dataset.minOpacity !== undefined ? parseFloat(this.canvas.dataset.minOpacity) : 0.3;
        this.maxOpacity = this.canvas.dataset.maxOpacity !== undefined ? parseFloat(this.canvas.dataset.maxOpacity) : 1.0;
        this.minScale = this.canvas.dataset.minScale !== undefined ? parseFloat(this.canvas.dataset.minScale) : 0.4;
        this.maxScale = this.canvas.dataset.maxScale !== undefined ? parseFloat(this.canvas.dataset.maxScale) : 1.0;
        this.innerRatio = this.canvas.dataset.innerRatio !== undefined ? parseFloat(this.canvas.dataset.innerRatio) : 0.05;
        this.coreRatio = this.canvas.dataset.coreRatio !== undefined ? parseFloat(this.canvas.dataset.coreRatio) : 0.4;
        this.coreInnerRatio = this.canvas.dataset.coreInnerRatio !== undefined ? parseFloat(this.canvas.dataset.coreInnerRatio) : 0.15;
        this.rotationSpeed = this.canvas.dataset.rotationSpeed !== undefined ? parseFloat(this.canvas.dataset.rotationSpeed) : 0.05;
        
        this.originX = 0;
        this.originY = 0;
        this.pulseTime = Math.random() * Math.PI * 2; // Random start phase so multiple twinkles don't blink perfectly together
        
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
        
        const targetX = this.canvas.dataset.originX ? parseFloat(this.canvas.dataset.originX) : 0.5;
        const targetY = this.canvas.dataset.originY ? parseFloat(this.canvas.dataset.originY) : 0.5;
        
        this.originX = bounds.x + (bounds.w * targetX);
        this.originY = bounds.y + (bounds.h * targetY);
        this.baseRadius = bounds.w * this.size;
    }

    drawStar(x, y, radius, rays, innerRatio, rotation) {
        this.ctx.beginPath();
        for (let i = 0; i < rays * 2; i++) {
            let r = (i % 2 === 0) ? radius : radius * innerRatio;
            let angle = (Math.PI / rays) * i + rotation;
            this.ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
        }
        this.ctx.closePath();
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.pulseTime += deltaTime * this.pulseSpeed;
        
        // Pulse based on configured range
        const pulseSine = (Math.sin(this.pulseTime) + 1) / 2; // 0 to 1
        const scale = this.minScale + (pulseSine * (this.maxScale - this.minScale));
        const opacity = this.minOpacity + (pulseSine * (this.maxOpacity - this.minOpacity));
        
        const currentRadius = this.baseRadius * scale;

        // Slow rotation based on rotation speed
        const rotation = this.pulseTime * this.rotationSpeed + (Math.PI / 4);
        
        // Draw the main coloured rays
        this.ctx.fillStyle = `rgba(${this.spotColorRGB}, ${opacity})`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `rgba(${this.spotColorRGB}, 1)`;
        this.drawStar(this.originX, this.originY, currentRadius, this.rays, this.innerRatio, rotation);
        this.ctx.fill();

        // Draw a white hot core for the glint
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'white';
        // Draw a slightly smaller, fatter star for the core
        this.drawStar(this.originX, this.originY, currentRadius * this.coreRatio, this.rays, this.coreInnerRatio, rotation);
        this.ctx.fill();

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas.twinkle');
    canvases.forEach(c => new TwinkleSystem(c));
});
