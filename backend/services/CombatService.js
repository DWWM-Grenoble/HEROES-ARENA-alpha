const Combat = require('../models/Combat');
const Hero = require('../models/Hero');
const HeroService = require('./HeroService');

class CombatService {

    // Créer un nouveau combat
    async creerCombat(hero1Id, hero2Id, typeCombat = 'classique') {
        try {
            // Récupérer les héros
            const hero1 = await Hero.findById(hero1Id).populate('owner');
            const hero2 = await Hero.findById(hero2Id).populate('owner');

            if (!hero1 || !hero2) {
                throw new Error('Un ou plusieurs héros non trouvés');
            }

            if (hero1Id === hero2Id) {
                throw new Error('Un héros ne peut pas combattre contre lui-même');
            }

            // Vérifier que les héros peuvent combattre
            if (hero1.statut !== 'actif' || hero2.statut !== 'actif') {
                throw new Error('Un des héros n\'est pas disponible pour le combat');
            }

            // Créer le combat
            const combat = new Combat({
                combatId: Combat.genererIdCombat(),
                combattants: [
                    {
                        hero: hero1._id,
                        owner: hero1.owner._id,
                        nom: hero1.nom,
                        classe: hero1.classe,
                        position: 'gauche',
                        statsAuCombat: {
                            force: hero1.stats.force,
                            agility: hero1.stats.agility,
                            magic: hero1.stats.magic,
                            defense: hero1.stats.defense,
                            pv: hero1.pv,
                            pvMax: hero1.pvMax
                        }
                    },
                    {
                        hero: hero2._id,
                        owner: hero2.owner._id,
                        nom: hero2.nom,
                        classe: hero2.classe,
                        position: 'droite',
                        statsAuCombat: {
                            force: hero2.stats.force,
                            agility: hero2.stats.agility,
                            magic: hero2.stats.magic,
                            defense: hero2.stats.defense,
                            pv: hero2.pv,
                            pvMax: hero2.pvMax
                        }
                    }
                ],
                typeCombat: typeCombat
            });

            await combat.save();

            console.log(`⚔️ Combat créé: ${hero1.nom} vs ${hero2.nom}`);
            return combat;

        } catch (error) {
            console.error('❌ Erreur création combat:', error.message);
            throw error;
        }
    }

    // Ajouter une entrée au log de combat
    async ajouterLogEntry(combatId, entry) {
        try {
            const combat = await Combat.findOne({ combatId });
            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            combat.ajouterLogEntry(entry);
            await combat.save();

            return combat;
        } catch (error) {
            console.error('❌ Erreur ajout log:', error.message);
            throw error;
        }
    }

    // Terminer un combat
    async terminerCombat(combatId, vainqueurId, perdantId, typeVictoire = 'ko') {
        try {
            const combat = await Combat.findOne({ combatId })
                .populate('combattants.hero');

            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            if (combat.resultat.statut === 'termine') {
                throw new Error('Combat déjà terminé');
            }

            // Terminer le combat
            combat.terminerCombat(vainqueurId, perdantId, typeVictoire);

            // Calculer les récompenses
            const xpVainqueur = 50 + Math.floor(combat.statistiques.nombreRounds * 5);
            const xpPerdant = 20 + Math.floor(combat.statistiques.nombreRounds * 2);

            // Ajouter les récompenses
            combat.ajouterRecompense(vainqueurId, xpVainqueur);
            combat.ajouterRecompense(perdantId, xpPerdant);

            await combat.save();

            // Mettre à jour les héros
            const resultats = await Promise.all([
                HeroService.mettreAJourApresCombat(vainqueurId, true, xpVainqueur),
                HeroService.mettreAJourApresCombat(perdantId, false, xpPerdant)
            ]);

            console.log(`🏆 Combat terminé: ${combat.combatId}`);
            
            return {
                combat,
                vainqueur: resultats[0],
                perdant: resultats[1]
            };

        } catch (error) {
            console.error('❌ Erreur fin combat:', error.message);
            throw error;
        }
    }

    // Déclarer un match nul
    async declareMatchNul(combatId) {
        try {
            const combat = await Combat.findOne({ combatId });
            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            combat.declareMatchNul();
            
            // XP réduit pour match nul
            const xpMatchNul = 30;
            const hero1Id = combat.combattants[0].hero;
            const hero2Id = combat.combattants[1].hero;

            combat.ajouterRecompense(hero1Id, xpMatchNul);
            combat.ajouterRecompense(hero2Id, xpMatchNul);

            await combat.save();

            // Mettre à jour les héros (aucun gagnant)
            await Promise.all([
                HeroService.mettreAJourApresCombat(hero1Id, false, xpMatchNul),
                HeroService.mettreAJourApresCombat(hero2Id, false, xpMatchNul)
            ]);

            console.log(`🤝 Match nul: ${combat.combatId}`);
            return combat;

        } catch (error) {
            console.error('❌ Erreur match nul:', error.message);
            throw error;
        }
    }

