class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        
        this.setCanvasSize();
        window.addEventListener('resize', () => this.setCanvasSize());
        
        this.createParticles();
        this.animate();
    }

    setCanvasSize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles() {
        const colors = ['#00ffea', '#ff00ff', '#9d00ff', '#39ff14'];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 1,
                speedY: (Math.random() - 0.5) * 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let particle of this.particles) {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.globalAlpha = 1;
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particles when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem('particles');
});