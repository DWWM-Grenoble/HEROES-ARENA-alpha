// Système de modal d'information - Heroes Arena

export class InfoModal {
    constructor() {
        this.isOpen = false;
        this.modal = null;
        this.overlay = null;
        this.button = null;
        this.init();
    }

    init() {
        this.createInfoButton();
        this.createModal();
        this.attachEventListeners();
        
        // S'assurer que le modal est fermé au démarrage
        this.forceClose();
    }

    forceClose() {
        this.isOpen = false;
        this.overlay.style.display = 'none';
        this.overlay.style.visibility = 'hidden';
        this.overlay.style.opacity = '0';
        this.modal.style.visibility = 'hidden';
        this.modal.style.transform = 'translate(-50%, -50%) scale(0.8)';
        document.body.style.overflow = '';
    }

    createInfoButton() {
        this.button = document.createElement('button');
        this.button.id = 'info-button';
        this.button.innerHTML = '💡';
        this.button.title = 'À propos du projet';
        this.button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
            border: 3px solid #ffffff;
            color: #1e293b;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
            z-index: 9999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Effet hover
        this.button.addEventListener('mouseenter', () => {
            this.button.style.transform = 'scale(1.1)';
            this.button.style.boxShadow = '0 6px 25px rgba(212, 175, 55, 0.6)';
        });

        this.button.addEventListener('mouseleave', () => {
            this.button.style.transform = 'scale(1)';
            this.button.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.4)';
        });

