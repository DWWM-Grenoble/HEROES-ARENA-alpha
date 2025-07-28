const express = require('express');
const router = express.Router();
const HeroService = require('../services/HeroService');

// ==================== ROUTES HÉROS ====================

// GET /api/heroes - Obtenir tous les héros (avec filtres)
router.get('/', async (req, res) => {
    try {
        const { 
            owner, 
            classe, 
            nom,
            niveauMin,
            niveauMax,
            victoiresMin,
            limit = 20,
            skip = 0,
            sort = 'victoires'
        } = req.query;

        // Si un propriétaire spécifique est demandé
        if (owner) {
            const heroes = await HeroService.obtenirHerosUtilisateur(owner);
            return res.json({
                success: true,
                data: heroes,
                count: heroes.length
            });
        }

        // Recherche avec critères
        const criteres = {};
        if (classe) criteres.classe = classe;
        if (nom) criteres.nom = nom;
        if (niveauMin) criteres.niveauMin = parseInt(niveauMin);
        if (niveauMax) criteres.niveauMax = parseInt(niveauMax);
        if (victoiresMin) criteres.victoiresMin = parseInt(victoiresMin);

        // Options de pagination et tri
        const sortOptions = {
            'victoires': { 'progression.victoires': -1 },
            'niveau': { 'progression.niveau': -1 },
            'nom': { 'nom': 1 },
            'creation': { 'dateCreation': -1 }
        };

        const options = {
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: sortOptions[sort] || sortOptions.victoires
        };

        const result = await HeroService.rechercherHeros(criteres, options);

        res.json({
            success: true,
            data: result.heroes,
            pagination: {
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
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

// GET /api/heroes/classement - Obtenir le classement des héros
router.get('/classement', async (req, res) => {
    try {
        const { limite = 50, classe } = req.query;
        
        const filtre = classe ? { classe } : {};
        const classement = await HeroService.obtenirClassement(parseInt(limite), filtre);

        res.json({
            success: true,
            data: classement,
            count: classement.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/heroes/stats - Statistiques globales des héros
router.get('/stats', async (req, res) => {
    try {
        const stats = await HeroService.obtenirStatistiquesGlobales();

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

// POST /api/heroes - Créer un nouveau héros
router.post('/', async (req, res) => {
    try {
        const { owner, nom, classe, avatar, stats } = req.body;

        // Validation des données requises
        if (!owner || !nom || !classe || !avatar) {
            return res.status(400).json({
                success: false,
                error: 'Données manquantes: owner, nom, classe et avatar sont requis'
            });
        }

        const heroData = {
            nom: nom.trim(),
            classe,
            avatar,
            stats: stats || {}
        };

        const hero = await HeroService.creerHero(owner, heroData);

        res.status(201).json({
            success: true,
            data: hero,
            message: 'Héros créé avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/heroes/:id - Obtenir un héros spécifique
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner } = req.query;

        const hero = await HeroService.obtenirHero(id, owner);

        res.json({
            success: true,
            data: hero
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/heroes/:id - Mettre à jour un héros
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner, ...updateData } = req.body;

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: 'Owner requis pour la mise à jour'
            });
        }

        const hero = await HeroService.mettreAJourHero(id, owner, updateData);

        res.json({
            success: true,
            data: hero,
            message: 'Héros mis à jour avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/heroes/:id - Supprimer un héros
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner } = req.body;

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: 'Owner requis pour la suppression'
            });
        }

        const result = await HeroService.supprimerHero(id, owner);

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PATCH /api/heroes/:id/favori - Toggle favori
router.patch('/:id/favori', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner } = req.body;

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: 'Owner requis'
            });
        }

        const hero = await HeroService.toggleFavori(id, owner);

        res.json({
            success: true,
            data: hero,
            message: `Héros ${hero.favori ? 'ajouté aux' : 'retiré des'} favoris`
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PATCH /api/heroes/:id/heal - Soigner un héros
router.patch('/:id/heal', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner } = req.body;

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: 'Owner requis'
            });
        }

        const hero = await HeroService.soignerHero(id, owner);

        res.json({
            success: true,
            data: hero,
            message: 'Héros soigné avec succès'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/heroes/:id/combats - Historique des combats d'un héros
router.get('/:id/combats', async (req, res) => {
    try {
        const { id } = req.params;
        const { limite = 10 } = req.query;

        const combats = await HeroService.obtenirHistoriqueCombats(id, parseInt(limite));

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

module.exports = router;