const mongoose = require('mongoose');

const combatSchema = new mongoose.Schema({
    // Identifiant unique du combat
    combatId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Participants au combat
    combattants: [{
        hero: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hero',
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        nom: {
            type: String,
            required: true
        },
        classe: {
            type: String,
            required: true
        },
        position: {
            type: String,
            enum: ['gauche', 'droite'],
            required: true
        },
        statsAuCombat: {
            force: Number,
            agility: Number,
            magic: Number,
            defense: Number,
            pv: Number,
            pvMax: Number
        }
    }],
    
    // Résultat du combat
    resultat: {
        statut: {
            type: String,
            enum: ['en_cours', 'termine', 'interrompu', 'annule'],
            default: 'en_cours'
        },
        vainqueur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hero',
            default: null
        },
        perdant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hero',
            default: null
        },
        typeVictoire: {
            type: String,
            enum: ['ko', 'abandon', 'temps_ecoule', 'disqualification'],
            default: null
        },
        matchNul: {
            type: Boolean,
            default: false
        }
    },
    
    // Statistiques du combat
    statistiques: {
        duree: {
            type: Number, // en secondes
            default: 0
        },
        nombreRounds: {
            type: Number,
            default: 0
        },
        degatsInfliges: [{
            hero: mongoose.Schema.Types.ObjectId,
            degats: Number
        }],
        competencesUtilisees: [{
            hero: mongoose.Schema.Types.ObjectId,
            competence: String,
            nombre: Number
        }],
        esquivesReussies: [{
            hero: mongoose.Schema.Types.ObjectId,
            nombre: Number
        }],
        blocagesReussis: [{
            hero: mongoose.Schema.Types.ObjectId,
            nombre: Number
        }]
    },
    
    // Log détaillé du combat
    log: [{
        round: Number,
        timestamp: Date,
        action: String,
        acteur: String,
        cible: String,
        type: {
            type: String,
            enum: ['info', 'attack', 'defense', 'special', 'power', 'heal', 'dodge', 'success']
        },
        degats: Number,
        message: String
    }],
    
    // Récompenses distribuées
    recompenses: [{
        hero: mongoose.Schema.Types.ObjectId,
        xpGagne: Number,
        bonus: [{
            type: String,
            valeur: mongoose.Schema.Types.Mixed
        }]
    }],
    
    // Type de combat
    typeCombat: {
        type: String,
        enum: ['classique', 'tournoi', 'entrainement', 'defi'],
        default: 'classique'
    },
    
    // Contexte (si partie d'un tournoi)
    contexte: {
        tournoi: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournoi',
            default: null
        },
        phase: {
            type: String,
            enum: ['qualification', 'huitieme', 'quart', 'demi', 'finale'],
            default: null
        }
    },
    
    // Spectateurs (pour extension future)
    spectateurs: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rejoini: Date
    }],
    
    // Métadonnées
    dateDebut: {
        type: Date,
        default: Date.now
    },
    
    dateFin: {
        type: Date,
        default: null
    },
    
    serveur: {
        type: String,
        default: 'local'
    },
    
    version: {
        type: String,
        default: '1.0.0'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
combatSchema.virtual('dureeFormatee').get(function() {
    if (!this.statistiques.duree) return '0s';
    
    const minutes = Math.floor(this.statistiques.duree / 60);
    const secondes = this.statistiques.duree % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${secondes}s`;
    }
    return `${secondes}s`;
});

combatSchema.virtual('combattant1').get(function() {
    return this.combattants.find(c => c.position === 'gauche');
});

combatSchema.virtual('combattant2').get(function() {
    return this.combattants.find(c => c.position === 'droite');
});

// Méthodes statiques
combatSchema.statics.genererIdCombat = function() {
    return 'combat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

combatSchema.statics.obtenirStatistiquesJoueur = async function(userId) {
    return await this.aggregate([
        {
            $match: {
                'combattants.owner': mongoose.Types.ObjectId(userId),
                'resultat.statut': 'termine'
            }
        },
        {
            $group: {
                _id: '$combattants.owner',
                totalCombats: { $sum: 1 },
                victoires: {
                    $sum: {
                        $cond: [
                            { $eq: ['$resultat.vainqueur', '$combattants.hero'] },
                            1,
                            0
                        ]
                    }
                },
                dureeTotal: { $sum: '$statistiques.duree' },
                degatsTotal: { $sum: '$statistiques.degatsInfliges.degats' }
            }
        }
    ]);
};

// Méthodes d'instance
combatSchema.methods.ajouterLogEntry = function(entry) {
    this.log.push({
        ...entry,
        timestamp: new Date()
    });
};

combatSchema.methods.terminerCombat = function(vainqueurId, perdantId, typeVictoire = 'ko') {
    this.resultat.statut = 'termine';
    this.resultat.vainqueur = vainqueurId;
    this.resultat.perdant = perdantId;
    this.resultat.typeVictoire = typeVictoire;
    this.dateFin = new Date();
    
    // Calculer la durée
    this.statistiques.duree = Math.floor((this.dateFin - this.dateDebut) / 1000);
};

combatSchema.methods.declareMatchNul = function() {
    this.resultat.statut = 'termine';
    this.resultat.matchNul = true;
    this.dateFin = new Date();
    this.statistiques.duree = Math.floor((this.dateFin - this.dateDebut) / 1000);
};

combatSchema.methods.ajouterRecompense = function(heroId, xp, bonus = []) {
    this.recompenses.push({
        hero: heroId,
        xpGagne: xp,
        bonus: bonus
    });
};

// Middleware pour validation
combatSchema.pre('save', function(next) {
    // Vérifier qu'il y a exactement 2 combattants
    if (this.combattants.length !== 2) {
        return next(new Error('Un combat doit avoir exactement 2 combattants'));
    }
    
    // Vérifier les positions
    const positions = this.combattants.map(c => c.position);
    if (!positions.includes('gauche') || !positions.includes('droite')) {
        return next(new Error('Les positions des combattants doivent être "gauche" et "droite"'));
    }
    
    next();
});

// Index pour optimiser les requêtes
combatSchema.index({ combatId: 1 });
combatSchema.index({ 'combattants.hero': 1 });
combatSchema.index({ 'combattants.owner': 1 });
combatSchema.index({ 'resultat.vainqueur': 1 });
combatSchema.index({ dateDebut: -1 });
combatSchema.index({ 'resultat.statut': 1 });
combatSchema.index({ typeCombat: 1 });

// Index composé pour les statistiques
combatSchema.index({ 
    'combattants.owner': 1, 
    'resultat.statut': 1, 
    dateDebut: -1 
});

module.exports = mongoose.model('Combat', combatSchema);