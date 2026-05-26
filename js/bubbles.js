class BubblesSystem {
    constructor(canvasElementOrId) {
        this.canvas = typeof canvasElementOrId === 'string' ? document.getElementById(canvasElementOrId) : canvasElementOrId;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        this.spawnTimer = 0;
        this.imgBounds = { x: 0, y: 0, w: 0, h: 0 };

        const d = this.canvas.dataset;
        this.cfg = {
            velX:       d.velX       !== undefined ? parseFloat(d.velX)       : -0.00833, // Match default seabed
            velXRand:   d.velXRand   !== undefined ? parseFloat(d.velXRand)   :  0.002,
            velY:       d.velY       !== undefined ? parseFloat(d.velY)       : -0.05,
            velYRand:   d.velYRand   !== undefined ? parseFloat(d.velYRand)   :  0.03,
            spawnRate:  d.spawnRate  !== undefined ? parseFloat(d.spawnRate)  : 0.15,
            particleCount: 50 // initial
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initial spawn so screen isn't empty
        for (let i = 0; i < this.cfg.particleCount; i++) {
            this.spawnParticle(true);
        }
        
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
        this.canvas.width  = w;
        this.canvas.height = h;
        this.imgBounds = this.getCoverBounds(w, h);
    }

    spawnParticle(initial = false) {
        const b = this.imgBounds;
        const c = this.cfg;

        // If initial, spawn anywhere horizontally and vertically
        // If not initial, spawn off-screen right (if moving left) or at bottom
        let x, y;
        if (initial) {
            x = b.x + Math.random() * b.w;
            y = b.y + Math.random() * b.h;
        } else {
            // Spawn mostly at bottom or right edge
            if (Math.random() > 0.5) {
                // Bottom
                x = b.x + Math.random() * b.w;
                y = b.y + b.h + 20;
            } else {
                // Right edge
                x = b.x + b.w + 20;
                y = b.y + Math.random() * b.h;
            }
        }

        const radius = b.w * 0.002 + Math.random() * (b.w * 0.005);

        this.particles.push({
            x: x,
            y: y,
            radius: radius,
            vx: b.w * (c.velX - Math.random() * c.velXRand),
            vy: b.h * (c.velY - Math.random() * c.velYRand),
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 2 + Math.random() * 3,
            wobbleAmp: b.w * 0.005 + Math.random() * (b.w * 0.01)
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Spawning logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.cfg.spawnRate) {
            this.spawnParticle();
            this.spawnTimer = 0;
        }

        const b = this.imgBounds;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Movement
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.wobblePhase += p.wobbleSpeed * deltaTime;
            
            const wobbleX = p.x + Math.sin(p.wobblePhase) * p.wobbleAmp;

            // Remove if off-screen (too high, or too far left)
            if (p.y + p.radius < b.y - 50 || wobbleX + p.radius < b.x - 50) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw Bubble
            this.ctx.beginPath();
            this.ctx.arc(wobbleX, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.lineWidth = Math.max(1, p.radius * 0.1);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.stroke();
            this.ctx.closePath();
            
            // Draw Specular Highlight
            this.ctx.beginPath();
            this.ctx.arc(wobbleX - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fill();
            this.ctx.closePath();
        }

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas.bubbles');
    canvases.forEach(canvas => {
        new BubblesSystem(canvas);
    });
});
