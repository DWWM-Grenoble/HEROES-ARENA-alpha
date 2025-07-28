const express = require('express');
const router = express.Router();
const CombatService = require('../services/CombatService');

// ==================== ROUTES COMBATS ====================

// GET /api/combats - Obtenir les combats récents
router.get('/', async (req, res) => {
    try {
        const { limite = 10, utilisateur, statut, type } = req.query;

        // Si un utilisateur spécifique est demandé
        if (utilisateur) {
            const options = {
                limit: parseInt(limite),
                statut,
                typeCombat: type
            };

            const result = await CombatService.obtenirHistoriqueUtilisateur(utilisateur, options);
            
            return res.json({
                success: true,
                data: result.combats,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages
                }
            });
        }

        // Combats récents généraux
        const combats = await CombatService.obtenirCombatsRecents(parseInt(limite));

        res.json({
            success: true,
            data: combats,
            count: combats.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/combats/stats - Statistiques globales des combats
router.get('/stats', async (req, res) => {
    try {
        const stats = await CombatService.obtenirStatistiquesGlobales();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/combats - Créer un nouveau combat
router.post('/', async (req, res) => {
    try {
        const { hero1Id, hero2Id, typeCombat = 'classique' } = req.body;

        // Validation des données
        if (!hero1Id || !hero2Id) {
            return res.status(400).json({
                success: false,
                error: 'Les IDs des deux héros sont requis'
            });
        }

        if (hero1Id === hero2Id) {
            return res.status(400).json({
                success: false,
                error: 'Un héros ne peut pas combattre contre lui-même'
            });
        }

        const combat = await CombatService.creerCombat(hero1Id, hero2Id, typeCombat);

        res.status(201).json({
            success: true,
            data: combat,
            message: 'Combat créé avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/combats/:combatId - Obtenir un combat spécifique
router.get('/:combatId', async (req, res) => {
    try {
        const { combatId } = req.params;
        const { includeLog = 'false' } = req.query;

        const combat = await CombatService.obtenirCombat(
            combatId, 
            includeLog === 'true'
        );

        res.json({
            success: true,
            data: combat
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/combats/:combatId/log - Ajouter une entrée au log
router.post('/:combatId/log', async (req, res) => {
    try {
        const { combatId } = req.params;
        const logEntry = req.body;

        // Validation de l'entrée de log
        if (!logEntry.action || !logEntry.type) {
            return res.status(400).json({
                success: false,
                error: 'Action et type sont requis pour le log'
            });
        }

        const combat = await CombatService.ajouterLogEntry(combatId, logEntry);

        res.json({
            success: true,
            data: combat,
            message: 'Entrée de log ajoutée'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/combats/:combatId/stats - Mettre à jour les statistiques
router.put('/:combatId/stats', async (req, res) => {
    try {
        const { combatId } = req.params;
        const stats = req.body;

        const combat = await CombatService.mettreAJourStatistiques(combatId, stats);

        res.json({
            success: true,
            data: combat,
            message: 'Statistiques mises à jour'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/combats/:combatId/finish - Terminer un combat
router.post('/:combatId/finish', async (req, res) => {
    try {
        const { combatId } = req.params;
        const { vainqueurId, perdantId, typeVictoire = 'ko' } = req.body;

        // Validation des données
        if (!vainqueurId || !perdantId) {
            return res.status(400).json({
                success: false,
                error: 'IDs du vainqueur et du perdant requis'
            });
        }

        const result = await CombatService.terminerCombat(
            combatId, 
            vainqueurId, 
            perdantId, 
            typeVictoire
        );

        res.json({
            success: true,
            data: result,
            message: 'Combat terminé avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/combats/:combatId/draw - Déclarer un match nul
router.post('/:combatId/draw', async (req, res) => {
    try {
        const { combatId } = req.params;

        const combat = await CombatService.declareMatchNul(combatId);

        res.json({
            success: true,
            data: combat,
            message: 'Match nul déclaré'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/combats/:combatId/interrupt - Interrompre un combat
router.post('/:combatId/interrupt', async (req, res) => {
    try {
        const { combatId } = req.params;
        const { raison = 'interruption manuelle' } = req.body;

        const combat = await CombatService.interrompreCombat(combatId, raison);

        res.json({
            success: true,
            data: combat,
            message: 'Combat interrompu'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/combats/hero/:heroId/stats - Statistiques d'un héros
router.get('/hero/:heroId/stats', async (req, res) => {
    try {
        const { heroId } = req.params;

        const stats = await CombatService.obtenirStatistiquesHero(heroId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;