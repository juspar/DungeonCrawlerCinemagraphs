document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('snow-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    // Configuration
    const particleCount = 150; // Adjust for heavier/lighter snow
    const baseSpeed = 1;
    const speedVariation = 2;
    const baseSize = 1;
    const sizeVariation = 3;
    const driftAmount = 0.5;

    function resize() {
        // Because canvas is scaled 1.1x in CSS to match the parallax, 
        // we render it at clientWidth/clientHeight, and the CSS stretches it slightly.
        width = canvas.clientWidth || window.innerWidth;
        height = canvas.clientHeight || window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
            // Randomize starting Y so they don't all start at the top at once
            this.y = Math.random() * height; 
        }

        reset() {
            this.x = Math.random() * width;
            this.y = -10; // Start slightly above the screen
            this.size = baseSize + Math.random() * sizeVariation;
            this.speedY = baseSpeed + Math.random() * speedVariation;
            this.speedX = (Math.random() - 0.5) * driftAmount;
            this.opacity = 0.3 + Math.random() * 0.5; // Random transparency
            
            // For a sine wave drift pattern
            this.driftAngle = Math.random() * Math.PI * 2;
            this.driftSpeed = 0.01 + Math.random() * 0.02;
        }

        update(timeScale = 1) {
            this.y += this.speedY * timeScale;
            
            // Add a sine wave drift to the basic horizontal speed
            this.driftAngle += this.driftSpeed * timeScale;
            this.x += (this.speedX + Math.sin(this.driftAngle) * 0.5) * timeScale;

            // Reset if off-screen (bottom or too far sideways)
            if (this.y > height + 10 || this.x < -20 || this.x > width + 20) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    let lastTime = 0;

    function animate(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // 60 FPS is approx 16.6ms per frame. timeScale will be 1 at 60FPS.
        // If it runs at 30FPS, deltaTime is ~33.3ms, so timeScale is 2.
        // Cap timeScale at 3 (20 FPS) to prevent extreme jumps if tab is backgrounded
        const timeScale = Math.min(deltaTime / 16.666, 3);

        ctx.clearRect(0, 0, width, height);

        for (let particle of particles) {
            particle.update(timeScale);
            particle.draw();
        }

        requestAnimationFrame(animate);
    }

    initParticles();
    requestAnimationFrame(animate);
});