    // Interrompre un combat
    async interrompreCombat(combatId, raison = 'interruption') {
        try {
            const combat = await Combat.findOne({ combatId });
            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            combat.resultat.statut = 'interrompu';
            combat.dateFin = new Date();
            combat.statistiques.duree = Math.floor((combat.dateFin - combat.dateDebut) / 1000);

            combat.ajouterLogEntry({
                round: combat.statistiques.nombreRounds,
                action: 'interruption',
                type: 'info',
                message: `Combat interrompu: ${raison}`
            });

            await combat.save();

            console.log(`⏹️ Combat interrompu: ${combat.combatId}`);
            return combat;

        } catch (error) {
            console.error('❌ Erreur interruption combat:', error.message);
            throw error;
        }
    }

    // Obtenir un combat par ID
    async obtenirCombat(combatId, includeLog = false) {
        try {
            const query = Combat.findOne({ combatId })
                .populate('combattants.hero', 'nom classe avatar progression')
                .populate('combattants.owner', 'username profile.avatar');

            if (!includeLog) {
                query.select('-log');
            }

            const combat = await query;
            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            return combat;
        } catch (error) {
            console.error('❌ Erreur récupération combat:', error.message);
            throw error;
        }
    }

    // Obtenir l'historique des combats d'un utilisateur
    async obtenirHistoriqueUtilisateur(userId, options = {}) {
        try {
            const { 
                limit = 20, 
                skip = 0, 
                statut = 'termine',
                typeCombat 
            } = options;

            const query = {
                'combattants.owner': userId,
                'resultat.statut': statut
            };

            if (typeCombat) {
                query.typeCombat = typeCombat;
            }

            const combats = await Combat.find(query)
                .populate('combattants.hero', 'nom classe avatar')
                .populate('combattants.owner', 'username')
                .select('-log') // Exclure les logs pour les performances
                .sort({ dateDebut: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Combat.countDocuments(query);

            return {
                combats,
                total,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('❌ Erreur historique utilisateur:', error.message);
            throw error;
        }
    }

    // Obtenir les statistiques d'un héros
    async obtenirStatistiquesHero(heroId) {
        try {
            const stats = await Combat.aggregate([
                {
                    $match: {
                        'combattants.hero': heroId,
                        'resultat.statut': 'termine'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCombats: { $sum: 1 },
                        victoires: {
                            $sum: {
                                $cond: [{ $eq: ['$resultat.vainqueur', heroId] }, 1, 0]
                            }
                        },
                        matchsNuls: {
                            $sum: {
                                $cond: ['$resultat.matchNul', 1, 0]
                            }
                        },
                        dureeTotal: { $sum: '$statistiques.duree' },
                        roundsTotal: { $sum: '$statistiques.nombreRounds' },
                        dureeMoyenne: { $avg: '$statistiques.duree' }
                    }
                }
            ]);

            const result = stats[0] || {
                totalCombats: 0,
                victoires: 0,
                matchsNuls: 0,
                dureeTotal: 0,
                roundsTotal: 0,
                dureeMoyenne: 0
            };

            // Calculer les défaites
            result.defaites = result.totalCombats - result.victoires - result.matchsNuls;
            
            // Calculer le ratio de victoires
            result.ratioVictoires = result.totalCombats > 0 ? 
                Math.round((result.victoires / result.totalCombats) * 100) : 0;

            return result;
        } catch (error) {
            console.error('❌ Erreur statistiques héros:', error.message);
            throw error;
        }
    }

    // Obtenir les combats récents
    async obtenirCombatsRecents(limite = 10) {
        try {
            const combats = await Combat.find({
                'resultat.statut': 'termine'
            })
            .populate('combattants.hero', 'nom classe avatar progression')
            .populate('combattants.owner', 'username profile.avatar')
            .select('-log')
            .sort({ dateFin: -1 })
            .limit(limite);

            return combats;
        } catch (error) {
            console.error('❌ Erreur combats récents:', error.message);
            throw error;
        }
    }

    // Mettre à jour les statistiques de combat
    async mettreAJourStatistiques(combatId, stats) {
        try {
            const combat = await Combat.findOne({ combatId });
            if (!combat) {
                throw new Error('Combat non trouvé');
            }

            // Mettre à jour les statistiques
            Object.assign(combat.statistiques, stats);
            
            await combat.save();
            return combat;
        } catch (error) {
            console.error('❌ Erreur maj statistiques:', error.message);
            throw error;
        }
    }

    // Obtenir les statistiques globales
    async obtenirStatistiquesGlobales() {
        try {
            const stats = await Combat.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCombats: { $sum: 1 },
                        combatsTermines: {
                            $sum: {
                                $cond: [{ $eq: ['$resultat.statut', 'termine'] }, 1, 0]
                            }
                        },
                        combatsEnCours: {
                            $sum: {
                                $cond: [{ $eq: ['$resultat.statut', 'en_cours'] }, 1, 0]
                            }
                        },
                        dureeMoyenne: { $avg: '$statistiques.duree' },
                        roundsMoyen: { $avg: '$statistiques.nombreRounds' }
                    }
                }
            ]);

            const statsParType = await Combat.aggregate([
                {
                    $group: {
                        _id: '$typeCombat',
                        nombre: { $sum: 1 }
                    }
                },
                { $sort: { nombre: -1 } }
            ]);

            return {
                global: stats[0] || {},
                parType: statsParType
            };
        } catch (error) {
            console.error('❌ Erreur statistiques globales:', error.message);
            throw error;
        }
    }
}

module.exports = new CombatService();