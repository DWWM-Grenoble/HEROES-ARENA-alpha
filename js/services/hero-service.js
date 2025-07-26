// Service pour la gestion des héros
import { AppState } from '../core/config.js';

export class HeroService {
    constructor(dataManager, authSystem, uiManager) {
        this.data = dataManager;
        this.auth = authSystem;
        this.ui = uiManager;
    }

    /**
     * Créer un nouveau héros
     */
    async createHero(heroData) {
        try {
            // Vérifier l'authentification
            if (!this.auth.isAuthenticated()) {
                this.ui.showError('Vous devez être connecté pour créer un héros');
                this.auth.showAuthScreen();
                return { success: false, error: 'Non authentifié' };
            }

            // Valider les données
            const validation = this.validateHeroData(heroData);
            if (!validation.valid) {
                this.ui.showError(validation.error);
                return { success: false, error: validation.error };
            }

            // Créer le héros
            const result = await this.data.addHero(heroData);

            if (result.success) {
                this.ui.showSuccess('Héros créé avec succès !');
                
                // Sauvegardes
                await this.data.saveHeroes();
                this.auth.saveUserHeroes(AppState.heroes);
                this.auth.refreshUserStats();
                
                // Mettre à jour l'interface
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
                
                return { success: true, hero: result.hero };
            } else {
                this.ui.showError(result.error);
                return result;
            }
        } catch (error) {
            console.error('Erreur lors de la création du héros:', error);
            this.ui.showError('Erreur lors de la création du héros');
            return { success: false, error: error.message };
        }
    }

    /**
     * Supprimer un héros
     */
    async deleteHero(heroIdOrIndex) {
        try {
            const heroInfo = this.findHero(heroIdOrIndex);
            if (!heroInfo.found) {
                throw new Error('Héros introuvable');
            }

            const { hero, index } = heroInfo;
            console.log(`🗑️ Suppression du héros: ${hero.nom} (ID: ${hero.id}, Index: ${index})`);

            const result = await this.data.deleteHero(index);

            if (result.success) {
                this.auth.saveUserHeroes(AppState.heroes);
                this.ui.showSuccess(`${hero.nom} a été supprimé`);
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
                this.auth.refreshUserStats();
                
                console.log(`✅ Héros ${hero.nom} supprimé avec succès`);
                return { success: true };
            } else {
                throw new Error(result.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.ui.showError('Impossible de supprimer le héros: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Soigner un héros
     */
    async healHero(index) {
        try {
            const hero = AppState.heroes[index];
            if (!hero) {
                throw new Error('Héros introuvable');
            }

            if (hero.pv >= hero.pvMax) {
                this.ui.showError(`${hero.nom} a déjà tous ses PV !`);
                return { success: false, error: 'Héros déjà en pleine santé' };
            }

            hero.heal();
            await this.data.saveHeroes();
            this.auth.saveUserHeroes(AppState.heroes);
            this.ui.displayHeroes();
            this.ui.showSuccess(`${hero.nom} a été complètement soigné !`);
            
            return { success: true };
        } catch (error) {
            console.error('Erreur lors du soin:', error);
            this.ui.showError('Impossible de soigner le héros');
            return { success: false, error: error.message };
        }
    }

    /**
     * Renommer un héros
     */
    async renameHero(index, newName) {
        try {
            const hero = AppState.heroes[index];
            if (!hero) {
                throw new Error('Héros introuvable');
            }

            // Valider le nouveau nom
            const validation = this.validateHeroName(newName);
            if (!validation.valid) {
                this.ui.showError(validation.error);
                return { success: false, error: validation.error };
            }

            const oldName = hero.nom;
            hero.nom = newName.trim();
            hero.updatedAt = new Date().toISOString();

            await this.data.saveHeroes();
            this.auth.saveUserHeroes(AppState.heroes);
            this.ui.displayHeroes();
            this.ui.updateFighterSelectors();
            this.ui.showSuccess(`Héros renommé de "${oldName}" en "${hero.nom}" !`);
            
            return { success: true };
        } catch (error) {
            console.error('Erreur lors du renommage:', error);
            this.ui.showError('Impossible de renommer le héros');
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtenir les détails d'un héros
     */
    getHeroDetails(index) {
        const hero = AppState.heroes[index];
        if (!hero) {
            return { found: false, error: 'Héros introuvable' };
        }

        return {
            found: true,
            hero,
            index,
            stats: {
                totalPower: hero.force + hero.agility + hero.magic + hero.defense,
                healthPercent: (hero.pv / hero.pvMax) * 100,
                xpToNext: 100 - (hero.xp % 100),
                totalCombats: hero.victoires + hero.defaites
            }
        };
    }

    /**
     * Trouver un héros par ID ou index
     */
    findHero(heroIdOrIndex) {
        let heroIndex = -1;
        let hero = null;

        if (typeof heroIdOrIndex === 'number') {
            heroIndex = heroIdOrIndex;
            hero = AppState.heroes[heroIndex];
        } else {
            heroIndex = AppState.heroes.findIndex(h => h.id === heroIdOrIndex);
            hero = heroIndex !== -1 ? AppState.heroes[heroIndex] : null;
        }

        return {
            found: hero !== null && heroIndex !== -1,
            hero,
            index: heroIndex
        };
    }

    /**
     * Valider les données d'un héros
     */
    validateHeroData(heroData) {
        if (!heroData.nom || !heroData.nom.trim()) {
            return { valid: false, error: 'Veuillez entrer un nom pour le héros' };
        }

        const nameValidation = this.validateHeroName(heroData.nom);
        if (!nameValidation.valid) {
            return nameValidation;
        }

        return { valid: true };
    }

    /**
     * Valider le nom d'un héros
     */
    validateHeroName(name) {
        if (!name || !name.trim()) {
            return { valid: false, error: 'Le nom ne peut pas être vide' };
        }

        const trimmedName = name.trim();
        if (trimmedName.length > 20) {
            return { valid: false, error: 'Le nom ne peut pas dépasser 20 caractères' };
        }

        if (trimmedName.length < 1) {
            return { valid: false, error: 'Le nom ne peut pas être vide' };
        }

        return { valid: true };
    }

    /**
     * Créer des héros de démonstration
     */
    async createDemoHeroes() {
        const demoHeroes = [
            { nom: 'Aragorn', classe: 'Guerrier', force: 35, agility: 25, magic: 15, defense: 25, avatar: 'warrior/warrior1.webp' },
            { nom: 'Gandalf', classe: 'Mage', force: 20, agility: 20, magic: 35, defense: 25, avatar: 'mage/mage1.webp' },
            { nom: 'Legolas', classe: 'Archer', force: 25, agility: 35, magic: 20, defense: 20, avatar: 'archer/archer1.webp' },
            { nom: 'Gimli', classe: 'Paladin', force: 30, agility: 15, magic: 20, defense: 35, avatar: 'paladin/paladin1.webp' }
        ];

        let created = 0;
        for (const heroData of demoHeroes) {
            const result = await this.createHero(heroData);
            if (result.success) {
                created++;
            }
        }

        if (created > 0) {
            this.ui.showSuccess(`${created} héros de démo créés !`);
        }

        return { success: true, created };
    }
}