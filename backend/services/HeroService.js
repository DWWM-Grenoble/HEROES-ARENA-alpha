const Hero = require('../models/Hero');
const User = require('../models/User');

class HeroService {
    
    // Créer un nouveau héros
    async creerHero(userId, heroData) {
        try {
            // Vérifier que l'utilisateur existe
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier le nom unique pour cet utilisateur
            const heroExistant = await Hero.findOne({ 
                owner: userId, 
                nom: heroData.nom 
            });
            
            if (heroExistant) {
                throw new Error('Vous avez déjà un héros avec ce nom');
            }

            // Créer le héros
            const hero = new Hero({
                owner: userId,
                ...heroData
            });

            await hero.save();
            
            console.log(`✅ Héros créé: ${hero.nom} (${hero.classe})`);
            return hero;
            
        } catch (error) {
            console.error('❌ Erreur création héros:', error.message);
            throw error;
        }
    }

    // Obtenir tous les héros d'un utilisateur
    async obtenirHerosUtilisateur(userId) {
        try {
            const heroes = await Hero.find({ owner: userId })
                .sort({ favori: -1, dateCreation: -1 });
            
            return heroes;
        } catch (error) {
            console.error('❌ Erreur récupération héros:', error.message);
            throw error;
        }
    }

    // Obtenir un héros par ID
    async obtenirHero(heroId, userId = null) {
        try {
            const query = { _id: heroId };
            if (userId) {
                query.owner = userId;
            }

            const hero = await Hero.findOne(query)
                .populate('owner', 'username profile.avatar');
            
            if (!hero) {
                throw new Error('Héros non trouvé');
            }

            return hero;
        } catch (error) {
            console.error('❌ Erreur récupération héros:', error.message);
            throw error;
        }
    }

