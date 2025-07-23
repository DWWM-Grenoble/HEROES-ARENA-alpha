// Configuration globale de l'application Heroes Arena

export const AppState ={
    heroes: [],
    currentFilter:'all',
    selectedAvatar:'warrior1.png',
    currentAvatarCategory:'guerriers',
    fighter1:null,
    fighter2:null,
    combatEnCours:false,
    lastSyncTime:null,
    isOnline:false
};

export const avatarCatalog ={
    guerriers:[
        'warrior1.png','warrior2.png','warrior3.png','warrior4.png',
        'knight1.png','knight2.png','barbarian1.png','berserker1.png'
    ],

    mages:[
        'mage1.PNG','mage2.png','wizard1.png','wizard2.png',
        'sorcerer1.png','necromancer1.png','witch1.png','warlock1.png'
    ],

    archers:[
        'archer1.png','archer2.png','ranger1.png','ranger2.png',
        'hunter1.png','scout1.png','bowman1.png','marksman1.png'
    ],

    paladins:[
        'paladin1.png','paladin2.png','cleric1.png','cleric2.png',
        'priest1.png','templar1.png','crusader1.png','guardian1.png'
    ], 

    assassins:[
        'rogue1.png','warrior3.png','scout1.png', 'hunter1.png',
        'ranger2.png','fighter1.png','adventurer1.png','marksman1.png'
    ],

    druides:[
        'monk1.png','cleric1.png','priest1.png','hero2.png',
        'mage2.png','wizard2.png','guardian1.png','hero4.png'
    ],

    generiques:[
        'hero1.png','hero2.png','hero3.png','hero4.png',
        'adventurer1.png','fighter1.png','rogue1.png','monk1.png'
    ]

};

export const classInfo = {
    'Guerrier':{
        title:'Guerrier-Maître de la Rage',
        desc:'Bonus de +2O% en Force. Spécialiste du combat rapproché.',
        power:'Rage Berserker',
        powerDesc:'Augmente les dégâts de 50% pendant 3 tours.',
        bonusStat:'force',
        bonusPercent:20
    },

    'Mage':{
        title:'Mage-Seigneur des Boucliers',
        desc:'Bonus de +20% en Magie.Maître des arts mystiques.',
        power:'Bouclier Magique',
        powerDesc:'Crée un bouclier qui absorbe les dégâts.',
        bonusStat:'magic',
        bonusPercent:20
    },

    'archer':{
        title:'Archer-Tireur Mortel',
        desc:'Bonus de +20% en Agilité. Expert en combat à distance.',
        power:'Tir Multiple',
        powerDesc:'Tire 2-3 flèches d\'affilée.',
        bonusStat:'agility',
        bonusPercent:20
    },

    'paladin':{
        title:'Paladin-Gardien Lumineux',
        desc:'Bonus de +20% en défense.Guerrier saint.',
        power:'Aura de Guérison',
        powerDesc:'Régénère des PV pendant 4 tours.',
        bonusStat:'defense',
        bonusPercent:20
    },

    'Assassin':{
        title:'Assassin-Maître de l\'Ombre',
        desc:'Bonus de +20% en Agilité.Expert en frappes critiques et esquive.',
        power:'Frappe Mortelle',
        powerDesc:'25% de chance de critique(x2 dégâts) + 15% esquive pendant 3 tours.',
        bonusStat:'agility',
        bonusPercent:20
    },

    'Druide':{
        title:'Druide-Gardien de la nature',
        desc:'Bonus de +10% sur toutes les stats.Maître de l\'équilibre et régénération.',
        power:'Symbiose Naturelle',
        powerDesc:'Régénère 10% PV max/tour pendant 5 tours + 25% défense',
        bonusStat:'all',
        bonusPercent:10

    },

};

export const gameHeroes = {
    maxHeroes:50,
    maxNameLenght:20,
    statPoints:100,
    minStatValue:10,
    maxStatValue:40,
    combatDelay:3000, //Délai entre les rounds
    attackAnimationDelay:800, //Délai pour l'animation d'attaque
    damageAnimation:600, //Délai pour afficher les dégâts
    effetsDelay:1200, //Délai pour les effets visuels
    maxCombatRounds:20,
    autoSaveInterval:30000
};

export const messages = {
    errors:{
        nameRequired:'Veuillez entrer un nom pour le héros',
        nameExists:'Un héros avec ce nom existe déjà',
        statsInvalid:'Les statistiques doivent totaliser exactement 100 points',
        maxHeroes:' Vous avez atteint le nombre maximum de héros',
        noFighters:'Veuillez sélectionner deux combattants',
        sameFighter:'Un héros ne peut pas combattre contre lui-même',
        combatInProgress:'Un combat est déjà en cours'
    },

success:{
       heroCreated:'Héros crée avec succès',
       herosDeleted:'Héros supprimé',
       dataExported:'Données exportées',
       dataSaved:'Données sauvegardées'
    }    
};