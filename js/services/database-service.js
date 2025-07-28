// Service pour interfacer avec l'API MongoDB Heroes Arena
class DatabaseService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.currentUser = null;
        
        // Gestion des erreurs
        this.onError = null;
        
        console.log('🔗 Database Service initialisé');
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            console.log(`📡 API Request: ${defaultOptions.method} ${url}`);
            
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Erreur HTTP: ${response.status}`);
            }

            console.log('✅ API Response:', data.success);
            return data;

        } catch (error) {
            console.error('❌ API Error:', error.message);
            
            if (this.onError) {
                this.onError(error);
            }
            
            throw error;
        }
    }

    // ==================== GESTION DES UTILISATEURS ====================

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getUser(userId) {
        return await this.request(`/users/${userId}`);
    }

    async updateUser(userId, updateData) {
        return await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async getUserStats(userId) {
        return await this.request(`/users/${userId}/stats`);
    }

    async getUserRanking(limit = 50, criteria = 'victoires') {
        return await this.request(`/users/classement/global?limite=${limit}&critere=${criteria}`);
    }

    // ==================== GESTION DES HÉROS ====================

    async createHero(heroData) {
        return await this.request('/heroes', {
            method: 'POST',
            body: JSON.stringify(heroData)
        });
    }

    async getHero(heroId, ownerId = null) {
        const query = ownerId ? `?owner=${ownerId}` : '';
        return await this.request(`/heroes/${heroId}${query}`);
    }

    async getUserHeroes(userId) {
        return await this.request(`/heroes?owner=${userId}`);
    }

    async updateHero(heroId, ownerId, updateData) {
        return await this.request(`/heroes/${heroId}`, {
            method: 'PUT',
            body: JSON.stringify({ owner: ownerId, ...updateData })
        });
    }

    async deleteHero(heroId, ownerId) {
        return await this.request(`/heroes/${heroId}`, {
            method: 'DELETE',
            body: JSON.stringify({ owner: ownerId })
        });
    }

    async toggleHeroFavorite(heroId, ownerId) {
        return await this.request(`/heroes/${heroId}/favori`, {
            method: 'PATCH',
            body: JSON.stringify({ owner: ownerId })
        });
    }

    async healHero(heroId, ownerId) {
        return await this.request(`/heroes/${heroId}/heal`, {
            method: 'PATCH',
            body: JSON.stringify({ owner: ownerId })
        });
    }

    async getHeroRanking(limit = 50, classe = null) {
        const query = classe ? `?limite=${limit}&classe=${classe}` : `?limite=${limit}`;
        return await this.request(`/heroes/classement${query}`);
    }

    async getHeroCombatHistory(heroId, limit = 10) {
        return await this.request(`/heroes/${heroId}/combats?limite=${limit}`);
    }

    async searchHeroes(criteria, options = {}) {
        const params = new URLSearchParams();
        
        // Ajouter les critères de recherche
        Object.keys(criteria).forEach(key => {
            if (criteria[key] !== null && criteria[key] !== undefined) {
                params.append(key, criteria[key]);
            }
        });
        
        // Ajouter les options
        Object.keys(options).forEach(key => {
            if (options[key] !== null && options[key] !== undefined) {
                params.append(key, options[key]);
            }
        });

        return await this.request(`/heroes?${params.toString()}`);
    }

    // ==================== GESTION DES COMBATS ====================

    async createCombat(hero1Id, hero2Id, typeCombat = 'classique') {
        return await this.request('/combats', {
            method: 'POST',
            body: JSON.stringify({
                hero1Id,
                hero2Id,
                typeCombat
            })
        });
    }

    async getCombat(combatId, includeLog = false) {
        const query = includeLog ? '?includeLog=true' : '';
        return await this.request(`/combats/${combatId}${query}`);
    }

    async addCombatLog(combatId, logEntry) {
        return await this.request(`/combats/${combatId}/log`, {
            method: 'POST',
            body: JSON.stringify(logEntry)
        });
    }

    async updateCombatStats(combatId, stats) {
        return await this.request(`/combats/${combatId}/stats`, {
            method: 'PUT',
            body: JSON.stringify(stats)
        });
    }

    async finishCombat(combatId, winnerId, loserId, victoryType = 'ko') {
        return await this.request(`/combats/${combatId}/finish`, {
            method: 'POST',
            body: JSON.stringify({
                vainqueurId: winnerId,
                perdantId: loserId,
                typeVictoire: victoryType
            })
        });
    }

    async declareDraw(combatId) {
        return await this.request(`/combats/${combatId}/draw`, {
            method: 'POST'
        });
    }

    async interruptCombat(combatId, reason = 'interruption manuelle') {
        return await this.request(`/combats/${combatId}/interrupt`, {
            method: 'POST',
            body: JSON.stringify({ raison: reason })
        });
    }

    async getRecentCombats(limit = 10) {
        return await this.request(`/combats?limite=${limit}`);
    }

    async getUserCombatHistory(userId, options = {}) {
        const params = new URLSearchParams({ utilisateur: userId });
        
        Object.keys(options).forEach(key => {
            if (options[key] !== null && options[key] !== undefined) {
                params.append(key, options[key]);
            }
        });

        return await this.request(`/combats?${params.toString()}`);
    }

    async getHeroStats(heroId) {
        return await this.request(`/combats/hero/${heroId}/stats`);
    }

    // ==================== STATISTIQUES ====================

    async getGlobalStats() {
        return await this.request('/stats/global');
    }

    async getRankings() {
        return await this.request('/stats/classements');
    }

    async getActivityStats(period = '7d') {
        return await this.request(`/stats/activite?periode=${period}`);
    }

    async getPerformanceStats() {
        return await this.request('/stats/performances');
    }

    async searchStats(query, type = 'all') {
        const params = new URLSearchParams({ query, type });
        return await this.request(`/stats/search?${params.toString()}`);
    }

    // ==================== MÉTHODES SPÉCIFIQUES POUR L'APPLICATION ====================

    // Convertir un héros MongoDB en format de l'application actuelle
    convertHeroFromDB(dbHero) {
        return {
            id: dbHero._id,
            nom: dbHero.nom,
            classe: dbHero.classe,
            avatar: dbHero.avatar,
            force: dbHero.stats.force,
            agility: dbHero.stats.agility,
            magic: dbHero.stats.magic,
            defense: dbHero.stats.defense,
            pv: dbHero.pv,
            pvMax: dbHero.pvMax,
            niveau: dbHero.progression.niveau,
            xp: dbHero.progression.xp,
            victoires: dbHero.progression.victoires,
            defaites: dbHero.progression.defaites,
            
            // Méthodes héritées de l'ancienne classe Hero
            heal: function() {
                this.pv = this.pvMax;
                return this.pv;
            },
            
            takeDamage: function(damage) {
                this.pv = Math.max(0, this.pv - damage);
                return this.pv;
            },
            
            gainXp: function(xp) {
                this.xp += xp;
                const newLevel = Math.floor(this.xp / 100) + 1;
                if (newLevel > this.niveau) {
                    this.niveau = newLevel;
                    return true;
                }
                return false;
            },
            
            getBadgeText: function() {
                if (this.victoires >= 100) return 'Légende';
                if (this.victoires >= 50) return 'Maître';
                if (this.victoires >= 25) return 'Expert';
                if (this.victoires >= 10) return 'Vétéran';
                if (this.victoires >= 5) return 'Guerrier';
                return 'Novice';
            },
            
            getRatio: function() {
                const total = this.victoires + this.defaites;
                if (total === 0) return 0;
                return Math.round((this.victoires / total) * 100);
            }
        };
    }

    // Convertir plusieurs héros
    convertHeroesFromDB(dbHeroes) {
        return dbHeroes.map(hero => this.convertHeroFromDB(hero));
    }

    // Méthode pour synchroniser les héros existants avec la base de données
    async syncExistingHeroes(existingHeroes, userId) {
        try {
            console.log('🔄 Synchronisation des héros existants...');
            
            const syncedHeroes = [];
            
            for (const hero of existingHeroes) {
                // Créer le héros dans la base de données
                const heroData = {
                    owner: userId,
                    nom: hero.nom,
                    classe: hero.classe,
                    avatar: hero.avatar,
                    stats: {
                        force: hero.force,
                        agility: hero.agility,
                        magic: hero.magic,
                        defense: hero.defense
                    },
                    pv: hero.pv,
                    pvMax: hero.pvMax,
                    progression: {
                        niveau: hero.niveau || 1,
                        xp: hero.xp || 0,
                        victoires: hero.victoires || 0,
                        defaites: hero.defaites || 0
                    }
                };
                
                try {
                    const result = await this.createHero(heroData);
                    syncedHeroes.push(this.convertHeroFromDB(result.data));
                    console.log(`✅ Héros synchronisé: ${hero.nom}`);
                } catch (error) {
                    console.warn(`⚠️ Impossible de synchroniser ${hero.nom}:`, error.message);
                }
            }
            
            console.log(`🎉 ${syncedHeroes.length}/${existingHeroes.length} héros synchronisés`);
            return syncedHeroes;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation héros:', error);
            throw error;
        }
    }

    // Méthode pour vérifier la connexion à l'API
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/test`);
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Connexion API établie:', data.message);
                return true;
            } else {
                console.error('❌ Problème de connexion API:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ API inaccessible:', error.message);
            return false;
        }
    }

    // Méthode pour obtenir les statistiques de santé de l'API
    async getHealthStatus() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return await response.json();
        } catch (error) {
            console.error('❌ Impossible d\'obtenir le statut de santé:', error);
            return null;
        }
    }
}

// Instance globale
export const databaseService = new DatabaseService();

// Pour compatibilité avec l'ancien système
window.databaseService = databaseService;