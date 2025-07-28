const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    // Propriétaire du héros
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Le héros doit avoir un propriétaire']
    },
    
    // Informations de base
    nom: {
        type: String,
        required: [true, 'Le nom du héros est requis'],
        trim: true,
        minlength: [2, 'Le nom doit faire au moins 2 caractères'],
        maxlength: [30, 'Le nom ne peut pas dépasser 30 caractères']
    },
    
    classe: {
        type: String,
        required: [true, 'La classe est requise'],
        enum: {
            values: ['Guerrier', 'Mage', 'Archer', 'Paladin', 'Assassin', 'Druide'],
            message: 'Classe invalide'
        }
    },
    
    avatar: {
        type: String,
        required: [true, 'L\'avatar est requis']
    },
    
    // Statistiques de base
    stats: {
        force: {
            type: Number,
            required: true,
            min: [10, 'La force minimum est 10'],
            max: [100, 'La force maximum est 100'],
            default: 50
        },
        agility: {
            type: Number,
            required: true,
            min: [10, 'L\'agilité minimum est 10'],
            max: [100, 'L\'agilité maximum est 100'],
            default: 50
        },
        magic: {
            type: Number,
            required: true,
            min: [10, 'La magie minimum est 10'],
            max: [100, 'La magie maximum est 100'],
            default: 50
        },
        defense: {
            type: Number,
            required: true,
            min: [10, 'La défense minimum est 10'],
            max: [100, 'La défense maximum est 100'],
            default: 50
        }
    },
    
    // Points de vie
    pv: {
        type: Number,
        required: true,
        min: [1, 'Les PV ne peuvent pas être inférieurs à 1']
    },
    
    pvMax: {
        type: Number,
        required: true,
        min: [50, 'Les PV maximum minimum sont 50'],
        max: [200, 'Les PV maximum ne peuvent dépasser 200']
    },
    
    // Progression
    progression: {
        niveau: {
            type: Number,
            default: 1,
            min: 1,
            max: 100
        },
        xp: {
            type: Number,
            default: 0,
            min: 0
        },
        victoires: {
            type: Number,
            default: 0,
            min: 0
        },
        defaites: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Équipement (optionnel pour extension future)
    equipement: {
        arme: {
            type: String,
            default: null
        },
        armure: {
            type: String,
            default: null
        },
        accessoires: [{
            nom: String,
            effet: String,
            valeur: Number
        }]
    },
    
    // Compétences spéciales par classe
    competences: {
        speciale: {
            nom: String,
            description: String,
            cooldown: { type: Number, default: 0 }
        },
        passives: [{
            nom: String,
            description: String,
            effet: String
        }]
    },
    
    // Historique de combat (référence)
    combats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combat'
    }],
    
    // Métadonnées
    statut: {
        type: String,
        enum: ['actif', 'repos', 'blesse', 'retire'],
        default: 'actif'
    },
    
    favori: {
        type: Boolean,
        default: false
    },
    
    dateCreation: {
        type: Date,
        default: Date.now
    },
    
    dernierCombat: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals calculés
heroSchema.virtual('puissanceTotal').get(function() {
    return this.stats.force + this.stats.agility + this.stats.magic + this.stats.defense;
});

heroSchema.virtual('ratioVictoires').get(function() {
    const totalCombats = this.progression.victoires + this.progression.defaites;
    if (totalCombats === 0) return 0;
    return Math.round((this.progression.victoires / totalCombats) * 100);
});

heroSchema.virtual('badge').get(function() {
    const victoires = this.progression.victoires;
    if (victoires >= 100) return 'Légende';
    if (victoires >= 50) return 'Maître';
    if (victoires >= 25) return 'Expert';
    if (victoires >= 10) return 'Vétéran';
    if (victoires >= 5) return 'Guerrier';
    return 'Novice';
});

// Middleware pour initialiser les PV selon la classe
heroSchema.pre('save', function(next) {
    if (this.isNew && !this.pv) {
        // Calculer les PV selon la classe et les stats
        const classeModifier = {
            'Guerrier': 1.2,
            'Paladin': 1.15,
            'Druide': 1.1,
            'Mage': 0.9,
            'Archer': 0.95,
            'Assassin': 0.85
        };
        
        const modifier = classeModifier[this.classe] || 1.0;
        this.pvMax = Math.floor((80 + this.stats.defense * 0.5) * modifier);
        this.pv = this.pvMax;
    }
    next();
});

// Méthodes d'instance
heroSchema.methods.heal = function() {
    this.pv = this.pvMax;
    return this.pv;
};

heroSchema.methods.takeDamage = function(damage) {
    this.pv = Math.max(0, this.pv - damage);
    return this.pv;
};

heroSchema.methods.gagnerXp = function(xpGagne) {
    const ancienNiveau = this.progression.niveau;
    this.progression.xp += xpGagne;
    this.progression.niveau = Math.floor(this.progression.xp / 100) + 1;
    
    // Améliorer les stats avec le niveau
    if (this.progression.niveau > ancienNiveau) {
        this.ameliorerStats();
        return true; // A gagné un niveau
    }
    return false;
};

heroSchema.methods.ameliorerStats = function() {
    // Amélioration légère des stats à chaque niveau
    const amelioration = Math.floor(Math.random() * 3) + 1;
    const statAAmeliorer = ['force', 'agility', 'magic', 'defense'][Math.floor(Math.random() * 4)];
    
    if (this.stats[statAAmeliorer] < 100) {
        this.stats[statAAmeliorer] = Math.min(100, this.stats[statAAmeliorer] + amelioration);
    }
    
    // Améliorer les PV max aussi
    this.pvMax = Math.min(200, this.pvMax + 2);
    this.pv = this.pvMax;
};

heroSchema.methods.mettreAJourApresVictoire = function(xpGagne = 50) {
    this.progression.victoires += 1;
    this.dernierCombat = new Date();
    return this.gagnerXp(xpGagne);
};

heroSchema.methods.mettreAJourApresDefaite = function(xpGagne = 20) {
    this.progression.defaites += 1;
    this.dernierCombat = new Date();
    return this.gagnerXp(xpGagne);
};

// Index pour optimiser les requêtes
heroSchema.index({ owner: 1 });
heroSchema.index({ classe: 1 });
heroSchema.index({ 'progression.victoires': -1 });
heroSchema.index({ 'progression.niveau': -1 });
heroSchema.index({ puissanceTotal: -1 });
heroSchema.index({ dateCreation: -1 });

// Index composé pour les classements
heroSchema.index({ 'progression.victoires': -1, 'progression.niveau': -1 });

module.exports = mongoose.model('Hero', heroSchema);