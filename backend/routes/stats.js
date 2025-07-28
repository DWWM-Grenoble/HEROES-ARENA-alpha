const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hero = require('../models/Hero');
const Combat = require('../models/Combat');

// ==================== ROUTES STATISTIQUES ====================

// GET /api/stats/global - Statistiques globales de l'application
router.get('/global', async (req, res) => {
    try {
        // Statistiques générales
        const [
            totalUsers,
            totalHeroes,
            totalCombats,
            combatsTermines,
            combatsEnCours
        ] = await Promise.all([
            User.countDocuments(),
            Hero.countDocuments(),
            Combat.countDocuments(),
            Combat.countDocuments({ 'resultat.statut': 'termine' }),
            Combat.countDocuments({ 'resultat.statut': 'en_cours' })
        ]);

        // Statistiques détaillées des héros
        const heroStats = await Hero.aggregate([
            {
                $group: {
                    _id: null,
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

        // Distribution par classe
        const distributionClasse = await Hero.aggregate([
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

        // Statistiques des combats
        const combatStats = await Combat.aggregate([
            {
                $match: { 'resultat.statut': 'termine' }
            },
            {
                $group: {
                    _id: null,
                    dureeMoyenne: { $avg: '$statistiques.duree' },
                    roundsMoyen: { $avg: '$statistiques.nombreRounds' },
                    totalDuree: { $sum: '$statistiques.duree' }
                }
            }
        ]);

        // Activité récente (dernières 24h)
        const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [
            nouveauxUsers,
            nouveauxHeroes,
            nouveauxCombats
        ] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: hier } }),
            Hero.countDocuments({ dateCreation: { $gte: hier } }),
            Combat.countDocuments({ dateDebut: { $gte: hier } })
        ]);

        res.json({
            success: true,
            data: {
                general: {
                    totalUtilisateurs: totalUsers,
                    totalHeros: totalHeroes,
                    totalCombats: totalCombats,
                    combatsTermines: combatsTermines,
                    combatsEnCours: combatsEnCours
                },
                heroes: {
                    ...heroStats[0],
                    distributionClasse: distributionClasse
                },
                combats: combatStats[0] || {
                    dureeMoyenne: 0,
                    roundsMoyen: 0,
                    totalDuree: 0
                },
                activiteRecente: {
                    nouveauxUtilisateurs: nouveauxUsers,
                    nouveauxHeros: nouveauxHeroes,
                    nouveauxCombats: nouveauxCombats,
                    periode: '24h'
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats/classements - Tous les classements
router.get('/classements', async (req, res) => {
    try {
        const limite = 10;

        // Top héros par victoires
        const topHeroes = await Hero.find()
            .populate('owner', 'username profile.avatar')
            .sort({ 'progression.victoires': -1, 'progression.niveau': -1 })
            .limit(limite);

        // Top utilisateurs par XP
        const topUsers = await User.find()
            .select('-password')
            .sort({ 'profile.xp': -1 })
            .limit(limite);

        // Héros les plus puissants
        const heroesPuissants = await Hero.aggregate([
            {
                $addFields: {
                    puissanceTotal: {
                        $add: ['$stats.force', '$stats.agility', '$stats.magic', '$stats.defense']
                    }
                }
            },
            { $sort: { puissanceTotal: -1, 'progression.niveau': -1 } },
            { $limit: limite },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner',
                    pipeline: [{ $project: { username: 1, 'profile.avatar': 1 } }]
                }
            },
            { $unwind: '$owner' }
        ]);

        // Classes les plus populaires
        const classesPopulaires = await Hero.aggregate([
            {
                $group: {
                    _id: '$classe',
                    nombre: { $sum: 1 },
                    niveauMoyen: { $avg: '$progression.niveau' },
                    victoiresTotales: { $sum: '$progression.victoires' }
                }
            },
            { $sort: { nombre: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                topHeroes: topHeroes.map((hero, index) => ({
                    rang: index + 1,
                    hero
                })),
                topUtilisateurs: topUsers.map((user, index) => ({
                    rang: index + 1,
                    user
                })),
                heroesPuissants: heroesPuissants.map((hero, index) => ({
                    rang: index + 1,
                    hero
                })),
                classesPopulaires
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats/activite - Statistiques d'activité par période
router.get('/activite', async (req, res) => {
    try {
        const { periode = '7d' } = req.query;
        
        // Calculer la date de début selon la période
        let dateDebut;
        switch (periode) {
            case '24h':
                dateDebut = new Date(Date.now() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                dateDebut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                dateDebut = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                dateDebut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }

        // Activité des utilisateurs
        const activiteUsers = await User.aggregate([
            {
                $match: { derniereCo: { $gte: dateDebut } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$derniereCo'
                        }
                    },
                    utilisateursActifs: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Créations de héros
        const creationsHeros = await Hero.aggregate([
            {
                $match: { dateCreation: { $gte: dateDebut } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$dateCreation'
                        }
                    },
                    nouveauxHeros: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Combats par jour
        const combatsParJour = await Combat.aggregate([
            {
                $match: { dateDebut: { $gte: dateDebut } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$dateDebut'
                        }
                    },
                    nombreCombats: { $sum: 1 },
                    dureeMoyenne: { $avg: '$statistiques.duree' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                periode,
                activiteUtilisateurs: activiteUsers,
                creationsHeros: creationsHeros,
                combatsParJour: combatsParJour
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats/performances - Statistiques de performance du système
router.get('/performances', async (req, res) => {
    try {
        const database = require('../config/database');
        
        // Stats de la base de données
        const dbStats = await database.getStats();
        
        // Taille des collections
        const collections = await Promise.all([
            User.estimatedDocumentCount(),
            Hero.estimatedDocumentCount(),
            Combat.estimatedDocumentCount()
        ]);

        // Temps de réponse moyen des combats (dernières 100)
        const combatsRecents = await Combat.find({ 'resultat.statut': 'termine' })
            .sort({ dateFin: -1 })
            .limit(100)
            .select('statistiques.duree');

        const dureesMoyennes = combatsRecents.length > 0 ? 
            combatsRecents.reduce((acc, combat) => acc + combat.statistiques.duree, 0) / combatsRecents.length : 0;

        res.json({
            success: true,
            data: {
                database: dbStats,
                collections: {
                    utilisateurs: collections[0],
                    heroes: collections[1],
                    combats: collections[2]
                },
                performances: {
                    dureeMoyenneCombat: Math.round(dureesMoyennes),
                    uptime: process.uptime(),
                    memoire: process.memoryUsage(),
                    connexionDB: database.isConnected()
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats/search - Recherche dans les statistiques
router.get('/search', async (req, res) => {
    try {
        const { query, type = 'all' } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Requête de recherche trop courte (minimum 2 caractères)'
            });
        }

        const regex = new RegExp(query.trim(), 'i');
        const results = {};

        // Rechercher dans les utilisateurs
        if (type === 'all' || type === 'users') {
            results.utilisateurs = await User.find({
                $or: [
                    { username: regex },
                    { email: regex }
                ]
            })
            .select('-password')
            .limit(10);
        }

        // Rechercher dans les héros
        if (type === 'all' || type === 'heroes') {
            results.heroes = await Hero.find({
                $or: [
                    { nom: regex },
                    { classe: regex }
                ]
            })
            .populate('owner', 'username')
            .limit(10);
        }

        // Compter les résultats
        const totalResults = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);

        res.json({
            success: true,
            data: results,
            query: query.trim(),
            totalResults
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;