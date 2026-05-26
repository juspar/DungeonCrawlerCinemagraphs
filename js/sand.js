class SandSystem {
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
        // data-origin-y-min  Fractional Y of the top of the spawn band   (default 0.0)
        // data-origin-y-max  Fractional Y of the bottom of the spawn band (default 1.0)
        // data-vel-x         Base horizontal velocity as a fraction of canvas width per second.
        //                    Negative = left, positive = right.          (default -0.5)
        // data-vel-x-rand    Additional random range added to vel-x.     (default  0.2)
        // data-vel-y         Base vertical velocity as a fraction of canvas height per second.
        //                    Negative = up, positive = down.             (default 0.0)
        // data-vel-y-rand    Additional random range added to vel-y.     (default  0.1)
        // data-spawn-rate    Seconds between particle spawns             (default  0.02)
        // data-color         RGB string for sand color                   (default "210, 180, 140")
        const d = this.canvas.dataset;
        this.cfg = {
            originX:    d.originX    !== undefined ? parseFloat(d.originX)    : 1.0,
            originYMin: d.originYMin !== undefined ? parseFloat(d.originYMin) : 0.0,
            originYMax: d.originYMax !== undefined ? parseFloat(d.originYMax) : 1.0,
            velX:       d.velX       !== undefined ? parseFloat(d.velX)       : -0.5,
            velXRand:   d.velXRand   !== undefined ? parseFloat(d.velXRand)   :  0.2,
            velY:       d.velY       !== undefined ? parseFloat(d.velY)       :  0.0,
            velYRand:   d.velYRand   !== undefined ? parseFloat(d.velYRand)   :  0.1,
            spawnRate:  d.spawnRate  !== undefined ? parseFloat(d.spawnRate)  : 0.02,
            color:      d.color      !== undefined ? d.color                  : "210, 180, 140",
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
        // Add a small pixel nudge (20px) so particles appear just beyond the edge.
        const edgeNudge = c.originX >= 1 ? 20 : c.originX <= 0 ? -20 : 0;
        const x = b.x + (b.w * c.originX) + edgeNudge;

        // Spawn Y: random point within the configured band
        const yMin = b.y + (b.h * c.originYMin);
        const yMax = b.y + (b.h * c.originYMax);
        const y = yMin + Math.random() * (yMax - yMin);

        // Calculate expected lifetime to cross the screen plus some margin
        const speed = Math.abs(c.velX) + (c.velXRand / 2); // approximate average speed
        const expectedLife = speed > 0 ? (1.5 / speed) : 5; // time to cross 1.5x screen width
        
        this.particles.push({
            x: x,
            y: y,
            radius: 1.0 + Math.random() * 2.0, // 1 to 3 pixels
            vx: b.w * (c.velX - (Math.random() * c.velXRand - c.velXRand/2)),
            vy: b.h * (c.velY - (Math.random() * c.velYRand - c.velYRand/2)),
            driftAngle: Math.random() * Math.PI * 2,
            driftSpeed: 2 + Math.random() * 4,
            life: 0,
            maxLife: expectedLife * (0.8 + Math.random() * 0.4), // randomize life slightly
            maxOpacity: 0.5 + Math.random() * 0.5,
            opacity: 0
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Spawning logic - can spawn multiple per frame if spawnRate is very low
        this.spawnTimer += deltaTime;
        while (this.spawnTimer >= this.spawnRate) {
            this.spawnParticle();
            this.spawnTimer -= this.spawnRate;
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life += deltaTime;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            // Sine wave drift for billowing effect
            p.driftAngle += p.driftSpeed * deltaTime;
            const driftY = Math.sin(p.driftAngle) * (this.imgBounds.h * 0.02) * deltaTime; // small vertical drift

            // Movement
            p.x += p.vx * deltaTime;
            p.y += (p.vy * deltaTime) + driftY;

            // Opacity curve (fade in quickly, hold, fade out slowly)
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio < 0.1) {
                p.opacity = p.maxOpacity * (lifeRatio / 0.1);
            } else if (lifeRatio > 0.7) {
                p.opacity = p.maxOpacity * (1 - ((lifeRatio - 0.7) / 0.3));
            } else {
                p.opacity = p.maxOpacity;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            
            // Solid color with opacity
            this.ctx.fillStyle = `rgba(${this.cfg.color}, ${p.opacity})`;
            
            // Add a subtle shadow for depth so it looks like dirt/sand
            this.ctx.shadowBlur = 2;
            this.ctx.shadowColor = `rgba(0, 0, 0, ${p.opacity * 0.8})`; 
            
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // reset for next drawing if needed
            this.ctx.closePath();
        }

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sandCanvases = document.querySelectorAll('canvas.sand');
    sandCanvases.forEach(canvas => {
        new SandSystem(canvas);
    });
});