        document.body.appendChild(this.button);
    }

    createModal() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'info-modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            visibility: hidden;
        `;

        // Modal
        this.modal = document.createElement('div');
        this.modal.id = 'info-modal';
        this.modal.innerHTML = this.getModalContent();
        this.modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 3px solid #d4af37;
            border-radius: 20px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10001;
            color: #ffffff;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
            transition: all 0.3s ease;
            visibility: hidden;
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.modal);
    }

    getModalContent() {
        return `
            <div class="modal-header" style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #d4af37; font-size: 2rem; margin-bottom: 10px;">
                    🎓 Heroes Arena
                </h2>
                <p style="color: #94a3b8; font-style: italic;">
                    Projet de formation en développement web
                </p>
            </div>

            <div class="modal-content" style="line-height: 1.6;">
                <div class="project-info" style="margin-bottom: 25px;">
                    <h3 style="color: #d4af37; margin-bottom: 15px; border-bottom: 2px solid #334155; padding-bottom: 5px;">
                        📚 À propos de ce projet
                    </h3>
                    <p style="margin-bottom: 15px;">
                        <strong>Heroes Arena</strong> est un projet de groupe développé dans le cadre d'une 
                        <strong>formation Développeur Web et Web Mobile</strong>.
                    </p>
                    <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
                        <h4 style="color: #60a5fa; margin-bottom: 10px;">🎯 Objectifs pédagogiques :</h4>
                        <ul style="margin-left: 20px; color: #e2e8f0;">
                            <li>Apprentissage approfondi de <strong>JavaScript moderne</strong></li>
                            <li>Gestion de projet en méthode <strong>Agile/Scrum</strong></li>
                            <li>Travail collaboratif en équipe</li>
                            <li>Architecture modulaire et bonnes pratiques</li>
                            <li>Interface utilisateur interactive et responsive</li>
                        </ul>
                    </div>
                </div>

                <div class="tech-stack" style="margin-bottom: 25px;">
                    <h3 style="color: #d4af37; margin-bottom: 15px; border-bottom: 2px solid #334155; padding-bottom: 5px;">
                        ⚡ Technologies utilisées
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span class="tech-badge">JavaScript ES6+</span>
                        <span class="tech-badge">HTML5 & CSS3</span>
                        <span class="tech-badge">Canvas API</span>
                        <span class="tech-badge">Modules ES6</span>
                        <span class="tech-badge">Local Storage</span>
                        <span class="tech-badge">Responsive Design</span>
                    </div>
                </div>

                <div class="utilities" style="margin-bottom: 25px;">
                    <h3 style="color: #d4af37; margin-bottom: 15px; border-bottom: 2px solid #334155; padding-bottom: 5px;">
                        🔧 Outils de développement
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                        <button class="utility-btn" onclick="window.infoModal.openDebugPage()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; padding: 10px 15px; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s ease;">
                            🐛 Page de Debug
                        </button>
                        <button class="utility-btn" onclick="window.infoModal.clearCache()" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; padding: 10px 15px; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s ease;">
                            🗑️ Vider le Cache
                        </button>
                        <button class="utility-btn" onclick="window.infoModal.openTestPage()" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; padding: 10px 15px; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s ease;">
                            🧪 Tests Combat
                        </button>
                        <button class="utility-btn" onclick="window.infoModal.openReadme()" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border: none; padding: 10px 15px; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s ease;">
                            📖 Documentation
                        </button>
                    </div>
                </div>

                <div class="team-info" style="margin-bottom: 20px; background: rgba(139, 69, 19, 0.1); border-radius: 10px; padding: 15px;">
                    <h4 style="color: #d4af37; margin-bottom: 10px;">👥 Projet de groupe collaboratif</h4>
                    <p style="color: #e2e8f0; font-size: 0.9rem;">
                        Développé en équipe avec une approche Agile, ce projet met l'accent sur la 
                        collaboration, la planification itérative et la livraison continue.
                    </p>
                </div>
            </div>

            <div class="modal-footer" style="text-align: center; padding-top: 20px; border-top: 2px solid #334155;">
                <button id="close-modal-btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; padding: 12px 30px; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                    ✖️ Fermer
                </button>
            </div>

            <style>
                .tech-badge {
                    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
                    border: 1px solid #4b5563;
                    padding: 4px 8px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    color: #d1d5db;
                }
                
                .utility-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }

                #info-modal::-webkit-scrollbar {
                    width: 8px;
                }

                #info-modal::-webkit-scrollbar-track {
                    background: #1e293b;
                    border-radius: 4px;
                }

                #info-modal::-webkit-scrollbar-thumb {
                    background: #d4af37;
                    border-radius: 4px;
                }

                #info-modal::-webkit-scrollbar-thumb:hover {
                    background: #b8962e;
                }
            </style>
        `;
    }

    attachEventListeners() {
        // Ouvrir le modal
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.open();
        });

        // Fermer le modal en cliquant sur l'overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Empêcher la fermeture en cliquant sur le modal lui-même
        this.modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Fermeture avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Attacher l'événement du bouton de fermeture de manière plus robuste
        this.attachCloseButtonListener();
    }

    attachCloseButtonListener() {
        // Utiliser un event listener délégué pour capturer les clics sur le bouton de fermeture
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'close-modal-btn') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        });
    }

    open() {
        if (this.isOpen) return; // Empêcher les ouvertures multiples
        
        this.isOpen = true;
        
        // Afficher les éléments
        this.overlay.style.display = 'block';
        this.overlay.style.visibility = 'visible';
        this.modal.style.visibility = 'visible';
        
        // Animation d'ouverture
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.isOpen) return; // Empêcher les fermetures multiples
        
        this.isOpen = false;
        
        // Animation de fermeture
        this.overlay.style.opacity = '0';
        this.modal.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.style.visibility = 'hidden';
            this.modal.style.visibility = 'hidden';
        }, 300);

        // Rétablir le scroll du body
        document.body.style.overflow = '';
    }

    // Méthodes utilitaires
    openDebugPage() {
        // Déterminer le chemin selon la page actuelle
        const basePath = this.getBasePath();
        window.open(`${basePath}debug.html`, '_blank');
    }

    clearCache() {
        if (confirm('Êtes-vous sûr de vouloir vider le cache ? Cela effacera tous les héros sauvegardés.')) {
            localStorage.clear();
            sessionStorage.clear();
            alert('Cache vidé avec succès ! La page va se recharger.');
            window.location.reload();
        }
    }

    openTestPage() {
        const basePath = this.getBasePath();
        window.open(`${basePath}test-effets-autonome.html`, '_blank');
    }

    openReadme() {
        const basePath = this.getBasePath();
        window.open(`${basePath}readme.html`, '_blank');
    }

    getBasePath() {
        // Si on est dans un sous-dossier (HTML/), retourner au dossier parent
        const path = window.location.pathname;
        if (path.includes('/HTML/')) {
            return '../';
        }
        return './';
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.infoModal = new InfoModal();
});