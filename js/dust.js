document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('dust-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    let imgBounds = { x: 0, y: 0, w: 0, h: 0 };

    // --- CONFIGURATION ---
    const particleCount = 150;
    
    // Spot light coordinates — override via data-spot-x / data-spot-y (fractional 0–1)
    const spotXPercent = canvas.dataset.spotX   ? parseFloat(canvas.dataset.spotX)   : 0.5;
    const spotYPercent = canvas.dataset.spotY   ? parseFloat(canvas.dataset.spotY)   : 0.5;
    
    // Spot colour — override via data-spot-color="r,g,b" (e.g. "255,140,0" for orange)
    const spotColorRGB = canvas.dataset.spotColor || '240,240,240'; // default light gray

    // The radius around the spot where dust motes glow brightly
    const enableGlow = canvas.dataset.enableGlow === "true";
    const glowRadius = enableGlow ? 300 : 0; 
    
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
    }

    window.addEventListener('resize', resize);
    resize();

    class DustMote {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = Math.random() * height; 
            
            // Make them slightly larger so they are easier to see
            this.size = Math.random() * 3.0 + 1.0;
            
            // Random movement in ANY direction, very slowly
            this.speedY = (Math.random() - 0.5) * 0.3; 
            this.speedX = (Math.random() - 0.5) * 0.3;
            
            this.driftAngle = Math.random() * Math.PI * 2;
            this.driftSpeed = Math.random() * 0.015 + 0.005; // Slower drift
        }

        update(timeScale = 1) {
            this.y += this.speedY * timeScale;
            
            // Sine wave drift
            this.driftAngle += this.driftSpeed * timeScale;
            this.x += (this.speedX + Math.sin(this.driftAngle) * 0.15) * timeScale;

            // Seamlessly wrap around screen instead of resetting
            if (this.y < -20) this.y = height + 20;
            if (this.y > height + 20) this.y = -20;
            if (this.x < -20) this.x = width + 20;
            if (this.x > width + 20) this.x = -20;
        }

        draw() {
            // Calculate distance from the spot center
            const spotX = imgBounds.x + (imgBounds.w * spotXPercent);
            const spotY = imgBounds.y + (imgBounds.h * spotYPercent);
            
            const dx = this.x - spotX;
            const dy = this.y - spotY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate opacity and color based on distance
            let opacity = 0.35;
            let isIlluminated = false;
            
            if (distance < glowRadius) {
                // Closer to spot = more opaque, up to 0.8
                const intensity = 1 - (distance / glowRadius);
                opacity = 0.35 + (intensity * 0.55);
                isIlluminated = true;
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            
            if (isIlluminated) {
                ctx.fillStyle = `rgba(${spotColorRGB}, ${opacity})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(${spotColorRGB}, ${opacity})`;
            } else {
                ctx.fillStyle = `rgba(240, 240, 240, ${opacity})`;
                // Add a dark drop shadow so the dust pops against lighter backgrounds
                ctx.shadowBlur = 3;
                ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 1.5})`; 
            }
            
            ctx.fill();
        }
    }

    function initParticles() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new DustMote());
        }
    }

    let lastTime = 0;

    function animate(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        const timeScale = Math.min(deltaTime / 16.666, 3);

        ctx.clearRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'source-over';

        for (let particle of particles) {
            particle.update(timeScale);
            particle.draw();
        }

        requestAnimationFrame(animate);
    }

    initParticles();
    requestAnimationFrame(animate);
});
