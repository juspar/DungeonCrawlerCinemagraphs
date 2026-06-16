class DustSystem {
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
        this.spotColorRGB = d.spotColor || '240,240,240';
        
        this.enableGlow = d.enableGlow === "true";
        this.baseGlowRadius = d.glowRadius ? parseFloat(d.glowRadius) : (this.enableGlow ? 300 : 0);
        this.particleCount = 150;

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
            this.particles.push(new DustMote(this));
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

class DustMote {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * this.system.width;
        this.y = Math.random() * this.system.height; 
        
        this.size = Math.random() * 3.0 + 1.0;
        this.speedY = (Math.random() - 0.5) * 0.3; 
        this.speedX = (Math.random() - 0.5) * 0.3;
        
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 0.015 + 0.005;
    }

    update(timeScale = 1) {
        this.y += this.speedY * timeScale;
        this.driftAngle += this.driftSpeed * timeScale;
        this.x += (this.speedX + Math.sin(this.driftAngle) * 0.15) * timeScale;

        if (this.y < -20) this.y = this.system.height + 20;
        if (this.y > this.system.height + 20) this.y = -20;
        if (this.x < -20) this.x = this.system.width + 20;
        if (this.x > this.system.width + 20) this.x = -20;
    }

    draw() {
        const sys = this.system;
        const spotX = sys.imgBounds.x + (sys.imgBounds.w * sys.spotXPercent);
        const spotY = sys.imgBounds.y + (sys.imgBounds.h * sys.spotYPercent);
        
        const dx = this.x - spotX;
        const dy = this.y - spotY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let opacity = 0.35;
        let isIlluminated = false;
        
        if (sys.currentGlowRadius > 0 && distance < sys.currentGlowRadius) {
            const intensity = 1 - (distance / sys.currentGlowRadius);
            opacity = 0.35 + (intensity * 0.55);
            isIlluminated = true;
        }

        sys.ctx.beginPath();
        sys.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        if (isIlluminated) {
            sys.ctx.fillStyle = `rgba(${sys.spotColorRGB}, ${opacity})`;
            sys.ctx.shadowBlur = 8;
            sys.ctx.shadowColor = `rgba(${sys.spotColorRGB}, ${opacity})`;
        } else {
            sys.ctx.fillStyle = `rgba(240, 240, 240, ${opacity})`;
            sys.ctx.shadowBlur = 3;
            sys.ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 1.5})`; 
        }
        
        sys.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas.dust, #dust-canvas');
    canvases.forEach(canvas => {
        if (!canvas.dataset.systemInitialized) {
            canvas.dataset.systemInitialized = 'true';
            new DustSystem(canvas);
        }
    });
});
