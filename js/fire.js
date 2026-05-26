document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fire-canvas');
    if (!canvas) return; // Only run if canvas exists on page
    const ctx = canvas.getContext('2d');

    let width, height;
    let scaleFactor = 1;
    let particles = [];
    let imgBounds = { x: 0, y: 0, w: 0, h: 0 };

    // --- CONFIGURATION ---
    const particleCount = 100;
    // Position of the fire (0.5 is horizontal center, 0.75 is bottom quarter)
    // You can tweak these percentages to align perfectly with the fireplace in the image.
    const fireXPercent = parseFloat(canvas.dataset.fireX) || 0.5; 
    const fireYPercent = parseFloat(canvas.dataset.fireY) || 0.55; 

    const sizeOverride = parseFloat(canvas.dataset.sizeMultiplier) || 1.0;
    const baseHue = parseFloat(canvas.dataset.fireHue) || 180;
    
    function getCoverBounds(w, h) {
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

    function resize() {
        width = canvas.clientWidth || window.innerWidth;
        height = canvas.clientHeight || window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        imgBounds = getCoverBounds(width, height);
        
        // Scale proportionally relative to a 1080p target height
        scaleFactor = height / 1080;
    }

    window.addEventListener('resize', resize);
    resize();

    class FireParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            // Spawn at the fire origin (Doubled width for a larger fire)
            this.x = imgBounds.x + (imgBounds.w * fireXPercent) + (Math.random() * 80 * scaleFactor - 40 * scaleFactor); 
            this.y = imgBounds.y + (imgBounds.h * fireYPercent) + (initial ? Math.random() * -80 * scaleFactor : 0);
            
            // Doubled particle size, adjusted by multiplier and screen scale
            this.size = (Math.random() * 30 + 20) * sizeOverride * scaleFactor;
            
            // Slowed down vertical speed for a lazier, slower fire
            this.speedY = (Math.random() * -1.2 - 0.5) * scaleFactor; 
            this.speedX = (Math.random() * 1.5 - 0.75) * scaleFactor; // Slight horizontal drift
            
            this.life = 1.0; // Opacity/Life multiplier
            // Slower decay so particles live longer
            this.decay = Math.random() * 0.01 + 0.008; 
            
            // Base fire colors
            this.hue = baseHue + Math.random() * 20;
        }

        update(timeScale = 1) {
            this.y += this.speedY * timeScale;
            this.x += this.speedX * timeScale;
            this.life -= this.decay * timeScale;
            // Shrink slower to match the longer life
            this.size -= (0.05 * scaleFactor) * timeScale; 

            if (this.life <= 0 || this.size <= 0) {
                this.reset();
            }
        }

        draw() {
            if (this.life <= 0 || this.size <= 0) return;
            
            // Draw a glowing circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            
            // Create radial gradient for realistic fire glow
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${this.life})`); // White/Cyan core
            gradient.addColorStop(0.4, `hsla(${this.hue}, 100%, 50%, ${this.life * 0.8})`); // Bright cyan
            gradient.addColorStop(1, `hsla(${this.hue}, 100%, 30%, 0)`); // Fade edge
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new FireParticle());
        }
    }

    let lastTime = 0;

    function animate(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        const timeScale = Math.min(deltaTime / 16.666, 3);

        ctx.clearRect(0, 0, width, height);
        
        // Add additive blending for fire to make overlapping flames brighter
        ctx.globalCompositeOperation = 'screen';

        for (let particle of particles) {
            particle.update(timeScale);
            particle.draw();
        }

        requestAnimationFrame(animate);
    }

    initParticles();
    requestAnimationFrame(animate);
});
