class SparkleSystem {
    constructor(canvasOrId) {
        if (typeof canvasOrId === 'string') {
            this.canvas = document.getElementById(canvasOrId);
        } else {
            this.canvas = canvasOrId;
        }
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        
        // Depth/Scale factor (defaults to 1.0, clamped to min 0.1 for safety)
        this.depth = Math.max(0.1, this.canvas.dataset.depth ? parseFloat(this.canvas.dataset.depth) : 1.0);
        
        // Bubble boundary radius — override via data-radius="0.36" (fraction of screen height)
        this.radiusNormalized = this.canvas.dataset.radius ? parseFloat(this.canvas.dataset.radius) : 0.0;
        this.bubbleRadius = 0;

        // Spot colour — override via data-spot-color="r,g,b" (e.g. "255,100,200")
        // Default is glowing gold: 255,215,0
        this.spotColorRGB = this.canvas.dataset.spotColor || '255,215,0';
        const [sr, sg, sb] = this.spotColorRGB.split(',').map(Number);
        this.spotR = sr; this.spotG = sg; this.spotB = sb;

        // Emits from coordinates set via data attributes
        this.originX = 0;
        this.originY = 0;
        
        this.spawnTimer = 0;
        
        // Scale spawn rate by depth (fewer particles spawned when further in the background)
        const baseSpawnRate = this.canvas.dataset.spawnRate ? parseFloat(this.canvas.dataset.spawnRate) : 0.05;
        this.spawnRate = baseSpawnRate / this.depth;

        // Visual width/height (CSS pixels)
        this.width = 0;
        this.height = 0;

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
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        
        this.width = w;
        this.height = h;
        
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        const bounds = this.getCoverBounds(w, h);
        
        const targetX = this.canvas.dataset.originX ? parseFloat(this.canvas.dataset.originX) : 0.695;
        const targetY = this.canvas.dataset.originY ? parseFloat(this.canvas.dataset.originY) : 0.10;
        
        this.originX = bounds.x + (bounds.w * targetX);
        this.originY = bounds.y + (bounds.h * targetY);
        
        // Calculate bubble radius in pixels relative to viewport height bounds
        this.bubbleRadius = bounds.h * this.radiusNormalized;
    }

    spawnParticle() {
        const angle = Math.random() * Math.PI * 2;
        
        // Spawn right at the bubble's rim (with a tiny, soft organic jitter)
        const spawnJitter = (Math.random() * 8 - 4) * this.depth;
        const spawnDist = this.bubbleRadius + spawnJitter;
        const startX = this.originX + Math.cos(angle) * spawnDist;
        const startY = this.originY + Math.sin(angle) * spawnDist;

        // Scale particle speed/velocity by depth
        let speed = (this.width * 0.008) + Math.random() * (this.width * 0.02);
        // Depth-based speed scaling is less aggressive so background particles stay dynamic
        speed *= (0.6 + 0.4 * this.depth);
        
        // Interpolate within the spot color hue range
        const t = Math.random();
        let r, g, b;
        if (this.spotColorRGB === '255,215,0') {
            r = 255;
            g = Math.floor(215 + t * 40);
            b = Math.floor(0   + t * 200);
        } else {
            const jitter = 0.8 + t * 0.4; // 80%–120% brightness
            r = Math.min(255, Math.floor(this.spotR * jitter));
            g = Math.min(255, Math.floor(this.spotG * jitter));
            b = Math.min(255, Math.floor(this.spotB * jitter));
        }
        
        // Scale particle radius by depth - keeping them crisp, punchy, and visible (1.6px to 3.8px base)
        const baseRadius = (Math.random() * 2.2 + 1.6);
        const radius = Math.max(1.2, baseRadius * (0.6 + 0.4 * this.depth));

        this.particles.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            color: `rgb(${r}, ${g}, ${b})`,
            life: 0,
            maxLife: 1.5 + Math.random() * 2.0,
            opacity: 0,
            // Keep particles bright and punchy
            maxOpacity: 0.85 + Math.random() * 0.15,
            // Sparkle frequencies for the shimmering effect
            twinkleSpeed: 18 + Math.random() * 22,
            phase: Math.random() * Math.PI * 2
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        const dt = Math.min(deltaTime, 0.1);

        // Clear the canvas taking High-DPI scaling into account
        const dpr = window.devicePixelRatio || 1;
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Ambient sway base (so particles drift slightly) scaled by depth
        const driftY = -this.height * 0.016 * this.depth;

        this.spawnTimer += dt;
        while (this.spawnTimer >= this.spawnRate) {
            this.spawnParticle();
            this.spawnTimer -= this.spawnRate;
        }

        // Draw a backlit glow behind the bubble
        const glowOffset = this.width * 0.08 * this.depth;
        const glowRadius = this.bubbleRadius + glowOffset;
        
        if (glowRadius > this.bubbleRadius) {
            const gradient = this.ctx.createRadialGradient(
                this.originX, this.originY, this.bubbleRadius, 
                this.originX, this.originY, glowRadius
            );
            gradient.addColorStop(0, `rgba(${this.spotColorRGB}, ${0.18 * this.depth})`);
            gradient.addColorStop(1, `rgba(${this.spotColorRGB}, 0)`);
            
            this.ctx.beginPath();
            // Outer circle (clockwise)
            this.ctx.arc(this.originX, this.originY, glowRadius, 0, Math.PI * 2, false);
            if (this.bubbleRadius > 0) {
                // Inner circle (counter-clockwise) - punches a hole to keep bubble center transparent
                this.ctx.moveTo(this.originX + this.bubbleRadius, this.originY);
                this.ctx.arc(this.originX, this.originY, this.bubbleRadius, 0, Math.PI * 2, true);
            }
            this.ctx.closePath();
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        // Turn off shadows for particles to render as 100% crisp anti-aliased points
        this.ctx.shadowBlur = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life += dt;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += (p.vy + driftY) * dt;
            
            // Lowered friction (0.99 instead of 0.982) allows embers to scatter much further and more organically
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Fade in and out
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio < 0.2) {
                p.opacity = p.maxOpacity * (lifeRatio / 0.2);
            } else {
                p.opacity = p.maxOpacity * (1 - ((lifeRatio - 0.2) / 0.8));
            }

            // Rapid brightness oscillation for shimmering/sparkling
            const twinkleSine = Math.sin((currentTime / 1000) * p.twinkleSpeed + p.phase);
            const twinkleFactor = 0.4 + ((twinkleSine + 1) / 2) * 0.6;
            const drawOpacity = p.opacity * twinkleFactor;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${drawOpacity})`);
            this.ctx.fill();
            this.ctx.closePath();
        }
        
        requestAnimationFrame(this.animate);
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Backwards compatibility for exact id 'sparkle-canvas' if not already handled
    const oldCanvas = document.getElementById('sparkle-canvas');
    if (oldCanvas && !oldCanvas.dataset.systemInitialized) {
        oldCanvas.dataset.systemInitialized = 'true';
        new SparkleSystem(oldCanvas);
    }
    
    // 2. Class-based multi-canvas initialization
    const canvases = document.querySelectorAll('canvas.sparkle, canvas.sparkle-layer');
    canvases.forEach(c => {
        if (!c.dataset.systemInitialized) {
            c.dataset.systemInitialized = 'true';
            new SparkleSystem(c);
        }
    });
});
