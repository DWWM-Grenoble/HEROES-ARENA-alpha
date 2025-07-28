const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==================== ROUTES UTILISATEURS ====================

// GET /api/users - Obtenir tous les utilisateurs (limité)
router.get('/', async (req, res) => {
    try {
        const { limit = 20, skip = 0, sort = 'creation' } = req.query;

        const sortOptions = {
            'creation': { createdAt: -1 },
            'victoires': { 'stats.combatsGagnes': -1 },
            'xp': { 'profile.xp': -1 },
            'username': { username: 1 }
        };

        const users = await User.find()
            .select('-password') // Exclure le mot de passe
            .sort(sortOptions[sort] || sortOptions.creation)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/users - Créer un nouvel utilisateur
router.post('/', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation des données
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email et password sont requis'
            });
        }

        // Créer l'utilisateur
        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        // Retourner l'utilisateur sans le mot de passe
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'Utilisateur créé avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/users/:id - Obtenir un utilisateur spécifique
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password'); // Exclure le mot de passe

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Supprimer les champs qui ne doivent pas être mis à jour
        delete updateData.password;
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'Utilisateur mis à jour avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/users/:id/heroes - Obtenir les héros d'un utilisateur
router.get('/:id/heroes', async (req, res) => {
    try {
        const { id } = req.params;
        const Hero = require('../models/Hero');

        const heroes = await Hero.find({ owner: id })
            .sort({ favori: -1, dateCreation: -1 });

        res.json({
            success: true,
            data: heroes,
            count: heroes.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/users/:id/stats - Statistiques détaillées d'un utilisateur
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const Combat = require('../models/Combat');
        const Hero = require('../models/Hero');

        // Statistiques de l'utilisateur
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Statistiques des héros
        const heroStats = await Hero.aggregate([
            { $match: { owner: user._id } },
            {
                $group: {
                    _id: null,
                    totalHeros: { $sum: 1 },
                    niveauMoyen: { $avg: '$progression.niveau' },
                    totalVictoires: { $sum: '$progression.victoires' },
                    totalDefaites: { $sum: '$progression.defaites' },
                    heroFavori: { $sum: { $cond: ['$favori', 1, 0] } }
                }
            }
        ]);

        // Statistiques des combats
        const combatStats = await Combat.aggregate([
            { $match: { 'combattants.owner': user._id } },
            {
                $group: {
                    _id: null,
                    totalCombats: { $sum: 1 },
                    dureeTotal: { $sum: '$statistiques.duree' },
                    roundsTotal: { $sum: '$statistiques.nombreRounds' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                utilisateur: user,
                heroes: heroStats[0] || {
                    totalHeros: 0,
                    niveauMoyen: 0,
                    totalVictoires: 0,
                    totalDefaites: 0,
                    heroFavori: 0
                },
                combats: combatStats[0] || {
                    totalCombats: 0,
                    dureeTotal: 0,
                    roundsTotal: 0
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

// POST /api/users/:id/xp - Ajouter de l'XP à un utilisateur
router.post('/:id/xp', async (req, res) => {
    try {
        const { id } = req.params;
        const { xp } = req.body;

        if (!xp || xp <= 0) {
            return res.status(400).json({
                success: false,
                error: 'XP valide requis'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        const aGagneNiveau = user.gagnerXP(xp);
        await user.save();

        res.json({
            success: true,
            data: user,
            aGagneNiveau,
            message: `${xp} XP ajoutés${aGagneNiveau ? ' - Niveau supérieur atteint!' : ''}`
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/users/classement - Classement des utilisateurs
router.get('/classement/global', async (req, res) => {
    try {
        const { limite = 50, critere = 'victoires' } = req.query;

        const sortOptions = {
            'victoires': { 'stats.combatsGagnes': -1 },
            'xp': { 'profile.xp': -1 },
            'niveau': { 'profile.niveau': -1 },
            'ratio': { } // Calculé via aggregation
        };

        let pipeline = [];

        if (critere === 'ratio') {
            pipeline = [
                {
                    $addFields: {
                        ratio: {
                            $cond: [
                                { $eq: ['$stats.combatsJoues', 0] },
                                0,
                                {
                                    $multiply: [
                                        { $divide: ['$stats.combatsGagnes', '$stats.combatsJoues'] },
                                        100
                                    ]
                                }
                            ]
                        }
                    }
                },
                { $sort: { ratio: -1 } },
                { $limit: parseInt(limite) },
                { $project: { password: 0 } }
            ];

            const classement = await User.aggregate(pipeline);
            
            return res.json({
                success: true,
                data: classement.map((user, index) => ({
                    rang: index + 1,
                    user: user
                })),
                critere
            });
        }

        const classement = await User.find()
            .select('-password')
            .sort(sortOptions[critere] || sortOptions.victoires)
            .limit(parseInt(limite));

        res.json({
            success: true,
            data: classement.map((user, index) => ({
                rang: index + 1,
                user: user
            })),
            critere
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;