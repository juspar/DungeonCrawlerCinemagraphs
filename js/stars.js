document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- CONFIGURATION ---
    // Override star count via data-star-count attribute on the canvas element.
    const starCount = canvas.dataset.starCount ? parseInt(canvas.dataset.starCount, 10) : 120;

    let width, height;
    let stars = [];
    let elapsed = 0; // total elapsed seconds, drives sine oscillation

    function resize() {
        width  = canvas.clientWidth || window.innerWidth;
        height = canvas.clientHeight || window.innerHeight;
        canvas.width  = width;
        canvas.height = height;
        // Re-scatter stars on resize so they fill the new viewport
        stars = [];
        initStars();
    }

    window.addEventListener('resize', resize);

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            // Fixed position — stars don't move, they only twinkle
            this.x    = Math.random() * width;
            this.y    = Math.random() * height;
            this.size = Math.random() * 1.5 + 1.5; // 1.5-3px

            // Twinkle oscillation parameters
            this.period      = 2 + Math.random() * 4;   // 2–6s per cycle
            this.phaseOffset = Math.random() * Math.PI * 2; // random start position in cycle
            this.baseOpacity = 0.3 + Math.random() * 0.4;  // individual brightness floor
            this.peakOpacity = this.baseOpacity + 0.3 + Math.random() * 0.3; // peak brightness
        }

        draw(t) {
            // Sine oscillates −1 to +1; remap to baseOpacity–peakOpacity
            const sine    = Math.sin((t / this.period) * Math.PI * 2 + this.phaseOffset);
            const opacity = this.baseOpacity + ((sine + 1) / 2) * (this.peakOpacity - this.baseOpacity);

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 235, 255, ${opacity})`;
            // Subtle soft glow
            ctx.shadowBlur  = 4;
            ctx.shadowColor = `rgba(200, 220, 255, ${opacity * 0.6})`;
            ctx.fill();
        }
    }

    function initStars() {
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    let lastTime = 0;

    function animate(currentTime) {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Cap delta to avoid a huge jump after tab comes back into focus
        const dt = Math.min(deltaTime / 1000, 0.1); // seconds
        elapsed += dt;

        ctx.clearRect(0, 0, width, height);

        for (const star of stars) {
            star.draw(elapsed);
        }

        // Reset shadow so other canvases aren't affected if they share a context
        ctx.shadowBlur = 0;

        requestAnimationFrame(animate);
    }

    resize(); // sets canvas size and calls initStars()
    requestAnimationFrame(animate);
});
