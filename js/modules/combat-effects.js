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
        
        `
    }
}