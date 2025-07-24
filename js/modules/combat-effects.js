export class CombatEffects {
  constructor() {
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.isAnimating = false;
  }

  // Initialiser les canvas d'effets
  initCanvas() {
    if (this.canvas) return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "combatEffectsCanvas";
    this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        `;

    const arena = document.querySelector("#arena .arena");
    if (arena) {
      arena.style.position = "relative";
      arena.appendChild(this.canvas);

      this.resizeCanvas();
      this.ctx = this.canvas.getContext("2d");

      window.addEventListener("resize", () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;

    const arena = document.querySelector("#arena .arena");
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
    const startX = attackerSide === "left" ? 100 : this.canvas.width - 100;
    const endX = attackerSide === "left" ? this.canvas.width - 100 : 100;
    const y = this.canvas.height / 2;

    // Créer l'effet selon l'attaque
    switch (attackType) {
      case "normal":
        this.createSlashEffect(startX, endX, y, colors, damage);
        break;
      case "power":
        this.createPowerEffect(startX, endX, y, colors, damage);
        break;
      case "critical":
        this.createCriticalEffect(startX, endX, y, colors, damage);
        break;
    }

    this.startAnimation();
  }

  getAttackColors(attackType) {
    const colorSchemes = {
      normal: ["#ffffff", "#ffdd44", "#ff8844"],
      special: ["#44ddff", "#4488ff", "#8844ff"],
      power: ["#ff4444", "#ff8844", "#ffdd44"],
      critical: ["#ffff44", "#ff4444", "#ffffff"],
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
        type: "Slash",
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
        x: (startX - endX) / 2 + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.015,
        type: "magic",
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
      type: "shockwave",
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
        type: "explosion",
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

      this.particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        size: Math.random() * 6 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.02,
        type: "star",
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
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
        y: centerY + (Math.random() - 0.5) * 100,
      });
    }

    this.particles.push({
      points: points,
      color: color,
      life: 1.0,
      decay: 0.1,
      type: "lightning",
      width: 3,
    });
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
      case "slash":
      case "magic":
      case "explosion":
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case "star":
        this.drawStar(particle);
        break;
      case "lightning":
        this.drawLightning(particle);
        break;
      case "shockwave":
        this.drawShockwave(particle);
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
  } // <- Cette accolade manquait !

  drawLightning(particle) {
    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = particle.width;
    this.ctx.lineCap = "round";

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

  updateParticle(particle) {
    particle.life -= particle.decay;

    switch (particle.type) {
      case "slash":
      case "magic":
      case "explosion":
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // Gravité
        break;

      case "star":
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        break;

      case "shockwave":
        particle.radius += (particle.maxRadius - particleRadius) * 0.1;
        break;
    }
  }

//   Effets de dégâts sur l'interface
showDamageNumber(damage,targetSide,damageType = 'normal') {
    const arena = document.querySelector('#arena .arena');
    if(!arena) return;

    const damageEl = document.createElement('div');
    damageEl.className = `damage-number damage-${damageType}`;
    damageEl.textContent = `-${damage}`;

    const targetDisplay = document.getElementById(targetSide === 'left' ? 'fighter1Display' : 'fighter2Display');
    if(targetDisplay) {
        const rect = targetDisplay.getBoundingClientRect();
        const arenaRect = arena.getBoundingClientRect();

        damageEl.style.cssText = `
        position: absolute;
        left: ${rect.left -arenaRect.left + rect.width / 2}px;
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
            if(damageEl.parentNode) {
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
    if(!arena) return;

    const originalTransform = arena.style.transform;
    const startTime = Date.now();
    const shake = () => {
        const elapsed = Date.now() - startTime;
        if(elapsed < duration) {
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
animateHealthBar(fighterId, oldHp,newHp,maxHp) {
    const healthFill = document.querySelector(`#${fighterId.id}.health-fill`);
    const healthText = document.querySelector(`#${fighterId}.health-text`);

    if(!healthFill || !healthText) return;

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
        if(currentPercent < 25) {
            healthFill.style.backgroundColor = '#ef4444';
        } else if(currentPercent < 50) {
            healthFill.style.backgroundColor = '#f59e0b';
        } else {
            healthFill.style.backgroundColor = '#10b981';
        }

        if(progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Nettoyer les effets
cleanup() {
    if(this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
    }

    if(this.canvas && this.canvas.parentNode)  {
        this.canvas.parentNode.removeChild(this.canvas);
    }

    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.isAnimating = false;

    // Nettoyer les éléments des dégâts restants
    document.querySelectorAll('.damage-number').forEach(el => el.remove());
}
}

// Instance globale des effets
export const CombatEffects = new CombatEffects();
