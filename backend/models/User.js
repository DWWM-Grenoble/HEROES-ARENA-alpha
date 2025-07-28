const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est requis'],
        unique: true,
        trim: true,
        minlength: [3, 'Le nom d\'utilisateur doit faire au moins 3 caractères'],
        maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit faire au moins 6 caractères']
    },
    profile: {
        avatar: {
            type: String,
            default: 'default-avatar.png'
        },
        niveau: {
            type: Number,
            default: 1
        },
        xp: {
            type: Number,
            default: 0
        },
        titres: [{
            nom: String,
            obtenu: Date,
            actif: { type: Boolean, default: false }
        }]
    },
    stats: {
        combatsJoues: { type: Number, default: 0 },
        combatsGagnes: { type: Number, default: 0 },
        combatsPerdus: { type: Number, default: 0 },
        tempsDeJeuTotal: { type: Number, default: 0 }, // en minutes
        derniereCo: { type: Date, default: Date.now }
    },
    preferences: {
        theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
        notifications: { type: Boolean, default: true },
        musique: { type: Boolean, default: true },
        effetsSonores: { type: Boolean, default: true }
    },
    // Authentification GitHub
    github: {
        id: String,
        username: String,
        profileUrl: String,
        avatarUrl: String,
        connectedAt: { type: Date, default: Date.now }
    },
    authMethod: {
        type: String,
        enum: ['local', 'github'],
        default: 'local'
    },
    role: {
        type: String,
        enum: ['player', 'admin', 'moderator'],
        default: 'player'
    },
    statut: {
        type: String,
        enum: ['actif', 'suspendu', 'banni'],
        default: 'actif'
    },
    derniereCo: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual pour le ratio de victoires
userSchema.virtual('ratioVictoires').get(function() {
    if (this.stats.combatsJoues === 0) return 0;
    return Math.round((this.stats.combatsGagnes / this.stats.combatsJoues) * 100);
});

// Virtual pour le niveau basé sur l'XP
userSchema.virtual('niveauCalcule').get(function() {
    return Math.floor(this.profile.xp / 100) + 1;
});

// Middleware pour hasher le mot de passe
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour gagner de l'XP
userSchema.methods.gagnerXP = function(xpGagne) {
    const ancienNiveau = this.profile.niveau;
    this.profile.xp += xpGagne;
    this.profile.niveau = Math.floor(this.profile.xp / 100) + 1;
    
    // Retourner si le joueur a gagné un niveau
    return this.profile.niveau > ancienNiveau;
};

// Méthode pour mettre à jour les stats de combat
userSchema.methods.mettreAJourStatsCombat = function(victoire, duree) {
    this.stats.combatsJoues += 1;
    this.stats.tempsDeJeuTotal += duree;
    
    if (victoire) {
        this.stats.combatsGagnes += 1;
    } else {
        this.stats.combatsPerdus += 1;
    }
};

// Index pour les recherches
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'stats.combatsGagnes': -1 });
userSchema.index({ 'profile.xp': -1 });

module.exports = mongoose.model('User', userSchema);