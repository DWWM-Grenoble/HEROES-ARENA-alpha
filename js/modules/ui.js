// Interface utilisateur - Heroes Arena

import { AppState, avatarCatalog, classInfo, gameConfig, messages } from '../core/config.js';
import { generateRandomStats, validateStats, formatName, validateName, calculateHealthPercentage, getHealthColor } from '../core/utils.js';

export class UIManager {
    constructor() {
        this.currentSection = 'create';
        this.selectedAvatar = 'warrior/warrior1.webp';
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🎨 Initialisation de l\'interface...');
            
            this.initializeStats();
            this.initializeAvatars();
            this.initializeClassInfo();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Interface initialisée');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'UI:', error);
            this.showError('Erreur lors de l\'initialisation de l\'interface');
        }
    }
    
    showSection(sectionName) {
        // Désactiver toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Désactiver tous les onglets de navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activer la section cible
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Activer l'onglet correspondant en utilisant data-section
        const correspondingTab = document.querySelector(`.nav-tab[data-section="${sectionName}"]`);
        if (correspondingTab) {
            correspondingTab.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Actions spéciales selon la section
        if (sectionName === 'heroes') {
            this.displayHeroes();
        } else if (sectionName === 'arena') {
            this.updateFighterSelectors();
        }
    }
    
    initializeAvatars() {
        this.showAvatarCategory('guerriers');
    }
    
    showAvatarCategory(category) {
        if (!avatarCatalog[category]) return;
        
        const avatarGrid = document.getElementById('avatarGrid');
        if (!avatarGrid) return;
        
        document.querySelectorAll('.catalog-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick*="${category}"]`)?.classList.add('active');
        
        avatarGrid.innerHTML = avatarCatalog[category].map(avatar => `
            <div class="avatar-option ${avatar === this.selectedAvatar ? 'selected' : ''}" 
                 onclick="window.HeroesArena.ui.selectAvatar('${avatar}')"
                 ondblclick="window.HeroesArena.ui.previewAvatar('${avatar}')">
                <img src="assets/avatars/${avatar}" alt="${avatar}" loading="lazy">
            </div>
        `).join('');
    }
    
    /**
     * Gérer la sélection d'avatar via le select
     */
    handleMobileAvatarCategory(category) {
        this.showAvatarCategory(category);
        
        // Synchroniser tous les selects avec la sélection
        const selects = [
            document.getElementById('avatarCategorySelect'),
            document.getElementById('profileAvatarCategorySelect')
        ];
        
        selects.forEach(select => {
            if (select && select.value !== category) {
                select.value = category;
            }
        });
    }
    
    selectAvatar(filename) {
        this.selectedAvatar = filename;
        AppState.selectedAvatar = filename;
        
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[onclick*="${filename}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
    
    previewAvatar(avatarPath) {
        // Créer la modal de prévisualisation
        const modal = document.createElement('div');
        modal.className = 'avatar-preview-modal';
        modal.innerHTML = `
            <div class="avatar-preview-backdrop" onclick="this.parentElement.remove()">
                <div class="avatar-preview-content" onclick="event.stopPropagation()">
                    <button class="avatar-preview-close" onclick="this.closest('.avatar-preview-modal').remove()">✕</button>
                    <img src="assets/avatars/${avatarPath}" alt="Prévisualisation" class="avatar-preview-image">
                </div>
            </div>
        `;
        
        // Ajouter la modal au DOM
        document.body.appendChild(modal);
        
        // Fermeture avec la touche Échap
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }
    
    initializeStats() {
        this.updateStats();
        this.randomStats();
    }
    
    updateStats() {
        const stats = {
            force: parseInt(document.getElementById('force')?.value || 20),
            agility: parseInt(document.getElementById('agility')?.value || 20),
            magic: parseInt(document.getElementById('magic')?.value || 20),
            defense: parseInt(document.getElementById('defense')?.value || 20)
        };
        
        Object.keys(stats).forEach(stat => {
            const valueElement = document.getElementById(`${stat}Value`);
            if (valueElement) {
                valueElement.textContent = stats[stat];
            }
            
            const fillElement = document.querySelector(`.stat-fill.${stat}`);
            if (fillElement) {
                const percentage = ((stats[stat] - gameConfig.minStatValue) / 
                                 (gameConfig.maxStatValue - gameConfig.minStatValue)) * 100;
                fillElement.style.width = `${percentage}%`;
            }
        });
        
        const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
        const totalElement = document.getElementById('totalPoints');
        
        if (totalElement) {
            totalElement.textContent = `Total: ${total}/${gameConfig.statPoints} points`;
            totalElement.className = total === gameConfig.statPoints ? 'total-points valid' : 'total-points invalid';
        }
        
        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
            createBtn.disabled = total !== gameConfig.statPoints;
        }
        
        return stats;
    }
    
    randomStats() {
        const stats = generateRandomStats();
        
        Object.keys(stats).forEach(stat => {
            const slider = document.getElementById(stat);
            if (slider) {
                slider.value = stats[stat];
            }
        });
        
        this.updateStats();
    }
    
    initializeClassInfo() {
        this.updateClassInfo();
    }
    
    updateClassInfo() {
        const selectedClass = document.getElementById('heroClass')?.value || 'Guerrier';
        const info = classInfo[selectedClass];
        const classInfoElement = document.getElementById('classInfo');
        
        if (!info || !classInfoElement) return;
        
        classInfoElement.innerHTML = `
            <h4>${info.title}</h4>
            <p>${info.desc}</p>
            <div class="power-preview">
                <h5>Pouvoir : ${info.power}</h5>
                <p>${info.powerDesc}</p>
            </div>
        `;
    }
    
    displayHeroes() {
        const heroesList = document.getElementById('heroesList');
        if (!heroesList) return;
        
        if (AppState.heroes.length === 0) {
            heroesList.innerHTML = `
                <div class="empty-state">
                    <h3>Aucun héros créé</h3>
                    <p>Allez dans "Créer un Héros" pour commencer votre aventure !</p>
                    <button class="btn" onclick="HeroesArena.showSection('create')">Créer mon premier héros</button>
                </div>
            `;
            return;
        }
        
        let heroesToShow = AppState.heroes;
        if (AppState.currentFilter && AppState.currentFilter !== 'all') {
            heroesToShow = AppState.heroes.filter(hero => hero.classe === AppState.currentFilter);
        }
        
        heroesList.innerHTML = heroesToShow.map((hero, index) => 
            this.generateHeroCard(hero, AppState.heroes.indexOf(hero))
        ).join('');
    }
    
    generateHeroCard(hero, index) {
        const healthPercent = (hero.pv / hero.pvMax) * 100;
        const healthColor = healthPercent > 75 ? '#10b981' : 
                           healthPercent > 50 ? '#f59e0b' : 
                           healthPercent > 25 ? '#f97316' : '#ef4444';
        
        return `
            <div class="hero-card clickable" data-hero-id="${hero.id}" data-hero-index="${index}" onclick="window.showHeroDetailsNow(${index})" title="Cliquer pour voir les détails - ${hero.nom}">
                <div class="hero-avatar-container">
                    <div class="hero-avatar">
                        <img src="assets/avatars/${hero.avatar}" alt="${hero.nom}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="avatar-fallback" style="display: none;">👤</div>
                    </div>
                    <div class="hero-level-badge">Niv. ${hero.niveau}</div>
                </div>
                
                <div class="hero-info">
                    <h3 class="hero-name">${hero.nom}</h3>
                    <div class="hero-class ${hero.classe.toLowerCase()}">${hero.classe}</div>
                    <div class="hero-badge">${hero.getBadgeText()}</div>
                </div>
                
                <div class="hero-stats">
                    <div class="stat-mini">
                        <span class="stat-icon">⚔️</span>
                        <span>${hero.force}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-icon">🏃</span>
                        <span>${hero.agility}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-icon">🔮</span>
                        <span>${hero.magic}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-icon">🛡️</span>
                        <span>${hero.defense}</span>
                    </div>
                </div>
                
                <div class="hero-health">
                    <div class="health-bar">
                        <div class="health-fill" style="width: ${healthPercent}%; background-color: ${healthColor}"></div>
                        <div class="health-text">${hero.pv}/${hero.pvMax}</div>
                    </div>
                </div>
                
                <div class="hero-record">
                    <span class="victories">${hero.victoires}V</span> - 
                    <span class="defeats">${hero.defaites}D</span>
                    <span class="ratio">(${hero.getRatio()}%)</span>
                </div>
            </div>
        `;
    }
    
    updateFighterSelectors() {
        const selectors = [
            document.getElementById('fighter1Select'),
            document.getElementById('fighter2Select')
        ];
        
        const options = '<option value="">Sélectionnez un héros</option>' +
            AppState.heroes.map((hero, index) => 
                `<option value="${index}">${hero.nom} (${hero.classe})</option>`
            ).join('');
        
        selectors.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = options;
                if (currentValue && AppState.heroes[currentValue]) {
                    select.value = currentValue;
                }
            }
        });
        
        this.updateFighters();
    }
    
    updateFighters() {
        const f1Index = document.getElementById('fighter1Select')?.value;
        const f2Index = document.getElementById('fighter2Select')?.value;
        
        AppState.fighter1 = f1Index ? AppState.heroes[f1Index] : null;
        AppState.fighter2 = f2Index ? AppState.heroes[f2Index] : null;
        
        this.updateFighterDisplay();
        
        const canFight = AppState.fighter1 && 
                        AppState.fighter2 && 
                        AppState.fighter1.id !== AppState.fighter2.id;
        
        const fightBtn = document.getElementById('fightBtn');
        if (fightBtn) {
            fightBtn.disabled = !canFight;
        }
    }
    
    updateFighterDisplay() {
        this.updateSingleFighterDisplay('fighter1Display', AppState.fighter1);
        this.updateSingleFighterDisplay('fighter2Display', AppState.fighter2);
    }
    
    clearArena() {
        // Réinitialiser les combattants dans l'AppState
        AppState.fighter1 = null;
        AppState.fighter2 = null;
        AppState.combatEnCours = false;
        
        // Mettre à jour l'affichage des combattants
        this.updateFighterDisplay();
        
        // Nettoyer les effets visuels résiduels
        this.clearVisualEffects();
        
        console.log('🧹 Arène vidée après la fin du combat');
    }
    
    clearVisualEffects() {
        // Supprimer les éléments de dégâts résiduels
        const arena = document.querySelector('#arena .arena');
        if (arena) {
            const damageElements = arena.querySelectorAll('.damage-number, .damage-float');
            damageElements.forEach(el => el.remove());
            
            // Réinitialiser les transformations
            arena.style.transform = '';
        }
        
        // Réinitialiser les effets sur les displays des combattants
        const fighter1Display = document.getElementById('fighter1Display');
        const fighter2Display = document.getElementById('fighter2Display');
        
        [fighter1Display, fighter2Display].forEach(display => {
            if (display) {
                display.classList.remove('victory', 'defeat', 'winner', 'loser');
                display.style.transform = '';
                display.style.filter = '';
                display.style.animation = '';
            }
        });
    }

    updateSingleFighterDisplay(displayId, fighter) {
        const display = document.getElementById(displayId);
        if (!display) return;
        
        if (!fighter) {
            display.innerHTML = `
                <div class="fighter-avatar-large">
                    <span style="color: #64748b; font-size: 2rem;">?</span>
                </div>
                <div class="fighter-name">En attente...</div>
                <div class="hero-class" style="background: rgba(255, 255, 255, 0.1);">Non sélectionné</div>
                <div class="health-bar">
                    <div class="health-fill" style="width: 0%"></div>
                    <div class="health-text">0/0</div>
                </div>
            `;
            return;
        }
        
        const healthPercent = calculateHealthPercentage(fighter.pv, fighter.pvMax);
        const healthColor = getHealthColor(healthPercent);
        
        display.innerHTML = `
            <div class="fighter-avatar-large">
                <img src="assets/avatars/${fighter.avatar}" alt="${fighter.nom}">
            </div>
            <div class="fighter-name">${fighter.nom}</div>
            <div class="hero-class ${fighter.classe.toLowerCase()}">${fighter.classe}</div>
            <div class="fighter-stats">
                <div class="stat-mini">⚔️ ${fighter.force}</div>
                <div class="stat-mini">🏃 ${fighter.agility}</div>
                <div class="stat-mini">🔮 ${fighter.magic}</div>
                <div class="stat-mini">🛡️ ${fighter.defense}</div>
            </div>
            <div class="health-bar">
                <div class="health-fill" style="width: ${healthPercent}%; background-color: ${healthColor}"></div>
                <div class="health-text">${fighter.pv}/${fighter.pvMax}</div>
            </div>
        `;
    }
    
    filterHeroes(filter) {
        AppState.currentFilter = filter;
        
        // Désactiver tous les boutons de filtre
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activer le bouton correspondant au filtre sélectionné
        const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Mettre à jour l'affichage des héros
        this.displayHeroes();
    }
    
    addLogEntry(message, type = 'info') {
        const combatLog = document.getElementById('combatLog');
        if (!combatLog) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;
        
        combatLog.appendChild(entry);
        combatLog.scrollTop = combatLog.scrollHeight;
        
        const entries = combatLog.children;
        if (entries.length > 100) {
            combatLog.removeChild(entries[0]);
        }
    }
    
    clearCombatLog() {
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
            combatLog.innerHTML = '';
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('create');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('heroes');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('arena');
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(modal => {
                    modal.remove();
                });
            }
        });
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '5px',
            color: 'white',
            zIndex: '10000',
            maxWidth: '400px',
            wordWrap: 'break-word'
        });
        
        switch (type) {
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#3b82f6';
                break;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Méthodes pour les effets visuels de combat
    applyAttackingEffect(fighterId) {
        const fighterElement = document.getElementById(fighterId);
        if (fighterElement) {
            fighterElement.classList.add('attacking');
            setTimeout(() => {
                fighterElement.classList.remove('attacking');
            }, 600);
        }
    }
    
    applyDefendingEffect(fighterId) {
        const fighterElement = document.getElementById(fighterId);
        if (fighterElement) {
            fighterElement.classList.add('defending');
            setTimeout(() => {
                fighterElement.classList.remove('defending');
            }, 400);
        }
    }
    
    applyVictoryEffect(fighterId) {
        const fighterElement = document.getElementById(fighterId);
        if (fighterElement) {
            fighterElement.classList.add('victory');
        }
    }
    
    applyDefeatEffect(fighterId) {
        const fighterElement = document.getElementById(fighterId);
        if (fighterElement) {
            fighterElement.classList.add('defeat');
        }
    }
    
    resetCombatEffects() {
        const fighterElements = [
            document.getElementById('fighter1Display'),
            document.getElementById('fighter2Display')
        ];
        
        fighterElements.forEach(element => {
            if (element) {
                element.classList.remove('attacking', 'defending', 'victory', 'defeat');
            }
        });
    }
    
    // ========== MODAL DE VICTOIRE CLASSIQUE ==========
    showCombatEndModalSpectacular(result) {
        const { winner, loser, draw, originalWinner, originalLoser } = result;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay combat-end-modal';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        
        if (draw) {
            modal.innerHTML = this.generateSimpleDrawContent(originalWinner, originalLoser);
        } else {
            modal.innerHTML = this.generateSimpleVictoryContent(originalWinner, originalLoser);
        }
        
        document.body.appendChild(modal);
        
        // Animation d'entrée simple
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 50);
        
        // Gestionnaire de fermeture
        this.setupSimpleModalHandlers(modal);
        
        return modal;
    }

    // Génération du contenu simple pour une victoire
    generateSimpleVictoryContent(winner, loser) {
        return `
            <div class="modal-content victory-modal">
                <div class="modal-header">
                    <h2 class="victory-title">🏆 Victoire !</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="combat-result">
                        <div class="winner-section">
                            <div class="hero-result winner">
                                <div class="hero-avatar">
                                    <img src="assets/avatars/${winner.avatar}" alt="${winner.nom}">
                                </div>
                                <h3 class="hero-name">${winner.nom}</h3>
                                <div class="hero-class">${winner.classe}</div>
                                <div class="hero-record">
                                    <span class="victories">${winner.victoires} Victoires</span>
                                    <span class="ratio">${winner.getRatio()}% de réussite</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="vs-divider">
                            <span class="vs-text">VS</span>
                        </div>
                        
                        <div class="loser-section">
                            <div class="hero-result loser">
                                <div class="hero-avatar">
                                    <img src="assets/avatars/${loser.avatar}" alt="${loser.nom}">
                                </div>
                                <h3 class="hero-name">${loser.nom}</h3>
                                <div class="hero-class">${loser.classe}</div>
                                <div class="hero-record">
                                    <span class="defeats">${loser.defaites} Défaites</span>
                                    <span class="ratio">${loser.getRatio()}% de réussite</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="victory-message">
                        <p><strong>${winner.nom}</strong> remporte la victoire avec brio !</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
                        Continuer
                    </button>
                </div>
            </div>
        `;
    }

    // Génération du contenu simple pour un match nul  
    generateSimpleDrawContent(fighter1, fighter2) {
        return `
            <div class="modal-content draw-modal">
                <div class="modal-header">
                    <h2 class="draw-title">⚖️ Match Nul</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="combat-result">
                        <div class="fighter-section">
                            <div class="hero-result draw">
                                <div class="hero-avatar">
                                    <img src="assets/avatars/${fighter1.avatar}" alt="${fighter1.nom}">
                                </div>
                                <h3 class="hero-name">${fighter1.nom}</h3>
                                <div class="hero-class">${fighter1.classe}</div>
                            </div>
                        </div>
                        
                        <div class="vs-divider">
                            <span class="vs-text">=</span>
                        </div>
                        
                        <div class="fighter-section">
                            <div class="hero-result draw">
                                <div class="hero-avatar">
                                    <img src="assets/avatars/${fighter2.avatar}" alt="${fighter2.nom}">
                                </div>
                                <h3 class="hero-name">${fighter2.nom}</h3>
                                <div class="hero-class">${fighter2.classe}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="draw-message">
                        <p>Combat équilibré ! Les deux héros ont fait preuve d'une égale bravoure.</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
                        Continuer
                    </button>
                </div>
            </div>
        `;
    }

    // Gestionnaire simple pour le modal
    setupSimpleModalHandlers(modal) {
        // Fermeture en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Échap pour fermer
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Nettoyer après fermeture
        modal.addEventListener('remove', () => {
            this.displayHeroes();
        });
    }
    
    // Méthode pour forcer la mise à jour complète de l'interface
    forceUpdate() {
        this.displayHeroes();
        this.updateFighterSelectors();
        this.updateFighterDisplay();
    }
    
    /**
     * Afficher la modal d'édition de profil utilisateur
     */
    showUserProfileModal() {
        const currentUser = HeroesAuth.getCurrentUser();
        if (!currentUser) {
            this.showError('Utilisateur non connecté');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay user-profile-modal';
        modal.innerHTML = `
            <div class="modal-content user-profile-content">
                <div class="modal-header">
                    <h2>✏️ Éditer le Profil</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="profile-edit-form">
                        <!-- Section Avatar -->
                        <div class="profile-section">
                            <h3>👤 Avatar</h3>
                            <div class="current-avatar-display">
                                <div class="user-avatar-large" id="profileCurrentAvatar" data-selected-avatar="${currentUser.avatar || ''}">
                                    ${currentUser.avatar ? 
                                        `<img src="assets/avatars/${currentUser.avatar}" alt="Avatar actuel">` :
                                        `<span class="user-initials">${currentUser.username.charAt(0).toUpperCase()}</span>`
                                    }
                                </div>
                                <button class="btn btn-secondary" onclick="window.HeroesArena.ui.showAvatarSelector()">
                                    Changer d'Avatar
                                </button>
                            </div>
                        </div>
                        
                        <!-- Section Informations personnelles -->
                        <div class="profile-section">
                            <h3>📝 Informations Personnelles</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="profileUsername">Nom d'utilisateur</label>
                                    <input type="text" id="profileUsername" class="form-input" 
                                           value="${currentUser.username}" maxlength="20">
                                    <small class="form-help">3-20 caractères, lettres, chiffres, _ et - seulement</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileEmail">Email</label>
                                    <input type="email" id="profileEmail" class="form-input" 
                                           value="${currentUser.email}">
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileDisplayName">Nom d'affichage</label>
                                    <input type="text" id="profileDisplayName" class="form-input" 
                                           value="${currentUser.displayName || currentUser.username}" maxlength="30">
                                    <small class="form-help">Nom qui apparaîtra dans le jeu</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="profileBio">Bio / Description</label>
                                    <textarea id="profileBio" class="form-input" rows="3" maxlength="200"
                                              placeholder="Parlez-nous de vous...">${currentUser.bio || ''}</textarea>
                                    <small class="form-help">Maximum 200 caractères</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Section Statistiques (lecture seule) -->
                        <div class="profile-section">
                            <h3>📊 Statistiques</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-icon">📅</span>
                                    <span class="stat-label">Membre depuis</span>
                                    <span class="stat-value">${new Date(currentUser.joinDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🦸</span>
                                    <span class="stat-label">Héros créés</span>
                                    <span class="stat-value">${currentUser.heroCount || 0}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🏆</span>
                                    <span class="stat-label">Victoires totales</span>
                                    <span class="stat-value">${currentUser.totalWins || 0}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">⚔️</span>
                                    <span class="stat-label">Combats totaux</span>
                                    <span class="stat-value">${(currentUser.totalWins || 0) + (currentUser.totalLosses || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Annuler
                    </button>
                    <button class="btn btn-primary" onclick="window.HeroesArena.ui.saveUserProfile()">
                        💾 Sauvegarder
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fermeture avec Échap
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }
    
    /**
     * Afficher le sélecteur d'avatar pour le profil utilisateur
     */
    showAvatarSelector() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay avatar-selector-modal';
        modal.innerHTML = `
            <div class="modal-content avatar-selector-content">
                <div class="modal-header">
                    <h2>🎭 Choisir un Avatar</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div class="modal-body">
                    <!-- Sélecteur de spécialisation unique -->
                    <div class="catalog-selector">
                        <label for="profileAvatarCategorySelect" class="selector-label">
                            ⚔️ Choisir une spécialisation
                        </label>
                        <select id="profileAvatarCategorySelect" class="specialty-select" onchange="window.HeroesArena.ui.showProfileAvatarCategory(this.value)">
                            <option value="guerriers">🛡️ Guerriers - Maîtres de la Guerre</option>
                            <option value="mages">🔮 Mages - Seigneurs de la Magie</option>
                            <option value="archers">🏹 Archers - Tireurs d'Élite</option>
                            <option value="paladins">✨ Paladins - Gardiens de Lumière</option>
                            <option value="assassins">🗡️ Assassins - Maîtres de l'Ombre</option>
                            <option value="druides">🌿 Druides - Gardiens de la Nature</option>
                            <option value="generiques">⭐ Génériques - Héros Universels</option>
                        </select>
                    </div>
                    
                    <div class="avatar-grid" id="profileAvatarGrid">
                        <!-- Les avatars seront générés ici -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Annuler
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialiser avec la première catégorie
        this.showProfileAvatarCategory('guerriers');
    }
    
    /**
     * Afficher une catégorie d'avatars pour le profil
     */
    showProfileAvatarCategory(category) {
        const avatarGrid = document.getElementById('profileAvatarGrid');
        if (!avatarGrid) return;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.catalog-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick*="${category}"]`)?.classList.add('active');
        
        // Importer la config des avatars
        import('../core/config.js').then(({ avatarCatalog }) => {
            if (!avatarCatalog[category]) return;
            
            avatarGrid.innerHTML = avatarCatalog[category].map(avatar => `
                <div class="avatar-option" onclick="window.HeroesArena.ui.selectProfileAvatar('${avatar}')">
                    <img src="assets/avatars/${avatar}" alt="${avatar}" loading="lazy">
                </div>
            `).join('');
        });
    }
    
    /**
     * Sélectionner un avatar pour le profil
     */
    selectProfileAvatar(avatarPath) {
        console.log('🎭 Sélection avatar profil:', avatarPath);
        
        // Mettre à jour l'affichage de l'avatar dans la modal de profil
        const currentAvatarDisplay = document.getElementById('profileCurrentAvatar');
        if (currentAvatarDisplay) {
            currentAvatarDisplay.innerHTML = `<img src="assets/avatars/${avatarPath}" alt="Avatar sélectionné">`;
            currentAvatarDisplay.dataset.selectedAvatar = avatarPath;
            
            console.log('✅ Avatar mis à jour dans la modal:', {
                newAvatar: avatarPath,
                datasetUpdated: currentAvatarDisplay.dataset.selectedAvatar
            });
        } else {
            console.error('❌ Élément profileCurrentAvatar non trouvé');
        }
        
        // Fermer le sélecteur d'avatar
        document.querySelector('.avatar-selector-modal')?.remove();
    }
    
    /**
     * Sauvegarder le profil utilisateur
     */
    saveUserProfile() {
        const currentUser = HeroesAuth.getCurrentUser();
        if (!currentUser) {
            this.showError('Utilisateur non connecté');
            return;
        }
        
        // Récupérer les valeurs des champs
        const username = document.getElementById('profileUsername')?.value.trim();
        const email = document.getElementById('profileEmail')?.value.trim();
        const displayName = document.getElementById('profileDisplayName')?.value.trim();
        const bio = document.getElementById('profileBio')?.value.trim();
        const selectedAvatar = document.getElementById('profileCurrentAvatar')?.dataset.selectedAvatar;
        
        // Debug pour vérifier l'avatar sélectionné
        console.log('🔍 Debug sauvegarde profil:', {
            currentAvatar: currentUser.avatar,
            selectedAvatar: selectedAvatar,
            hasDataset: !!document.getElementById('profileCurrentAvatar')?.dataset,
            datasetValue: document.getElementById('profileCurrentAvatar')?.dataset?.selectedAvatar
        });
        
        // Validation
        if (!username || username.length < 3 || username.length > 20) {
            this.showError('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères');
            return;
        }
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showError('Email invalide');
            return;
        }
        
        if (displayName && displayName.length > 30) {
            this.showError('Le nom d\'affichage ne peut pas dépasser 30 caractères');
            return;
        }
        
        if (bio && bio.length > 200) {
            this.showError('La bio ne peut pas dépasser 200 caractères');
            return;
        }
        
        // Sauvegarder les modifications
        const updatedUser = {
            ...currentUser,
            username,
            email,
            displayName: displayName || username,
            bio,
            avatar: selectedAvatar || currentUser.avatar,
            lastModified: new Date().toISOString()
        };
        
        // Mettre à jour via le système d'authentification
        if (HeroesAuth.updateUserProfile) {
            const result = HeroesAuth.updateUserProfile(updatedUser);
            if (result.success) {
                this.showSuccess('Profil mis à jour avec succès !');
                document.querySelector('.user-profile-modal')?.remove();
                
                // Mettre à jour l'affichage de la carte utilisateur
                this.updateUserCardDisplay();
            } else {
                this.showError(result.error || 'Erreur lors de la sauvegarde');
            }
        } else {
            this.showError('Fonction de mise à jour non disponible');
        }
    }
    
    /**
     * Mettre à jour l'affichage de la carte utilisateur
     */
    updateUserCardDisplay() {
        const currentUser = HeroesAuth.getCurrentUser();
        if (!currentUser) return;
        
        // Mettre à jour le nom
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement) {
            usernameElement.textContent = currentUser.displayName || currentUser.username;
        }
        
        // Mettre à jour l'avatar
        const userInitials = document.getElementById('userInitials');
        if (userInitials) {
            if (currentUser.avatar) {
                userInitials.style.display = 'none';
                userInitials.parentElement.style.backgroundImage = `url('assets/avatars/${currentUser.avatar}')`;
                userInitials.parentElement.style.backgroundSize = 'cover';
                userInitials.parentElement.style.backgroundPosition = 'center';
            } else {
                userInitials.textContent = (currentUser.displayName || currentUser.username).charAt(0).toUpperCase();
                userInitials.style.display = 'flex';
                userInitials.parentElement.style.backgroundImage = 'none';
            }
        }
        
        // Mettre à jour l'email
        const emailElement = document.getElementById('userEmail');
        if (emailElement) {
            emailElement.textContent = currentUser.email;
        }
    }
}

export const uiManager = new UIManager();