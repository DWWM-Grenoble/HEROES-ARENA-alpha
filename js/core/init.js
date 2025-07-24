// Initialisation globale pour Heroes Arena
// Ce fichier charge l'application et expose les méthodes globalement

// Fonction d'initialisation asynchrone

export async function initHeroesArena() {
    try {
        console.log('🚀 Démarrage de Heroes Arena...');

        // Importer les modules
        const { AppState } = await import('./core/config.js');
        const { Hero } = await import('./core/classes.js');
        const { uiManager } = await import('./modules/ui.js');
        const { dataManager } = await import('./modules/data.js');
        const { combatSystem } = await import('./modules/combat.js');
        const { authSystem } = await import('./modules/auth.js');

        // Exposer Hero globalement pour le système d'authentification
        window.Hero = Hero;

        // Créer l'application
        const app = {
            ui: uiManager,
            data: dataManager,
            combat: combatSystem,
            auth: authSystem,

            // Méthodes d'interface
            showSection(sectionName) {
                return this.ui.showSection(sectionName);
            },
            
            showAvatarCategory(category) {
                return this.ui.showAvatarCategory(category);
            },

            updateClassInfo() {
                return this.ui.updateClassInfo();
            },

            updateStats() {
                return this.ui.updateStats();
            },

            randomStats() {
                return this.ui.randomStats();
            },

            filterHeroes(filter) {
                return this.ui.filterHeroes(filter);
            },

            updateFighters() {
                return this.ui.updateFighters();
            },

            // Méthodes de gestion des héros

            async createHeroFromForm() {
                try {
                    // Vérifier l'authentification
                    if (!this.auth.isAuthenticated()) {
                        this.ui.showError('Vous devez être connecté pour créer un héros');
                        this.auth.showAuthScreen();
                        return false;
                    }

                    const nom = document.getElementById('heroName')?.value?.trim();
                    const classe = document.getElementById('heroClass')?.value;
                    const stats = this.ui.updateStats();

                    if (!nom) {
                        this.ui.showError('Veuillez entrer un nom pour le héros');
                        return false;
                    }

                    const result = await this.data.addHero({
                        nom,
                        avatar: this.ui.selectedAvatar,
                        classe,
                        ...stats
                    });

                    if (result.success) {
                        this.ui.showSuccess('Héros créé avec succès !');

                        // Debug : vérifier que le héros est bien dans AppState
                        console.log('Héros créé:', result.hero);
                        console.log('Total héros:', AppState.heroes.length);

                        // Forcer une sauvegarde immédiate
                        await this.data.saveHeroes();

                        // Sauvegarder les héros pour l'utilisateur connecté
                        this.auth.saveUserHeroes(AppState.heroes);

                        // Mettre à jour les statistiques utilisateur
                        this.auth.refreshUserStats();

                        // Réinitialiser le formulaire
                        document.getElementById('heroName').value = '';
                        this.ui.randomStats();

                        // Afficher les héros et aller à la section héros
                        this.ui.displayHeroes();
                        this.ui.updateFighterSelectors();
                        this.ui.showSection('heroes');

                        return true;
                    } else {
                        this.ui.showError(result.error);
                        return false;
                    }
                } catch (error) {
                    console.error('Erreur lors de la création du héros:', error);
                    this.ui.showError('Erreur lors de la création du héros');
                    return false;
                }
            },

            async deleteHero(heroIdOrIndex) {
                try {
                    let heroIndex = -1;
                    let hero = null;

                    // Si c'est un nombre, c'est probablement un index
                    if (typeof heroIdOrIndex === 'number') {
                        heroIndex = heroIdOrIndex;
                        hero = AppState.heroes[heroIndex];
                    } else {
                        // Sinon, chercher par ID
                        heroIndex = AppState.heroes.findIndex(h => h.id === heroIdOrIndex);
                        hero = heroIndex !== -1 ? AppState.heroes[heroIndex] : null;
                    }

                    if (!hero || heroIndex === -1) {
                        throw new Error('Héros introuvable');
                    }

                    console.log(`🗑️ Suppression du héros: ${hero.nom} (ID: ${hero.id}, Index: ${heroIndex})`);

                    const result = await this.data.deleteHero(heroIndex);

                    if (result.success) {
                        this.auth.saveUserHeroes(AppState.heroes);
                        this.ui.showSuccess(`${hero.nom} a été supprimé`);
                        this.ui.displayHeroes();
                        this.ui.updateFighterSelectors();
                        this.auth.refreshUserStats();

                        console.log(`✅ Héros ${hero.nom} supprimé avec succès`);
                    } else {
                        throw new Error(result.error || 'Erreur lors de la suppression');
                    }

                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    this.ui.showError('Impossible de supprimer le héros: ' + error.message);
                }
            },

            async healHero(index) {
                try {
                    const hero = AppState.heroes[index];
                    if (!hero) {
                        throw new Error('Héros introuvable');
                    }

                    if (hero.pv >= hero.pvMax) {
                        this.ui.showError(`${hero.nom} a déjà tous ses PV !`);
                        return;
                    }

                    hero.heal();
                    await this.data.saveHeroes();
                    this.auth.saveUserHeroes(AppState.heroes);
                    this.ui.displayHeroes();
                    this.ui.showSuccess(`${hero.nom} a été complètement soigné !`);
                } catch (error) {
                    console.error('Erreur lors du soin:', error);
                    this.ui.showError('Impossible de soigner le héros');
                }
            },

            async renameHero(index) {
                try {
                    const hero = AppState.heroes[index];
                    if (!hero) {
                        throw new Error('Héros introuvable');
                    }

                    const newName = prompt(`Nouveau nom pour ${hero.nom}:`, hero.nom);
                    if (!newName || !newName.trim() || newName.trim() === hero.nom) {
                        return; // Annulation ou pas de changement
                    }

                    const trimmedName = newName.trim();
                    if (trimmedName.length > 20) {
                        this.ui.showError('Le nom ne peut pas dépasser 20 caractères');
                        return;
                    }

                    if (trimmedName.length < 1) {
                        this.ui.showError('Le nom ne peut pas être vide');
                        return;
                    }

                    hero.nom = trimmedName;
                    hero.updatedAt = new Date().toISOString();

                    await this.data.saveHeroes();
                    this.auth.saveUserHeroes(AppState.heroes);
                    this.ui.displayHeroes();
                    this.ui.updateFighterSelectors();
                    this.ui.showSuccess(`Héros renommé en "${trimmedName}" !`);
                } catch (error) {
                    console.error('Erreur lors du renommage:', error);
                    this.ui.showError('Impossible de renommer le héros');
                }
            },
            
            showHeroDetails(index) {
                const hero = AppState.heroes[index];
                if (!hero) return;

                // Créer une modal détaillée avec les informations du héros
                const modal = document.createElement('div');
                modal.className = 'modal-overlay hero-details-modal';

                const healthPercent = (hero.pv / hero.pvMax) * 100;
                const healthColor = healthPercent > 75 ? '#10b981' :
                    healthPercent > 50 ? '#f59e0b' :
                    healthPercent > 25 ? '#f97316' : '#ef4444';

                modal.innerHTML = `
                <div class="modal-content hero-details-content">
                    <div class="modal-header">
                        <div class="hero-avatar-large">
                            <img src="images/${hero.avatar}" alt="${hero.nom}">
                        </div>
                        <div class="hero-details-title">
                            <h2>${hero.nom}</h2>
                            <div class="hero-class-badge">${hero.classe}</div>
                            <div class="hero-level-display">Niveau ${hero.niveau}</div>
                            <div class="hero-badge-display">${hero.getBadgeText()}</div>
                        </div>
                        <button class="modal-close" data-action="close">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="hero-details-grid">
                            <div class="stats-section">
                                <h3>Caractéristiques</h3>
                                <div class="stat-detail">
                                    <span class="stat-icon">⚔️</span>
                                    <span class="stat-name">Force</span>
                                    <span class="stat-value">${hero.force}</span>
                                </div>
                                <div class="stat-detail">
                                    <span class="stat-icon">🏃‍♂️</span>
                                    <span class="stat-name">Agilité</span>
                                    <span class="stat-value">${hero.agility}</span>
                                </div>
                                <div class="stat-detail">
                                    <span class="stat-icon">🔮</span>
                                    <span class="stat-name">Magie</span>
                                    <span class="stat-value">${hero.magic}</span>
                                </div>
                                <div class="stat-detail">
                                    <span class="stat-icon">🛡️</span>
                                    <span class="stat-name">Défense</span>
                                    <span class="stat-value">${hero.defense}</span>
                                </div>
                            </div>
                            <div class="progress-section">
                                <h3>Progression</h3>
                                <div class="xp-section">
                                    <div class="xp-header">
                                        <span>Expérience</span>
                                        <span class="xp-values">${hero.xp} XP</span>
                                    </div>
                                    <div class="xp-bar">
                                        <div class="xp-fill" style="width: ${((hero.xp % 100) / 100) * 100}%"></div>
                                        <div class="xp-text">${hero.xp % 100} / 100 XP</div>
                                    </div>
                                    <div class="level-info">
                                        <small>Niveau ${hero.niveau} • ${100 - (hero.xp % 100)} XP pour niveau ${hero.niveau + 1}</small>
                                    </div>
                                </div>
                                <div class="health-section">
                                    <span>Points de vie</span>
                                    <div class="health-bar-detail">
                                        <div class="health-fill" style="width: ${healthPercent}%; background-color: ${healthColor}"></div>
                                        <div class="health-text">${hero.pv}/${hero.pvMax}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="combat-section">
                                <h3>Palmarès</h3>
                                <div class="combat-stats">
                                    <div class="combat-stat victories">
                                        <span class="label">Victoires</span>
                                        <span class="value">${hero.victoires}</span>
                                    </div>
                                    <div class="combat-stat defeats">
                                        <span class="label">Défaites</span>
                                        <span class="value">${hero.defaites}</span>
                                    </div>
                                    <div class="combat-stat ratio">
                                        <span class="label">Ratio</span>
                                        <span class="value">${hero.getRatio()}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <h3>Actions</h3>
                        <div class="action-buttons">
                            <button class="action-btn heal-btn" data-action="heal" data-index="${index}">
                                <span class="action-icon">❤️</span>
                                <span class="action-text">
                                    <strong>Soigner</strong>
                                    <small>Restaure tous les PV</small>
                                </span>
                            </button>
                            
                            <button class="action-btn combat-btn" data-action="combat" data-index="${index}">
                                <span class="action-icon">⚔️</span>
                                <span class="action-text">
                                    <strong>Combat</strong>
                                    <small>Aller à l'arène</small>
                                </span>
                            </button>
                            
                            <button class="action-btn rename-btn" data-action="rename" data-index="${index}">
                                <span class="action-icon">✏️</span>
                                <span class="action-text">
                                    <strong>Renommer</strong>
                                    <small>Changer le nom</small>
                                </span>
                            </button>
                            
                            <button class="action-btn delete-btn danger" data-action="delete" data-index="${index}" data-hero-id="${hero.id}" data-hero-name="${hero.nom}">
                                <span class="action-icon">⚠️</span>
                                <span class="action-text">
                                    <strong>Supprimer définitivement</strong>
                                    <small>Cette action est irréversible</small>
                                </span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close-btn" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
                    </div>
                </div>
                `;

                document.body.appendChild(modal);

                // Empêcher le scroll du body quand le modal est ouvert
                document.body.style.overflow = 'hidden';

                // Scroll automatique vers le modal avec animation fluide
                requestAnimationFrame(() => {
                    // Scroll vers le haut de la page d'abord pour centrer le modal
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });

                // Fonction pour fermer le modal
                const closeModal = () => {
                    document.body.style.overflow = ""; // Restaurer le scroll
                    modal.remove();
                };

                // Gestionnaire d'événements pour les actions
                modal.addEventListener('click', async (e) => {
                    // Fermer en cliquant à l'extérieur
                    if (e.target === modal) {
                        closeModal();
                        return;
                    }

                    // Gérer les boutons d'action
                    const actionBtn = e.target.closest('.action-btn');
                    if (actionBtn) {
                        const action = actionBtn.dataset.action;
                        const heroIndex = parseInt(actionBtn.dataset.index);

                        try {
                            switch (action) {
                                case 'heal':
                                    await this.healHero(heroIndex);
                                    closeModal();
                                    break;
                                case 'combat':
                                    closeModal();
                                    this.showSection('arena');
                                    break;
                                case 'rename':
                                    await this.renameHero(heroIndex);
                                    closeModal();
                                    break;
                                case 'delete':
                                    const heroId = actionBtn.dataset.heroId;
                                    const heroName = actionBtn.dataset.heroName;
                                    
                                    // Confirmation avec meilleure UX
                                    const confirmMessage = `⚠️ ATTENTION - SUPPRESSION DÉFINITIVE\n\n` +
                                        `Voulez-vous vraiment supprimer ${heroName} ?\n\n` +
                                        `Cette action est IRRÉVERSIBLE et supprimera :\n` +
                                        `• Son historique de combat\n` +
                                        `• Ses victoires et défaites\n\n` +
                                        `• Tapez "SUPPRIMER" pour confirmer:`;

                                    const confirmation = prompt(confirmMessage);
                                    if (confirmation === "SUPPRIMER") {
                                        try {
                                            console.log(`🗑️ Confirmation reçue pour supprimer le héros ID: ${heroId}`);
                                            await this.deleteHero(heroId);
                                            closeModal();
                                        } catch (error) {
                                            console.error('Erreur lors de la suppression depuis la modal:', error);
                                            this.ui.showError('Erreur lors de la suppression');
                                        }
                                    } else if (confirmation !== null) {
                                        this.ui.showError('Suppression annulée - confirmation incorrecte');
                                    }

                                    break;
                            }
                        } catch (error) {
                            console.error('Erreur lors de l\'action:', error);
                            this.ui.showError('Une erreur est survenue lors de l\'action');
                        }
                    }

                    // Fermer avec le bouton close
                    if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-close-btn')) {
                        closeModal();
                    }
                });
            },

            // Méthodes de combat
            async startCombat() {
                if (!AppState.fighter1 || !AppState.fighter2) {
                    this.ui.showError('Veuillez sélectionner deux combattants');
                    return;
                }

                if (AppState.fighter1.id === AppState.fighter2.id) {
                    this.ui.showError('Un héros ne peut pas combattre contre lui-même');
                    return;
                }

                try {
                    // Désactiver le bouton de combat
                    const fightBtn = document.getElementById('fightBtn');
                    if (fightBtn) {
                        fightBtn.disabled = true;
                    }
                    
                    // Nettoyer le log de combat
                    this.ui.clearCombatLog();

                    // Démarrer le combat
                    const result = await this.combat.startCombat(AppState.fighter1, AppState.fighter2);

                    if (result.success) {
                        console.log('🏆 Combat terminé, sauvegarde des données...');

                        // Sauvegarder automatiquement dans le système de données
                        await this.data.saveHeroes();

                        // Sauvegarder spécifiquement pour l'utilisateur connecté (double sécurité)
                        this.auth.saveUserHeroes(AppState.heroes);

                        // Mettre à jour l'affichage
                        this.ui.displayHeroes();
                        this.ui.updateFighterDisplay();

                        // Mettre à jour les statistiques utilisateur
                        this.auth.refreshUserStats();

                        console.log('✅ Données sauvegardées après combat');
                    } else {
                        this.ui.showError(result.error);
                    }
                } catch (error) {
                    console.error('Erreur lors du démarrage du combat:', error);
                    this.ui.showError('Erreur lors du démarrage du combat');
                } finally {
                    // Réactiver le bouton
                    setTimeout(() => {
                        const fightBtn = document.getElementById('fightBtn');
                        if (fightBtn) fightBtn.disabled = false;
                    }, 1000);
                }
            },

            resetArena() {
                // Réinitialiser les sélections
                const selectors = [
                    document.getElementById('fighter1Selector'),
                    document.getElementById('fighter2Selector')
                ];

                selectors.forEach(select => {
                    if (select) select.value = '';
                });

                // Réinitialiser l'état
                AppState.fighter1 = null;
                AppState.fighter2 = null;

                // Arrêter le combat en cours
                this.combat.stopCombat();

                // Réinitialiser les effets visuels
                this.ui.resetCombatEffects();

                // Mettre à jour l'affichage
                this.ui.updateFighters();
                this.ui.clearCombatLog();

                // Ajouter un message de bienvenue
                this.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat.', 'info');
            },

            stopCombat() {
                this.combat.stopCombat();

                const fightBtn = document.getElementById('fightBtn');
                if (fightBtn) fightBtn.disabled = false;
            },

            // Méthodes d'import/export
            async exportData() {
                const result = await this.data.exportToFile();

                if (result.success) {
                    this.ui.showSuccess(`Export réussi: ${result.fileName}`);
                } else {
                    this.ui.showError(result.error);
                }
            },

            async loadData() {
                // Charger les héros de l'utilisateur connecté
                if (this.auth.isAuthenticated()) {
                    try {
                        const userHeroes = this.auth.getUserHeroes();
                        AppState.heroes = userHeroes || [];

                        console.log('✅ Héros chargés avec méthodes:', AppState.heroes);

                        this.ui.showSuccess(`${AppState.heroes.length} héros chargés`);
                        this.ui.displayHeroes();
                        this.ui.updateFighterSelectors();

                    } catch (error) {
                        console.error('✖️ Erreur lors du chargement des héros:', error);
                        AppState.heroes = [];
                        this.ui.showError('Erreur lors du chargement des héros');
                    }
                } else {
                    // Si pas connecté, vider les héros et rediriger vers l'authentification
                    AppState.heroes = [];
                    this.auth.showAuthScreen();
                }
            },

            async clearAllData() {
                if (confirm('Êtes-vous sûr de vouloir supprimer tous les héros ?')) {
                    const result = await this.data.clearAllHeroes();

                    if (result.success) {
                        AppState.heroes = [];
                        this.ui.showSuccess(`${result.count} héros supprimés`);
                        this.ui.displayHeroes();
                        this.ui.updateFighterSelectors();
                        this.resetArena();
                    } else {
                        this.ui.showError(result.error);
                    }
                }
            },

            createDemoHeroes() {
                // Créer des héros de démonstration
                const demoHeroes = [
                    { nom: 'Aragorn', classe: 'Guerrier', force: 35, agility: 25, magic: 15, defense: 25, avatar: 'aragorn.png' },
                    { nom: 'Gandalf', classe: 'Mage', force: 20, agility: 20, magic: 35, defense: 25, avatar: 'gandalf.png' },
                    { nom: 'Legolas', classe: 'Archer', force: 25, agility: 35, magic: 20, defense: 20, avatar: 'legolas.png' },
                    { nom: 'Gimli', classe: 'Paladin', force: 30, agility: 15, magic: 20, defense: 35, avatar: 'gimli.png' }
                ];

                let created = 0;

                demoHeroes.forEach(async (heroData) => {
                    const result = await this.data.addHero(heroData);
                    if (result.success) {
                        created++;
                        if (created === demoHeroes.length) {
                            this.ui.showSuccess(`${created} héros de démo créés`);
                            this.ui.displayHeroes();
                            this.ui.updateFighterSelectors();
                        }
                    }
                });
            },

            // Méthode de debug
            debug() {
                console.log('=== DEBUG HEROES ARENA ===');
                console.log('AppState.heroes:', AppState.heroes);
                console.log('localStorage heroes:', localStorage.getItem('heroesArena_heroes'));
                console.log('HeroesArena object:', window.HeroesArena);
                console.log('UI Manager:', this.ui);
                console.log('Data Manager:', this.data);
                console.log('========================');
            }
        };

        // Initialiser l'application
        console.log('🔄️ Vérification de l\'authentification');

        // Charger les héros de l'utilisateur connecté si authentifié
        if (app.auth.isAuthenticated()) {
            console.log('✅ Utilisateur connecté, chargement des héros...');
            await app.loadData();
        } else {
            console.log('🔐 Aucun utilisateur connecté, affichage de l\'écran d\'authentification');
            AppState.heroes = [];
        }

        await app.ui.initialize();

        // Configurer le combat
        app.combat.onLogUpdate = (entry) => {
            app.ui.addLogEntry(entry.message, entry.type);
        };

        // Configurer la fin de combat
        app.combat.onCombatEnd = (result) => {
            app.ui.showCombatEndModal(result);

            // Forcer la mise à jour de l'affichage des héros
            setTimeout(() => {
                app.ui.forceUpdate();
            }, 500);
        };

        // Démarrer la sauvegarde automatique
        app.data.startAutoSave();

        // Afficher l'interface initiale
        app.ui.displayHeroes();
        app.ui.updateFighterSelectors();
        app.ui.addLogEntry('Bienvenue dans Heroes Arena ! Sélectionnez deux héros pour commencer le combat.', 'info');

        // Exposer l'objet app globalement immédiatement
        window.HeroesArena = app;
        window.app = app; // Pour debug

        // Créer des fonctions globales simples pour les actions des héros
        window.showHeroDetailsNow = function(index) {
            console.log('🔍 showHeroDetailsNow appelé avec index:', index);
            console.log('🔍 app disponible:', !!app);
            console.log('🔍 app.showHeroDetails disponible:', !!(app && app.showHeroDetails));
            console.log('🔍 AppState.heroes.length:', AppState.heroes?.length || 0);

            try {
                if (app && app.showHeroDetails) {
                    console.log('✅ Utilisation de app.showHeroDetails');
                    app.showHeroDetails(index);
                } else {
                    console.log('📱 Utilisation de la méthode de fallback');
                    showHeroDetailsFallback(index);
                }
            } catch (error) {
                console.error('❌ Erreur dans showHeroDetailsNow:', error);
                console.log('🔄️ Tentative avec fallback après erreur');
                showHeroDetailsFallback(index);
            }
        };

        window.deleteHeroNow = function(heroIdOrIndex) {
            console.log('🗑️ deleteHeroNow appelé avec:', heroIdOrIndex);

            // Trouver le héros pour afficher son nom
            let hero = null;
            if (typeof heroIdOrIndex === 'number') {
                hero = AppState.heroes[heroIdOrIndex];
            } else {
                hero = AppState.heroes.find(h => h.id === heroIdOrIndex);
            }

            const heroName = hero ? hero.nom : 'ce héros';

            if (confirm(`⚠️ Supprimer définitivement ${heroName} ?\n\nCette action est irréversible`)) {
                try {
                    if (app && app.deleteHero) {
                        app.deleteHero(heroIdOrIndex);
                    } else {
                        console.error('❌ Méthode deleteHero non disponible');
                    }
                } catch (error) {
                    console.error('❌ Erreur dans deleteHeroNow:', error);
                }
            }
        };

        // Fonction de fallback pour afficher les détails
        function showHeroDetailsFallback(index) {
            const hero = AppState.heroes[index];
            if (!hero) {
                alert('Héros introuvable ! Index: ' + index + ', Total héros: ' + (AppState.heroes?.length || 0));
                console.log('🔍 Debug AppState.heroes:', AppState.heroes);
                return;
            }

            // Créer une modal simple directement
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #1e293b, #334155);
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    color: white;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                ">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0 0 10px 0; color: #e2e8f0;">${hero.nom}</h2>
                        <div style="background: #3b82f6; color: white; padding: 6px 16px; border-radius: 20px; display: inline-block; margin: 5px;">${hero.classe}</div>
                        <div style="background: #fbbf24; color: #1f2937; padding: 6px 16px; border-radius: 20px; display: inline-block; margin: 5px;">Niveau ${hero.niveau}</div>
                        <div style="color: #fbbf24; margin-top: 5px;">${hero.getBadgeText()}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h3 style="margin: 0 0 15px 0; color: #e2e8f0; font-size: 1.1rem;">Caractéristiques</h3>
                            <div style="margin: 8px 0;">⚔️ Force: <strong>${hero.force}</strong></div>
                            <div style="margin: 8px 0;">🏃‍♂️ Agilité: <strong>${hero.agility}</strong></div>
                            <div style="margin: 8px 0;">🔮 Magie: <strong>${hero.magic}</strong></div>
                            <div style="margin: 8px 0;">🛡️ Défense: <strong>${hero.defense}</strong></div>
                        </div>

                        <div>
                            <h3 style="margin: 0 0 15px 0; color: #e2e8f0; font-size: 1.1rem;">Progression</h3>
                            <div style="margin: 8px 0;">🎖️ Niveau: <strong style="color: #fbbf24;">${hero.niveau}</strong></div>
                            <div style="margin: 8px 0;">⭐️ Expérience: <strong style="color: #fbbf24;">${hero.xp} XP</strong><br><small style="color: #94a3b8;">(${100 - (hero.xp % 100)} XP pour niveau ${hero.niveau + 1})</small></div>
                            <div style="margin: 8px 0;">❤️ Vie: <strong>${hero.pv}/${hero.pvMax}</strong></div>
                            <div style="margin: 8px 0;">🏆 Victoires: <strong style="color: #10b981;">${hero.victoires}</strong></div>
                            <div style="margin: 8px 0;">💀 Défaites: <strong style="color: #ef4444;">${hero.defaites}</strong></div>
                            <div style="margin: 8px 0;">📊 Ratio: <strong style="color: #3b82f6;">${hero.getRatio()}%</strong></div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Fermer</button>
                        <button onclick="if(confirm('⚠️ Supprimer définitivement ce héros ?\\nCette action est irréversible')) { window.deleteHeroNow(${index}); this.closest('div[style*=\"position: fixed\"]').remove(); }" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.9)); color: #fecaca; border: 1px solid rgba(239, 68, 68, 0.4); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);" onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.3)'" onmouseout="this.style.transform = ''; this.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)'">⚠️ Supprimer</button>
                    </div>
                </div>
            `;

            // Fermer en cliquant à l'extérieur
            modal.onclick = function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };

            document.body.appendChild(modal);
        }

        console.log('✅ Heroes Arena initialisé avec succès');
        console.log('📱 Objet global HeroesArena exposé');

        return app;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
    }
}

// La fonction est exportée via export en haut du fichier