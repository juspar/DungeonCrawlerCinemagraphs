class InsectSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.imgBounds = { x: 0, y: 0, w: 0, h: 0 };
        this.currentGlowRadius = 0;

        const d = this.canvas.dataset;
        this.spotXPercent = d.spotX ? parseFloat(d.spotX) : 0.5;
        this.spotYPercent = d.spotY ? parseFloat(d.spotY) : 0.5;
        this.spotColorRGB = d.spotColor || '200,255,150';
        
        this.enableGlow = d.enableGlow === "true";
        this.baseGlowRadius = d.glowRadius ? parseFloat(d.glowRadius) : (this.enableGlow ? 300 : 0);
        this.particleCount = d.particleCount ? parseInt(d.particleCount) : 100;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initParticles();
        this.lastTime = 0;
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
        this.width = this.canvas.clientWidth || window.innerWidth;
        this.height = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.imgBounds = this.getCoverBounds(this.width, this.height);
        
        // Scale the glow radius with the image bounds width relative to 1920
        this.currentGlowRadius = this.baseGlowRadius * (this.imgBounds.w / 1920);
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new InsectMote(this));
        }
    }

    animate(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        const timeScale = Math.min(deltaTime / 16.666, 3);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';

        for (let particle of this.particles) {
            particle.update(timeScale);
            particle.draw();
        }

        requestAnimationFrame(this.animate);
    }
}

class InsectMote {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }

    getMinX(y) {
        // Line that follows the road from lower left to upper right
        // t is 0 at vanishing point (y = 20%), 1 at bottom (y = 100%)
        let t = (y - this.system.height * 0.2) / (this.system.height * 0.8);
        t = Math.max(0, Math.min(1, t)); 
        // ~65% at the top vanishing point, ~5% at the bottom to spill over road/bed
        let minXPercent = 0.65 - (t * 0.60);
        return this.system.width * minXPercent;
    }

    reset(initial = false) {
        // Confine vertically between vanishing point (20%) and bottom (100%)
        this.y = (this.system.height * 0.2) + Math.random() * (this.system.height * 0.8);
        
        let minX = this.getMinX(this.y);
        // Distribute to the right of the dynamic minimum X boundary
        this.x = minX + Math.random() * (this.system.width - minX + 50); 
        
        this.speedYBase = (Math.random() - 0.5) * 2.0; 
        this.speedXBase = (Math.random() - 0.5) * 1.5;
        
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 0.08 + 0.02;
        this.wobbleAngle = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.15 + 0.05;
        
        this.size = 1; // Updated dynamically
        this.depthFactor = 1;
    }

    update(timeScale = 1) {
        // Depth mapping: higher on Y axis (lower value) = smaller and slower
        // Vanishing point around y = 20% of screen
        let vPointY = this.system.height * 0.20;
        
        // depthFactor maps distance from vanishing point down to bottom
        this.depthFactor = Math.max(0.0, Math.min(1.0, (this.y - vPointY) / (this.system.height - vPointY)));
        
        // Exponential feel for depth
        let visualDepth = Math.pow(this.depthFactor, 1.5);
        
        this.size = 0.5 + (visualDepth * 4.0); // Size from 0.5 to 4.5
        let speedMult = 0.15 + (visualDepth * 1.5); // Slower at top, faster at bottom

        this.y += this.speedYBase * speedMult * timeScale;
        this.driftAngle += this.driftSpeed * timeScale;
        this.wobbleAngle += this.wobbleSpeed * timeScale;
        
        // Erratic insect movement combined with base speed
        let erraticX = Math.sin(this.driftAngle) * 1.0 + Math.cos(this.wobbleAngle) * 0.5;
        this.x += (this.speedXBase + erraticX) * speedMult * timeScale;

        // Wrap around bounds
        if (this.y < vPointY - 20) {
            this.y = this.system.height + 50;
            let minX = this.getMinX(this.y);
            this.x = minX + Math.random() * (this.system.width - minX + 50);
        }
        if (this.y > this.system.height + 50) {
            this.y = vPointY;
            let minX = this.getMinX(this.y);
            this.x = minX + Math.random() * (this.system.width - minX + 50);
        }
        
        let currentMinX = this.getMinX(this.y) - 50; // allow a little wiggle room
        if (this.x < currentMinX) {
            this.x = this.system.width + 50;
            this.y = vPointY + Math.random() * (this.system.height - vPointY);
        }
        if (this.x > this.system.width + 50) {
            this.x = currentMinX;
            this.y = vPointY + Math.random() * (this.system.height - vPointY);
        }
    }

    draw() {
        const sys = this.system;
        const spotX = sys.imgBounds.x + (sys.imgBounds.w * sys.spotXPercent);
        const spotY = sys.imgBounds.y + (sys.imgBounds.h * sys.spotYPercent);
        
        const dx = this.x - spotX;
        const dy = this.y - spotY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let opacity = 0.3 + Math.min(this.size / 4, 0.6); // Based on size (depth)
        
        // Fade out as they reach the vanishing point
        opacity *= Math.min(1.0, this.depthFactor * 4.0); 

        if (opacity <= 0.02) return; // Skip drawing if practically invisible

        let isIlluminated = false;
        
        if (sys.currentGlowRadius > 0 && distance < sys.currentGlowRadius) {
            const intensity = Math.max(0, 1 - (distance / sys.currentGlowRadius));
            opacity = Math.min(1.0, opacity + (intensity * 0.5));
            isIlluminated = true;
        }

        sys.ctx.beginPath();
        sys.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        if (isIlluminated) {
            sys.ctx.fillStyle = `rgba(${sys.spotColorRGB}, ${opacity})`;
            sys.ctx.shadowBlur = this.size * 3;
            sys.ctx.shadowColor = `rgba(${sys.spotColorRGB}, ${opacity})`;
        } else {
            // Default swampy insect glow
            sys.ctx.fillStyle = `rgba(180, 255, 100, ${opacity})`;
            sys.ctx.shadowBlur = this.size * 2;
            sys.ctx.shadowColor = `rgba(100, 200, 50, ${opacity * 0.8})`; 
        }
        
        sys.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas.insects, #insects-canvas');
    canvases.forEach(canvas => {
        if (!canvas.dataset.systemInitialized) {
            canvas.dataset.systemInitialized = 'true';
            new InsectSystem(canvas);
        }
    });
});
