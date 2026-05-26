class SteamSystem {
    constructor(canvasElementOrId) {
        this.canvas = typeof canvasElementOrId === 'string' ? document.getElementById(canvasElementOrId) : canvasElementOrId;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        this.spawnTimer = 0;

        // --- SPAWN CONFIGURATION (data-* attributes on the canvas element) ---
        //
        // data-origin-x      Fractional X of the spawn edge (default 1.0 = right edge).
        //                    Values >1 start off-screen; <0 start off the left edge.
        // data-origin-y-min  Fractional Y of the top of the spawn band   (default 0.0)
        // data-origin-y-max  Fractional Y of the bottom of the spawn band (default 0.5)
        // data-vel-x         Base horizontal velocity as a fraction of canvas width per second.
        //                    Negative = left, positive = right.          (default -0.05)
        // data-vel-x-rand    Additional random range added to vel-x.     (default  0.05)
        // data-vel-y         Base vertical velocity as a fraction of canvas height per second.
        //                    Negative = up, positive = down.             (default -0.02)
        // data-vel-y-rand    Additional random range added to vel-y.     (default  0.03)
        // data-spawn-rate    Seconds between particle spawns             (default  0.1)
        const d = this.canvas.dataset;
        this.cfg = {
            originX:    d.originX    !== undefined ? parseFloat(d.originX)    : 1.0,
            originYMin: d.originYMin !== undefined ? parseFloat(d.originYMin) : 0.0,
            originYMax: d.originYMax !== undefined ? parseFloat(d.originYMax) : 0.5,
            velX:       d.velX       !== undefined ? parseFloat(d.velX)       : -0.05,
            velXRand:   d.velXRand   !== undefined ? parseFloat(d.velXRand)   :  0.05,
            velY:       d.velY       !== undefined ? parseFloat(d.velY)       : -0.02,
            velYRand:   d.velYRand   !== undefined ? parseFloat(d.velYRand)   :  0.03,
            spawnRate:  d.spawnRate  !== undefined ? parseFloat(d.spawnRate)  : 0.1,
        };
        this.spawnRate = this.cfg.spawnRate;

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
        this.canvas.width  = w;
        this.canvas.height = h;
        this.imgBounds = this.getCoverBounds(w, h);
    }

    spawnParticle() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const b = this.imgBounds;
        const c = this.cfg;

        // Spawn X: fractional position. Values outside 0–1 start off-screen.
        // Add a small pixel nudge (10px) so particles appear just beyond the edge.
        const edgeNudge = c.originX >= 1 ? 10 : c.originX <= 0 ? -10 : 0;
        const x = b.x + (b.w * c.originX) + edgeNudge;

        // Spawn Y: random point within the configured band
        const yMin = b.y + (b.h * c.originYMin);
        const yMax = b.y + (b.h * c.originYMax);
        const y = yMin + Math.random() * (yMax - yMin);

        const radius = b.w * 0.05 + Math.random() * (b.w * 0.05);

        this.particles.push({
            x: x,
            y: y,
            radius: radius,
            maxRadius: radius * (2 + Math.random() * 2),
            vx: b.w * (c.velX - Math.random() * c.velXRand),
            vy: b.h * (c.velY - Math.random() * c.velYRand),
            life: 0,
            maxLife: 4 + Math.random() * 3, // 4–7 seconds
            opacity: 0,
            maxOpacity: 0.2 + Math.random() * 0.15
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Spawning logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnParticle();
            this.spawnTimer = 0;
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life += deltaTime;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            // Movement
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Growth
            p.radius += (p.maxRadius - p.radius) * 0.5 * deltaTime;

            // Opacity curve (fade in, then fade out)
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio < 0.2) {
                p.opacity = p.maxOpacity * (lifeRatio / 0.2);
            } else {
                p.opacity = p.maxOpacity * (1 - ((lifeRatio - 0.2) / 0.8));
            }

            // Draw soft radial gradient puff
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            gradient.addColorStop(0, `rgba(230, 240, 255, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(230, 240, 255, 0)`);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            this.ctx.closePath();
        }

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Keep backward compatibility for 'steam-canvas' ID
    const defaultCanvas = document.getElementById('steam-canvas');
    if (defaultCanvas) {
        new SteamSystem(defaultCanvas);
    }
    
    // Also initialize any other canvas with the 'steam' class
    const steamCanvases = document.querySelectorAll('canvas.steam');
    steamCanvases.forEach(canvas => {
        if (canvas.id !== 'steam-canvas') {
            new SteamSystem(canvas);
        }
    });
});
