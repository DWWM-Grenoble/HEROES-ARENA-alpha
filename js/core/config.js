// Configuration globale de l'application Heroes Arena

export const AppState = {
    heroes: [],
    currentFilter: 'all',
    selectedAvatar: 'warrior/warrior1.webp',
    currentAvatarCategory: 'guerriers',
    fighter1: null,
    fighter2: null,
    combatEnCours: false,
    lastSyncTime: null,
    isOnline: false
};

export const avatarCatalog = {
    guerriers: [
        'warrior/warrior1.webp', 'warrior/warrior2.webp', 'warrior/warrior3.webp', 'warrior/warrior4.webp',
        'warrior/warrior5.webp', 'warrior/warrior6.webp', 'warrior/warrior7.webp', 'warrior/warrior8.webp',
        'warrior/warrior9.webp', 'warrior/warrior10.webp'
    ],
    mages: [
        'mage/mage1.webp', 'mage/mage2.webp', 'mage/mage3.webp', 'mage/mage4.webp',
        'mage/mage5.webp', 'mage/mage6.webp', 'mage/mage7.webp', 'mage/mage8.webp',
        'mage/mage9.webp', 'mage/mage10.webp'
    ],
    archers: [
        'archer/archer1.webp', 'archer/archer2.webp', 'archer/archer3.webp', 'archer/archer4.webp',
        'archer/archer5.webp', 'archer/archer6.webp'
    ],
    paladins: [
        'paladin/paladin1.webp', 'paladin/paladin2.webp', 'paladin/paladin3.webp', 'paladin/paladin4.webp',
        'paladin/paladin5.webp', 'paladin/paladin6.webp'
    ],
    assassins: [
        'assassin/assassin1.webp', 'assassin/assassin2.webp', 'assassin/assassin3.webp', 'assassin/assassin4.webp',
        'assassin/assassin5.webp', 'assassin/assassin6.webp', 'assassin/assassin7.webp', 'assassin/assassin8.webp',
        'assassin/assassin9.webp', 'assassin/assassin10.webp'
    ],
    druides: [
        'druide/druide1.webp', 'druide/druide2.webp', 'druide/druide3.webp', 'druide/druide4.webp',
        'druide/druide5.webp', 'druide/druide6.webp'
    ],
    generiques: [
        'warrior/warrior1.webp', 'warrior/warrior2.webp', 'mage/mage3.webp', 'mage/mage4.webp',
        'archer/archer5.webp', 'archer/archer6.webp', 'paladin/paladin1.webp', 'paladin/paladin2.webp',
        'assassin/assassin1.webp', 'assassin/assassin2.webp', 'druide/druide1.webp', 'druide/druide2.webp'
    ]
};

export const classInfo = {
    'Guerrier': {
        title: 'Guerrier - Maître de la Rage',
        desc: 'Bonus de +20% en Force. Spécialiste du combat rapproché.',
        power: 'Rage Berserker',
        powerDesc: 'Augmente les dégâts de 50% pendant 3 tours.',
        bonusStat: 'force',
        bonusPercent: 20
    },
    'Mage': {
        title: 'Mage - Seigneur des Boucliers',
        desc: 'Bonus de +20% en Magie. Maître des arts mystiques.',
        power: 'Bouclier Magique',
        powerDesc: 'Crée un bouclier qui absorbe les dégâts.',
        bonusStat: 'magic',
        bonusPercent: 20
    },
    'Archer': {
        title: 'Archer - Tireur Mortel',
        desc: 'Bonus de +20% en Agilité. Expert en combat à distance.',
        power: 'Tir Multiple',
        powerDesc: 'Tire 2-3 flèches d\'affilée.',
        bonusStat: 'agility',
        bonusPercent: 20
    },
    'Paladin': {
        title: 'Paladin - Gardien Lumineux',
        desc: 'Bonus de +20% en Défense. Guerrier saint.',
        power: 'Aura de Guérison',
        powerDesc: 'Régénère des PV pendant 4 tours.',
        bonusStat: 'defense',
        bonusPercent: 20
    },
    'Assassin': {
        title: 'Assassin - Maître de l\'Ombre',
        desc: 'Bonus de +20% en Agilité. Expert en frappes critiques et esquive.',
        power: 'Frappe Mortelle',
        powerDesc: '25% de chance de critique (x2 dégâts) + 15% esquive pendant 3 tours.',
        bonusStat: 'agility',
        bonusPercent: 20
    },
    'Druide': {
        title: 'Druide - Gardien de la Nature',
        desc: 'Bonus de +10% sur toutes les stats. Maître de l\'équilibre et régénération.',
        power: 'Symbiose Naturelle',
        powerDesc: 'Régénère 10% PV max/tour pendant 5 tours + 25% défense.',
        bonusStat: 'all',
        bonusPercent: 10
    }
};

export const gameConfig = {
    maxHeroes: 50,
    maxNameLength: 20,
    statPoints: 100,
    minStatValue: 10,
    maxStatValue: 40,
    combatDelay: 3000,        // Délai entre les rounds
    attackAnimationDelay: 800, // Délai pour l'animation d'attaque
    damageAnimationDelay: 600, // Délai pour afficher les dégâts
    effectsDelay: 1200,       // Délai pour les effets visuels
    maxCombatRounds: 20,
    autoSaveInterval: 30000,
    clearArenaDelay: 5000     // Délai avant vidage automatique de l'arène (5 secondes)
};

export const messages = {
    errors: {
        nameRequired: 'Veuillez entrer un nom pour le héros',
        nameExists: 'Un héros avec ce nom existe déjà',
        statsInvalid: 'Les statistiques doivent totaliser exactement 100 points',
        maxHeroes: 'Vous avez atteint le nombre maximum de héros',
        noFighters: 'Veuillez sélectionner deux combattants',
        sameFighter: 'Un héros ne peut pas combattre contre lui-même',
        combatInProgress: 'Un combat est déjà en cours'
    },
    success: {
        heroCreated: 'Héros créé avec succès !',
        heroDeleted: 'Héros supprimé',
        dataExported: 'Données exportées',
        dataSaved: 'Données sauvegardées'
    }
};