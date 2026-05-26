class DiscoSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.lastTime = performance.now();
        
        this.originX = 0;
        this.originY = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Generate light spots
        for(let i=0; i<40; i++) {
            this.spawnLight();
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
        this.canvas.width = w;
        this.canvas.height = h;
        const b = this.getCoverBounds(w, h);
        this.imgBounds = b;
        
        // Assume disco ball is near top center
        this.originX = b.x + b.w * 0.5;
        this.originY = b.y + b.h * 0.2; 
    }

    spawnLight() {
        const angle = Math.random() * Math.PI * 2;
        // Vary the orbit distance to simulate hits on walls and floor
        const radius = this.imgBounds.w * (0.1 + Math.random() * 0.8); 
        // Angular speed
        const speed = (0.2 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1); 
        
        // Shades of purple: high red, low green, high blue
        const r = Math.floor(150 + Math.random() * 80);
        const g = Math.floor(30 + Math.random() * 60);
        const b = 255;
        
        this.particles.push({
            angle: angle,
            radiusX: radius,
            radiusY: radius * 0.6, // Flatten orbit for 3D perspective
            speed: speed,
            size: 8 + Math.random() * 35, // Size of the light spot
            baseOpacity: 0.1 + Math.random() * 0.4,
            phase: Math.random() * Math.PI * 2, // For pulsing opacity
            colorStr: `${r}, ${g}, ${b}`
        });
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            p.angle += p.speed * deltaTime;
            p.phase += deltaTime * 1.5;
            
            // Calculate screen position
            const x = this.originX + Math.cos(p.angle) * p.radiusX;
            const y = this.originY + Math.sin(p.angle) * p.radiusY;
            
            // Pulse opacity to simulate moving over textured surfaces
            const currentOpacity = p.baseOpacity * (0.3 + 0.7 * Math.sin(p.phase));
            
            if (currentOpacity > 0) {
                this.ctx.beginPath();
                // Draw an elongated ellipse to simulate a light spot cast on a surface
                this.ctx.ellipse(x, y, p.size, p.size * 0.4, p.angle, 0, Math.PI * 2);
                
                // Add a bright core and soft glow using the particle's purple color
                this.ctx.fillStyle = `rgba(${p.colorStr}, ${currentOpacity})`;
                this.ctx.fill();
                
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = `rgba(${p.colorStr}, ${currentOpacity * 1.5})`;
                this.ctx.fill();
            }
        }
        
        this.ctx.shadowBlur = 0;

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DiscoSystem('disco-canvas');
});
