class BallpitSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.lastTime = performance.now();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initBalls();
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
        this.imgBounds = this.getCoverBounds(w, h);
    }

    initBalls() {
        this.balls = [];
        for (let i = 0; i < 350; i++) {
            // Random x between 0 and 0.35 of width
            const x = this.imgBounds.x + Math.random() * (this.imgBounds.w * 0.35);
            // Random y between 0.52 and 0.66 of height (floor at 66%)
            const baseY = this.imgBounds.y + this.imgBounds.h * 0.52 + Math.random() * (this.imgBounds.h * 0.14);
            
            // Radius responsive to screen width, all the same size (close to previous max)
            const radius = Math.max(12, this.imgBounds.w * 0.008);
            
            // Color from scene using HSL
            const h = 230;
            const s = Math.floor(15 + Math.random() * (80 - 5));
            const l = Math.floor(30 + Math.random() * (95 - 50));
            const color = `hsl(${h}, ${s}%, ${l}%)`;

            this.balls.push({
                x: x,
                y: baseY,
                baseY: baseY,
                radius: radius,
                color: color,
                vy: 0,
                vx: 0,
                bounciness: 0.4 + Math.random() * 0.3
            });
        }
    }

    animate(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Gravity scale (pixels per second squared)
        const gravity = this.imgBounds.h * 1.5; 

        // Randomly make some balls pop up
        // Adjust the chance so we get a few pops every few seconds
        if (Math.random() < 1.0 * deltaTime) { // roughly 1 pop per second
            // Pick a cluster to pop (simulating a cat swiping)
            const popCenterX = this.imgBounds.x + Math.random() * (this.imgBounds.w * 0.35);
            const popRadius = this.imgBounds.w * 0.05;
            
            this.balls.forEach(ball => {
                if (ball.y === ball.baseY) { // Only sitting balls
                    const dx = ball.x - popCenterX;
                    if (Math.abs(dx) < popRadius) {
                        if (Math.random() < 0.6) {
                            // Shoot up!
                            ball.vy = -this.imgBounds.h * (0.3 + Math.random() * 0.4);
                            ball.vx = (Math.random() - 0.5) * this.imgBounds.w * 0.1;
                        }
                    }
                }
            });
        }

        // Update and draw balls
        this.balls.forEach(ball => {
            // Physics
            if (ball.y < ball.baseY || ball.vy !== 0) {
                ball.vy += gravity * deltaTime;
                ball.y += ball.vy * deltaTime;
                ball.x += ball.vx * deltaTime;

                // Bounce off floor
                if (ball.y >= ball.baseY) {
                    ball.y = ball.baseY;
                    ball.vy *= -ball.bounciness;
                    ball.vx *= 0.5; // Friction

                    if (Math.abs(ball.vy) < this.canvas.height * 0.05) {
                        ball.vy = 0;
                        ball.vx = 0;
                    }
                }
                
                // Keep inside left boundary
                if (ball.x < this.imgBounds.x + ball.radius) {
                    ball.x = this.imgBounds.x + ball.radius;
                    ball.vx *= -0.8;
                }
                // Soft boundary on right (approx 0.35 width)
                if (ball.x > this.imgBounds.x + this.imgBounds.w * 0.38) {
                    ball.x = this.imgBounds.x + this.imgBounds.w * 0.38;
                    ball.vx *= -0.8;
                }
            }

            // Draw
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ball.color;
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#000000';
            this.ctx.stroke();
            this.ctx.closePath();
        });

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BallpitSystem('balls-canvas');
});