    // Mettre à jour un héros
    async mettreAJourHero(heroId, userId, updateData) {
        try {
            // Ne pas autoriser la modification de certains champs
            const champsInterdits = ['owner', '_id', 'progression', 'combats'];
            champsInterdits.forEach(champ => {
                delete updateData[champ];
            });

            const hero = await Hero.findOneAndUpdate(
                { _id: heroId, owner: userId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!hero) {
                throw new Error('Héros non trouvé ou non autorisé');
            }

            console.log(`✅ Héros mis à jour: ${hero.nom}`);
            return hero;
        } catch (error) {
            console.error('❌ Erreur mise à jour héros:', error.message);
            throw error;
        }
    }

    // Supprimer un héros
    async supprimerHero(heroId, userId) {
        try {
            const hero = await Hero.findOneAndDelete({ 
                _id: heroId, 
                owner: userId 
            });

            if (!hero) {
                throw new Error('Héros non trouvé ou non autorisé');
            }

            console.log(`🗑️ Héros supprimé: ${hero.nom}`);
            return { message: 'Héros supprimé avec succès' };
        } catch (error) {
            console.error('❌ Erreur suppression héros:', error.message);
            throw error;
        }
    }

    // Marquer/démarquer un héros comme favori
    async toggleFavori(heroId, userId) {
        try {
            const hero = await Hero.findOne({ _id: heroId, owner: userId });
            
            if (!hero) {
                throw new Error('Héros non trouvé');
            }

            hero.favori = !hero.favori;
            await hero.save();

            return hero;
        } catch (error) {
            console.error('❌ Erreur toggle favori:', error.message);
            throw error;
        }
    }

    // Soigner un héros (restaurer PV)
    async soignerHero(heroId, userId) {
        try {
            const hero = await Hero.findOne({ _id: heroId, owner: userId });
            
            if (!hero) {
                throw new Error('Héros non trouvé');
            }

            hero.heal();
            await hero.save();

            return hero;
        } catch (error) {
            console.error('❌ Erreur soin héros:', error.message);
            throw error;
        }
    }

    // Obtenir le classement des héros
    async obtenirClassement(limite = 50, filtre = {}) {
        try {
            const query = { ...filtre };
            
            const classement = await Hero.find(query)
                .populate('owner', 'username profile.avatar')
                .sort({ 
                    'progression.victoires': -1, 
                    'progression.niveau': -1,
                    'progression.xp': -1
                })
                .limit(limite);

            return classement.map((hero, index) => ({
                rang: index + 1,
                hero: hero
            }));
        } catch (error) {
            console.error('❌ Erreur classement:', error.message);
            throw error;
        }
    }

    // Obtenir des statistiques globales
    async obtenirStatistiquesGlobales() {
        try {
            const stats = await Hero.aggregate([
                {
                    $group: {
                        _id: null,
                        totalHeros: { $sum: 1 },
                        niveauMoyen: { $avg: '$progression.niveau' },
                        totalVictoires: { $sum: '$progression.victoires' },
                        totalDefaites: { $sum: '$progression.defaites' },
                        puissanceMoyenne: { 
                            $avg: { 
                                $add: ['$stats.force', '$stats.agility', '$stats.magic', '$stats.defense'] 
                            } 
                        }
                    }
                }
            ]);

            const statsParClasse = await Hero.aggregate([
                {
                    $group: {
                        _id: '$classe',
                        nombre: { $sum: 1 },
                        niveauMoyen: { $avg: '$progression.niveau' },
                        victoires: { $sum: '$progression.victoires' }
                    }
                },
                { $sort: { nombre: -1 } }
            ]);

            return {
                global: stats[0] || {},
                parClasse: statsParClasse
            };
        } catch (error) {
            console.error('❌ Erreur statistiques:', error.message);
            throw error;
        }
    }

    // Rechercher des héros
    async rechercherHeros(criteres, options = {}) {
        try {
            const { 
                nom, 
                classe, 
                niveauMin, 
                niveauMax, 
                victoiresMin,
                proprietaire 
            } = criteres;

            const { 
                limit = 20, 
                skip = 0, 
                sort = { 'progression.victoires': -1 } 
            } = options;

            // Construire la requête
            const query = {};

            if (nom) {
                query.nom = { $regex: nom, $options: 'i' };
            }

            if (classe) {
                query.classe = classe;
            }

            if (niveauMin || niveauMax) {
                query['progression.niveau'] = {};
                if (niveauMin) query['progression.niveau'].$gte = niveauMin;
                if (niveauMax) query['progression.niveau'].$lte = niveauMax;
            }

            if (victoiresMin) {
                query['progression.victoires'] = { $gte: victoiresMin };
            }

            if (proprietaire) {
                query.owner = proprietaire;
            }

            const heroes = await Hero.find(query)
                .populate('owner', 'username')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Hero.countDocuments(query);

            return {
                heroes,
                total,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('❌ Erreur recherche:', error.message);
            throw error;
        }
    }

    // Mettre à jour après un combat
    async mettreAJourApresCombat(heroId, victoire, xpGagne, degatsSubis = 0) {
        try {
            const hero = await Hero.findById(heroId);
            if (!hero) {
                throw new Error('Héros non trouvé');
            }

            // Appliquer les dégâts
            if (degatsSubis > 0) {
                hero.takeDamage(degatsSubis);
            }

            // Mettre à jour selon le résultat
            const aGagneNiveau = victoire ? 
                hero.mettreAJourApresVictoire(xpGagne) : 
                hero.mettreAJourApresDefaite(xpGagne);

            await hero.save();

            return {
                hero,
                aGagneNiveau,
                nouveauNiveau: hero.progression.niveau
            };
        } catch (error) {
            console.error('❌ Erreur mise à jour post-combat:', error.message);
            throw error;
        }
    }

    // Obtenir l'historique des combats d'un héros
    async obtenirHistoriqueCombats(heroId, limite = 10) {
        try {
            const Combat = require('../models/Combat');
            
            const combats = await Combat.find({
                'combattants.hero': heroId,
                'resultat.statut': 'termine'
            })
            .populate('combattants.hero', 'nom classe')
            .sort({ dateDebut: -1 })
            .limit(limite);

            return combats;
        } catch (error) {
            console.error('❌ Erreur historique combats:', error.message);
            throw error;
        }
    }
}

module.exports = new HeroService();