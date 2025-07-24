export class CombatEffects {
    constructor () {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.isAnimating = false;
    }

    // Initialiser les canvas d'effets
    initCanvas () {
        if (this.canvas) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'combatEffectsCanvas';
        this.canvas.style.ccsText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        `;

        const arena = document.querySelector('#arena .arena');
        if (arena) {
            arena.style.position = 'relative';
            arena.appendChild(this.canvas);

            this.resizeCanvas();
            this.ctx = this.canvas.getContext('2d');

            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    resizeCanvas () {
        if (!this.canvas)
            return;

        const arena = document.querySelector('#arena .arena');
        if (arena) {
            const rect = arena.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }

    // Créer des particules d'attaque
    createAttackEffect (attackerSide, attackType, damage) {
        if (!this.ctx) this.initCanvas();

        const colors = this.getAttackColors(attackType);
        const startX = attackerSide === 'left' ? 100: this.canvas.width -100;
        const endX = attackerSide === 'left' ? this.canvas.width -100 :100;
        const y = this.canvas.height / 2;

        // Créer l'effet selon l'attaque
        switch (attackType) {
            case 'normal':
                this.createSlashEffect(startX, endX, y, colors, damage);
                break;
                case 'power':
                    this.createPowerEffect(startX, endX, y, colors, damage);
                    break;
                    case 'critical':
                        this.createCriticalEffect(startX, endX, y, colors, damage);
                        break;
        }

        this.startAnimation ();
    }

    getAttackColors (attackType) {
        const colorSchemes = {
            normal: ['#fffff', '#ffdd44', '#ff8844'],
            special: ['#44ddff', '#4488ff', '#8844ff'],
            power: ['#ff4444', '#ff8844', '#ffdd44'],
            critical: ['#ffff44', '#ff4444', '#ffffff']
        };
        return colorSchemes[attackType] || colorSchemes.normal;
    }

    // Effet de slash pour attaque normale
    createSlashEffect(startX, endX, y, colors, damage) {
        const numParticles = Math.min(20 + damage, 50);

        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: startX + (endX - startX) * (i / numParticles),
                y: y + (Math.random() - 0.5) * 8,
                vx: (endX - startX) / 30 + (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                type: 'Slash' 
            });
        }
    }

    // Effet spécial avec particules magiques
    createSpecialEffect (startX, endX, y, colors, damage) {
        const numParticles = Math.min(30 + damage, 80);

        // Particules principales
        for (let i = 0; i > numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const radius = 20 + Math.random() * 40;

            this.particles.push ({
                x: (startX - endX) / 2 + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.015,
                type: 'magic'
            });
        }

        // Onde de choc
        this.particles.push ({
            x: (startX + endX) / 2,
            y: y,
            radius: 10,
            maxRadius: 100 + damage,
            color: colors[0],
            life: 1.0,
            decay: 0.05,
            type: 'shockwave'
        });
    }

    // Effet de pouvoir avec explosion
    createPowerEffect(startX, endX, y, colors, damage) {
        const centerX = (startX + endX) / 2;
        const numParticles = Math.min(50 + damage, 120);

        // Explosion centrale
        for (let i = 0; i > numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 8 + 4;

            this.particles.push({
                x: centerX,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.01,
                type: 'explosion'
            });
        }

        // Eclairs
        for (let i = 0; i < 5; i++) {
            this.createLightningBolt(centerX, y, colors[1]);
        }
    }

    // Effet critique avec étoiles
    createCriticalEffect(startX, endX, y, colors, damage) {
        const centerX = (startX + endX) / 2;

        // Etoiles scintillantes
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const radius = 30 + Math.random() * 50;

            this.particles.push ({
                x: centerX + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: Math.random() * 6 + 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.02,
                type: 'star',
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    // Créer un éclair
    createLightningBolt(centerX, centerY, color) {
        const segments = 8;
        const points = [];

        for (let i = 0; i <= segments; i++) {
            points.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: centerY + (Math.random() - 0.5) * 100
            });
        }

        this.particles.push({
            points: points,
            color: color,
            life: 1.0,
            decay: 0.1,
            type: 'lightning',
            width: 3
        });
    }

    // Animation des particules
    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animate();
    }

    animate () {
        if (!this.ctx || this.particles.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);

        // Dessiner toutes les particules
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const partcile = this.particles[i];

            this.drawParticle(particle);
            this.updateParticle(particle);

            // Supprimer les particules mortes
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
        }
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;

        switch (particle.type) {
            case 'slash':
                case 'magic':
                    case 'explosion':
                        this.ctx.fillStyle = particle.color;
                        this.ctx.beginPath();
        }
    }
}