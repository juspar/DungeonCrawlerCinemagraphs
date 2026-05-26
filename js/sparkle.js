class SparkleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        
        // Spot colour — override via data-spot-color="r,g,b" (e.g. "255,100,200")
        // Default is glowing gold: 255,215,0
        this.spotColorRGB = this.canvas.dataset.spotColor || '255,215,0';
        const [sr, sg, sb] = this.spotColorRGB.split(',').map(Number);
        this.spotR = sr; this.spotG = sg; this.spotB = sb;

        // Emits from coordinates set via data attributes
        this.originX = 0;
        this.originY = 0;
        
        this.spawnTimer = 0;
        this.spawnRate = 0.05; // very fast spawn for a glowing halo

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
        
        const targetX = this.canvas.dataset.originX ? parseFloat(this.canvas.dataset.originX) : 0.695;
        const targetY = this.canvas.dataset.originY ? parseFloat(this.canvas.dataset.originY) : 0.10;
        
        this.originX = bounds.x + (bounds.w * targetX);
        this.originY = bounds.y + (bounds.h * targetY);
    }

    spawnParticle() {
        const angle = Math.random() * Math.PI * 2;
        // Increase speed for a larger halo spread
        const speed = (this.canvas.width * 0.01) + Math.random() * (this.canvas.width * 0.025);
        
        // Interpolate within the spot color hue range
        // For gold: R=255 fixed, G lerps 215→255, B lerps 0→200
        // For custom colors: use the base color with slight brightness variation
        const t = Math.random();
        let r, g, b;
        if (this.spotColorRGB === '255,215,0') {
            // Gold-specific behavior: warm shimmer
            r = 255;
            g = Math.floor(215 + t * 40);
            b = Math.floor(0   + t * 200);
        } else {
            // Generic: slight brightness jitter on the spot color
            const jitter = 0.8 + t * 0.4; // 80%–120% brightness
            r = Math.min(255, Math.floor(this.spotR * jitter));
            g = Math.min(255, Math.floor(this.spotG * jitter));
            b = Math.min(255, Math.floor(this.spotB * jitter));
        }
        
        const radius = Math.max(1, Math.random() * 3);

        this.particles.push({
            x: this.originX,
            y: this.originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            color: `rgb(${r}, ${g}, ${b})`,
            life: 0,
            maxLife: 1.0 + Math.random() * 1.5,
            opacity: 0,
            maxOpacity: 0.5 + Math.random() * 0.5
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Ambient sway base (so particles drift slightly)
        const driftY = -this.canvas.height * 0.02;

        this.spawnTimer += deltaTime;
        // Spawn multiple particles if deltaTime is large
        while (this.spawnTimer >= this.spawnRate) {
            this.spawnParticle();
            this.spawnTimer -= this.spawnRate;
        }

        // Draw an underglow at the origin
        const glowRadius = this.canvas.width * 0.12;
        const gradient = this.ctx.createRadialGradient(this.originX, this.originY, 0, this.originX, this.originY, glowRadius);
        gradient.addColorStop(0, `rgba(${this.spotColorRGB}, 0.4)`);
        gradient.addColorStop(1, `rgba(${this.spotColorRGB}, 0)`);
        this.ctx.beginPath();
        this.ctx.arc(this.originX, this.originY, glowRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.closePath();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life += deltaTime;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * deltaTime;
            p.y += (p.vy + driftY) * deltaTime;
            
            // Friction
            p.vx *= 0.95;
            p.vy *= 0.95;

            // Fade in and out
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio < 0.2) {
                p.opacity = p.maxOpacity * (lifeRatio / 0.2);
            } else {
                p.opacity = p.maxOpacity * (1 - ((lifeRatio - 0.2) / 0.8));
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${p.opacity})`);
            this.ctx.fill();
            this.ctx.closePath();
            
            // Add a slight glowing halo to the particle itself
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = p.color;
        }
        
        // Reset shadow for next frame
        this.ctx.shadowBlur = 0;

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SparkleSystem('sparkle-canvas');
});
