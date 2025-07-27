// Système d'effets visuels pour le combat - Heroes Arena

export class CombatEffects {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.isAnimating = false;
    }
    
    // Initialiser le canvas d'effets
    initCanvas() {
        if (this.canvas) return;
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'combatEffectsCanvas';
        this.canvas.style.cssText = `
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
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const arena = document.querySelector('#arena .arena');
        if (arena) {
            const rect = arena.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }
    
    // Créer des particules d'attaque
    createAttackEffect(attackerSide, attackType, damage) {
        if (!this.ctx) this.initCanvas();
        
        const colors = this.getAttackColors(attackType);
        const startX = attackerSide === 'left' ? 100 : this.canvas.width - 100;
        const endX = attackerSide === 'left' ? this.canvas.width - 100 : 100;
        const y = this.canvas.height / 2;
        
        // Créer l'effet selon le type d'attaque
        switch (attackType) {
            case 'normal':
                this.createSlashEffect(startX, endX, y, colors, damage);
                break;
            case 'special':
                this.createSpecialEffect(startX, endX, y, colors, damage);
                break;
            case 'power':
                this.createPowerEffect(startX, endX, y, colors, damage);
                break;
            case 'critical':
                this.createCriticalEffect(startX, endX, y, colors, damage);
                break;
            // Nouveaux effets spécifiques aux classes
            case 'rage_berserker':
                this.createRageBerserkerEffect(startX, endX, y, damage);
                break;
            case 'bouclier_magique':
                this.createMagicShieldEffect(startX, endX, y);
                break;
            case 'tir_multiple':
                this.createMultiShotEffect(startX, endX, y, damage);
                break;
            case 'aura_guerison':
                this.createHealingAuraEffect(startX, endX, y);
                break;
            case 'frappe_mortelle':
                this.createShadowStrikeEffect(startX, endX, y, damage);
                break;
            case 'symbiose_naturelle':
                this.createNatureSymbiosisEffect(startX, endX, y);
                break;
        }
        
        this.startAnimation();
    }
    
    // Méthode utilitaire pour déclencher un effet de capacité spéciale selon la classe
    createClassSpecialEffect(attackerSide, heroClass, damage = 0) {
        if (!this.ctx) this.initCanvas();
        
        const startX = attackerSide === 'left' ? 100 : this.canvas.width - 100;
        const endX = attackerSide === 'left' ? this.canvas.width - 100 : 100;
        const y = this.canvas.height / 2;
        
        switch (heroClass) {
            case 'Guerrier':
                this.createRageBerserkerEffect(startX, endX, y, damage);
                break;
            case 'Mage':
                this.createMagicShieldEffect(startX, endX, y);
                break;
            case 'Archer':
                this.createMultiShotEffect(startX, endX, y, damage);
                break;
            case 'Paladin':
                this.createHealingAuraEffect(startX, endX, y);
                break;
            case 'Assassin':
                this.createShadowStrikeEffect(startX, endX, y, damage);
                break;
            case 'Druide':
                this.createNatureSymbiosisEffect(startX, endX, y);
                break;
        }
        
        this.startAnimation();
    }
    
    getAttackColors(attackType) {
        const colorSchemes = {
            normal: ['#ffffff', '#ffdd44', '#ff8844'],
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
                y: y + (Math.random() - 0.5) * 60,
                vx: (endX - startX) / 30 + (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                type: 'slash'
            });
        }
    }
    
    // Effet spécial avec particules magiques
    createSpecialEffect(startX, endX, y, colors, damage) {
        const numParticles = Math.min(30 + damage, 80);
        
        // Particules principales
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const radius = 20 + Math.random() * 40;
            
            this.particles.push({
                x: (startX + endX) / 2 + Math.cos(angle) * radius,
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
        this.particles.push({
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
        for (let i = 0; i < numParticles; i++) {
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
        
        // Éclairs
        for (let i = 0; i < 5; i++) {
            this.createLightningBolt(centerX, y, colors[1]);
        }
    }
    
    // Effet critique avec étoiles
    createCriticalEffect(startX, endX, y, colors, damage) {
        const centerX = (startX + endX) / 2;
        
        // Étoiles scintillantes
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const radius = 30 + Math.random() * 50;
            
            this.particles.push({
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
    
    // ========== EFFETS SPÉCIFIQUES AUX CLASSES ==========
    
    // Guerrier - Rage Berserker (effet de flammes rouges intenses)
    createRageBerserkerEffect(startX, endX, y, damage) {
        const centerX = (startX + endX) / 2;
        const numParticles = Math.min(80 + damage, 150);
        const colors = ['#ff0000', '#ff4444', '#ff8800', '#ffaa00'];
        
        // Explosion de rage au centre
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 12 + 6;
            
            this.particles.push({
                x: centerX,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.015,
                type: 'rage_flame'
            });
        }
        
        // Vagues de choc concentriques
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: centerX,
                    y: y,
                    radius: 15,
                    maxRadius: 120 + i * 30,
                    color: '#ff4444',
                    life: 1.0,
                    decay: 0.03,
                    type: 'rage_wave'
                });
            }, i * 200);
        }
    }
    
    // Mage - Bouclier Magique (effet de protection bleue)
    createMagicShieldEffect(startX, endX, y) {
        const centerX = (startX + endX) / 2;
        const colors = ['#00aaff', '#0088dd', '#4400ff', '#8800ff'];
        
        // Cercle de protection magique
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 * i) / 60;
            const radius = 60 + Math.sin(Date.now() * 0.01 + i) * 10;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5,
                size: Math.random() * 5 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.012,
                type: 'magic_shield',
                angle: angle,
                baseRadius: radius
            });
        }
        
        // Runessternes magiques
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 80;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                size: 8,
                color: '#00ddff',
                life: 1.0,
                decay: 0.02,
                type: 'magic_rune',
                rotation: 0,
                rotationSpeed: 0.15
            });
        }
    }
    
    // Archer - Tir Multiple (effet de flèches multiples)
    createMultiShotEffect(startX, endX, y, damage) {
        const colors = ['#00ff00', '#44ff44', '#88ff88', '#aaff00'];
        const arrowCount = 3;
        
        // Création de plusieurs flèches
        for (let arrow = 0; arrow < arrowCount; arrow++) {
            const offsetY = (arrow - 1) * 20;
            const speed = 8 + arrow * 2;
            
            // Traînée de chaque flèche
            for (let i = 0; i < 15; i++) {
                const progress = i / 15;
                const x = startX + (endX - startX) * progress;
                const currentY = y + offsetY;
                
                this.particles.push({
                    x: x - i * 5,
                    y: currentY + (Math.random() - 0.5) * 4,
                    vx: (endX - startX) / 20,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0,
                    decay: 0.025 + Math.random() * 0.02,
                    type: 'arrow_trail'
                });
            }
            
            // Pointe de flèche
            this.particles.push({
                x: startX,
                y: y + offsetY,
                vx: (endX - startX) / 15,
                vy: 0,
                size: 6,
                color: '#ffff00',
                life: 1.0,
                decay: 0.03,
                type: 'arrow_head'
            });
        }
    }
    
    // Paladin - Aura de Guérison (effet de lumière dorée)
    createHealingAuraEffect(startX, endX, y) {
        const centerX = (startX + endX) / 2;
        const colors = ['#ffdd00', '#ffee44', '#fff888', '#ffffff'];
        
        // Aura de lumière dorée
        for (let ring = 0; ring < 4; ring++) {
            const baseRadius = 30 + ring * 20;
            const particlesInRing = 20 + ring * 5;
            
            for (let i = 0; i < particlesInRing; i++) {
                const angle = (Math.PI * 2 * i) / particlesInRing + ring * 0.5;
                const radius = baseRadius + Math.sin(Date.now() * 0.005 + i) * 8;
                
                this.particles.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                    vx: 0,
                    vy: -1,
                    size: Math.random() * 4 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0,
                    decay: 0.008,
                    type: 'healing_light'
                });
            }
        }
        
        // Particules de guérison montantes
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: y + 40,
                vx: (Math.random() - 0.5) * 2,
                vy: -3 - Math.random() * 2,
                size: Math.random() * 6 + 3,
                color: '#ffffff',
                life: 1.0,
                decay: 0.015,
                type: 'heal_sparkle'
            });
        }
    }
    
    // Assassin - Frappe Mortelle (effet d'ombres violettes)
    createShadowStrikeEffect(startX, endX, y, damage) {
        const centerX = (startX + endX) / 2;
        const colors = ['#440088', '#660099', '#8800bb', '#aa00dd'];
        
        // Explosion d'ombre
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 10 + 5;
            
            this.particles.push({
                x: centerX,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.02,
                type: 'shadow_particle'
            });
        }
        
        // Lames d'ombre qui traversent
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 80;
            
            this.particles.push({
                x: centerX,
                y: y,
                endX: centerX + Math.cos(angle) * length,
                endY: y + Math.sin(angle) * length,
                color: '#aa00dd',
                life: 1.0,
                decay: 0.08,
                type: 'shadow_blade',
                width: 4
            });
        }
        
        // Effet de critique avec étoiles sombres
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const radius = 40 + Math.random() * 30;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 8 + 6,
                color: '#ff44ff',
                life: 1.0,
                decay: 0.025,
                type: 'shadow_star',
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.4
            });
        }
    }
    
    // Druide - Symbiose Naturelle (effet de nature verte)
    createNatureSymbiosisEffect(startX, endX, y) {
        const centerX = (startX + endX) / 2;
        const colors = ['#00aa00', '#44bb44', '#66cc66', '#88dd88'];
        
        // Cercle de vie naturelle
        for (let ring = 0; ring < 3; ring++) {
            const baseRadius = 40 + ring * 25;
            const particlesInRing = 24 + ring * 8;
            
            for (let i = 0; i < particlesInRing; i++) {
                const angle = (Math.PI * 2 * i) / particlesInRing + ring * 0.3;
                const radius = baseRadius + Math.sin(Date.now() * 0.003 + i) * 12;
                
                this.particles.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    size: Math.random() * 5 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0,
                    decay: 0.01,
                    type: 'nature_energy'
                });
            }
        }
        
        // Feuilles tourbillonnantes
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 20;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 3,
                vy: -2 - Math.random() * 2,
                size: Math.random() * 6 + 4,
                color: '#44dd44',
                life: 1.0,
                decay: 0.012,
                type: 'leaf',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // Racines énergétiques
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const points = [];
            let currentX = centerX;
            let currentY = y;
            
            for (let j = 0; j < 6; j++) {
                currentX += Math.cos(angle + (Math.random() - 0.5) * 0.5) * 15;
                currentY += Math.sin(angle + (Math.random() - 0.5) * 0.5) * 15;
                points.push({ x: currentX, y: currentY });
            }
            
            this.particles.push({
                points: points,
                color: '#228822',
                life: 1.0,
                decay: 0.025,
                type: 'nature_root',
                width: 3
            });
        }
    }
    
    // Animation des particules
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }
    
    animate() {
        if (!this.ctx || this.particles.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner toutes les particules
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
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
            case 'rage_flame':
            case 'shadow_particle':
            case 'nature_energy':
            case 'healing_light':
            case 'heal_sparkle':
            case 'arrow_trail':
            case 'arrow_head':
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'star':
            case 'shadow_star':
                this.drawStar(particle);
                break;
                
            case 'lightning':
                this.drawLightning(particle);
                break;
                
            case 'shockwave':
            case 'rage_wave':
                this.drawShockwave(particle);
                break;
                
            case 'magic_shield':
                this.drawMagicShield(particle);
                break;
                
            case 'magic_rune':
                this.drawMagicRune(particle);
                break;
                
            case 'shadow_blade':
                this.drawShadowBlade(particle);
                break;
                
            case 'leaf':
                this.drawLeaf(particle);
                break;
                
            case 'nature_root':
                this.drawNatureRoot(particle);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawStar(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.4;
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawLightning(particle) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.width;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        for (let i = 0; i < particle.points.length; i++) {
            const point = particle.points[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();
    }
    
    drawShockwave(particle) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    // Méthodes de dessin pour les nouveaux effets
    drawMagicShield(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Effet de lueur
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawMagicRune(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        this.ctx.fillStyle = particle.color;
        this.ctx.font = `${particle.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('✦', 0, 0);
        
        this.ctx.restore();
    }
    
    drawShadowBlade(particle) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.width;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(particle.endX, particle.endY);
        this.ctx.stroke();
        
        // Effet de lueur sombre
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawLeaf(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        // Forme de feuille simple
        this.ctx.ellipse(0, 0, particle.size * 0.8, particle.size, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawNatureRoot(particle) {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.width;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        for (let i = 0; i < particle.points.length; i++) {
            const point = particle.points[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();
    }
    
    updateParticle(particle) {
        particle.life -= particle.decay;
        
        switch (particle.type) {
            case 'slash':
            case 'magic':
            case 'explosion':
            case 'rage_flame':
            case 'shadow_particle':
            case 'nature_energy':
            case 'healing_light':
            case 'heal_sparkle':
            case 'arrow_trail':
            case 'arrow_head':
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.2; // Gravité
                break;
                
            case 'star':
            case 'shadow_star':
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;
                break;
                
            case 'shockwave':
            case 'rage_wave':
                particle.radius += (particle.maxRadius - particle.radius) * 0.1;
                break;
                
            case 'magic_shield':
                particle.x += particle.vx;
                particle.y += particle.vy;
                // Mouvement circulaire
                particle.angle += 0.05;
                particle.x = particle.x + Math.cos(particle.angle) * 2;
                particle.y = particle.y + Math.sin(particle.angle) * 2;
                break;
                
            case 'magic_rune':
                particle.rotation += particle.rotationSpeed;
                break;
                
            case 'shadow_blade':
                // Les lames d'ombre restent fixes mais s'estompent
                break;
                
            case 'leaf':
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;
                particle.vy += 0.1; // Légère gravité
                break;
                
            case 'nature_root':
                // Les racines restent fixes mais s'estompent
                break;
        }
    }
    
    // Effet de dégâts sur l'interface
    showDamageNumber(damage, targetSide, damageType = 'normal') {
        const arena = document.querySelector('#arena .arena');
        if (!arena) return;
        
        const damageEl = document.createElement('div');
        damageEl.className = `damage-number damage-${damageType}`;
        damageEl.textContent = `-${damage}`;
        
        const targetDisplay = document.getElementById(targetSide === 'left' ? 'fighter1Display' : 'fighter2Display');
        if (targetDisplay) {
            const rect = targetDisplay.getBoundingClientRect();
            const arenaRect = arena.getBoundingClientRect();
            
            damageEl.style.cssText = `
                position: absolute;
                left: ${rect.left - arenaRect.left + rect.width / 2}px;
                top: ${rect.top - arenaRect.top + 20}px;
                font-size: 2rem;
                font-weight: bold;
                color: ${this.getDamageColor(damageType)};
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                pointer-events: none;
                z-index: 200;
                animation: damageFloat 2s ease-out forwards;
            `;
            
            arena.appendChild(damageEl);
            
            setTimeout(() => {
                if (damageEl.parentNode) {
                    damageEl.parentNode.removeChild(damageEl);
                }
            }, 2000);
        }
    }
    
    getDamageColor(damageType) {
        const colors = {
            normal: '#ff6b6b',
            special: '#4ecdc4',
            power: '#ff9500',
            critical: '#ffd93d',
            heal: '#6bcf7f'
        };
        return colors[damageType] || colors.normal;
    }
    
    // Secouer l'écran lors d'attaques puissantes
    screenShake(intensity = 5, duration = 300) {
        const arena = document.querySelector('#arena .arena');
        if (!arena) return;
        
        const originalTransform = arena.style.transform;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const x = (Math.random() - 0.5) * intensity;
                const y = (Math.random() - 0.5) * intensity;
                arena.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                arena.style.transform = originalTransform;
            }
        };
        
        shake();
    }
    
    // Animer les barres de vie
    animateHealthBar(fighterId, oldHp, newHp, maxHp) {
        const healthFill = document.querySelector(`#${fighterId} .health-fill`);
        const healthText = document.querySelector(`#${fighterId} .health-text`);
        
        if (!healthFill || !healthText) return;
        
        const startPercent = (oldHp / maxHp) * 100;
        const endPercent = (newHp / maxHp) * 100;
        const duration = 800;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentPercent = startPercent + (endPercent - startPercent) * easeOut;
            const currentHp = Math.round(oldHp + (newHp - oldHp) * easeOut);
            
            healthFill.style.width = `${currentPercent}%`;
            healthText.textContent = `${currentHp}/${maxHp}`;
            
            // Changer la couleur selon les PV
            if (currentPercent < 25) {
                healthFill.style.backgroundColor = '#ef4444';
            } else if (currentPercent < 50) {
                healthFill.style.backgroundColor = '#f59e0b';
            } else {
                healthFill.style.backgroundColor = '#10b981';
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // Nettoyer les effets
    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.isAnimating = false;
        
        // Nettoyer les éléments de dégâts restants
        document.querySelectorAll('.damage-number').forEach(el => el.remove());
    }
}

// Instance globale des effets
export const combatEffects = new CombatEffects();