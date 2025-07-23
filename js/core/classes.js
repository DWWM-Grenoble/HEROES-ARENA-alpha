import { classInfo} from './config.js';

export class Hero {
    constructor(nom, avatar, classe, force, agility, magic, defense) {
        this.nom = nom;
        this.avatar = avatar || 'hero1.png';
        this.classe = classe;
        this.force = force;
        this.agility = agility;
        this.magic = magic;
        this.defense = defense;

        this.pvMax = Math.floor((this.force + this.defense) * 2.5);
        this.pv = this.pvMax;

        this.victoires = 0;
        this.defaites = 0;
        this.xp = 0;
        this.niveau = 1;

        this.createdAt = new Date().to|SOString();
        this.updatedAt = new Date().to|SOString();
        this.id = this.generateId();

        this.applyClassBonus();

    }
    generateId() {
        return 'hero_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    applyClassBonus() {
        const info = classInfo[this.classe];
        if (info && info.bonusStat){
            if (info.bonusStat === 'all'){
                //Druide : bonus sur toutes les stats
                const bonus = Math.floor(info.bonusPercent / 100);
                this.force += Math.floor(this.force * bonus);
                this.agility += Math.floor(this.agility * bonus);
                this.magic += Math.floor(this.magic * bonus);
                this.defense += Math.floor(this.defense * bonus);
            } else {
                // Autres classes : bonus sur une stat spécifique
                const bonus = Math.floor(this[info.bonusStat] * (info.bonusPercent / 100));
                this[info.bonusStat] += bonus;
            }

            // Recalculer les PV après application des bonus
            this.pvMax = Math.floor((this.force + this.defense) * 2.5);
            this.pv = this.pvMax;
        }
    }

    getRatio(){
        const total= this.victoires + this.defaites;
        return total === 0 ? 0 : Math.round((this.victoires / total) * 100);
    }

    calculateLevel(){
        return Math.floor(this.xp / 100) + 1;
    }

    getBadge(){
        const ratio = this.getRatio();
        const total = this.victoires + this.defaites;

        if (total < 5) return 'rookie';
        if(ratio >= 80 && total >= 10) return 'legend';
        if (ratio >= 70 && total >= 8) return 'champion';
        if (ratio >= 60 && total >= 5) return 'veteran';
        if (ratio >= 40) return 'fighter';
        return 'apprentice';
    }

    getBadgeText(){
        const badges = {
        'rookie': '🎖️ Recrue',
        'apprentice': '🥈 Apprenti',
        'fighter': '🏅 Combattant',
        'veteran': '🎖️ Vétéran',
        'champion': '👑 Champion',
        'legend': '🏆 Légende'
    };

    return badges[this.getBadge()] || '🎖️ Recrue';
}

    heal(){
        this.pv = this.pvMax;
        this.updatedAt = new Date().to|SOString();
    }

    takeDamage(damage){
        this.pv = Math.max(0, this.pv - damage);
        this.updatedAt = new Date().to|SOString();
        return this.pv;
    }

    gainXp(amount){
        this.xp += amount;
        const newLevel = this.calculateLevel();
        if (newLevel > this.niveau){
            this.niveau = newLevel;
            this.levelUp();
        
    }
    this.updatedAt = new Date().to|SOString();
}
levelUp(){
    const bonus = Math.floor(Math.random() * 3) + 1;
    const stats = ['force','agility','magic','defense'];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];

    this[randomStat] += bonus;
    this.pvMax = Math.floor((this.force + this.defense) * 2.5);
    this.pv = this.pvMax;

    return { stat: randomStat, bonus};
}

getPowerLevel(){
    return this.force + this.agility + this.magic + this.defense + (this.niveau * 5);
}

toJSON(){
    return {
        id: this.id,
        nom: this.nom,
    avatar: this.avatar,
    class: this.class,
    force: this.force,
    agility: this.agility,
    magic: this.magic,
    defense: this.defense,
    pvMax: this.pvMax,
    pv: this.pv,
    victoires: this.victoires,
    defaites: this.defaites,
    xo: this.xp,
    niveau: this.niveau,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    };
}

static fromJSON(data){
    const hero = createHero(
        data.nom,
        data.avatar,
        data.classe,
        data.force,
        data.agility,
        data.magic,
        data.defense
    );

    hero.id = data.id || hero.id;
    hero.pvMax = data.pvMax || hero.pvMax;
    hero.pv = data.pv !== undefined ? data.pv : hero.pv;
    hero.victoires = data.victoires !== undefined ? data.victoires: 0;
    hero.defaites = data.defaites !== undefined ? data.defaites: 0;
    hero.xp = data.xp !== undefined ? data.xp: 0;
    hero.niveau = data.niveau !== undefined ? data.niveau: 1;
    hero.createdAt = data.createdAt || hero.createdAt;
    hero.updatedAt = data.updatedAt || hero.updatedAt;

    return hero;
}

isValid(){
    const total = this.force + this.agility + this.magic + this.defense;
    return this.nom &&
    this.nom.length > 0 &&
    this.classe &&
    total >= 80 && total <= 120 &&
    this.force >= 10 && this.agility >= 10 &&
    this.magic >= 10 && this.defence >= 10;
}
}

// Classes spécialisées

export class Assassin extends Hero {
    constructor(nom, avatar, force, agility, magic, defense){
        super(nom, avatar,'Assassin', force, agility, magic, defense);
        this.criticalChance = 25; // 25% de chance de critique
        this.dodgeBonus = 0; // Bonus d'esquive temporaire
        this.shadowStrikeTurns = 0; //Tours restants pour le pouvoir
}

activatePower(){
    this.shadowStrikeTurns = 3;
    this.dodgeBonus = 15;
    return {
        type: 'shadow_strike',
        duration: 3,
        effect: 'Frappe Mortelle activée ! +25% critique et +15% esquive'

    };
}

checkCritical(){
    return Math.random() * 100 < this.criticalChance;

}

getDodgeChance(){
    const baseChance = Math.floor(this.agility / 10);
    return baseChance + this.dodgeBonus;

}

updateEffects(){
    if (this.shadowStrikeTurns > 0){
        this.shadowStrikeTurns--;
        if(this.shadowStrikeTurns === 0){
            this.dodgeBonus = 0;
        }
    }
}
}

export class Druide extends Hero {
    constructor(nom, avatar, force, agility, magic, defense){
        super(nom, avatar, 'Druide', force, agility, magic, defense);
        this.symbiosisActive = false;
        this.symbiosisTurns = 0;
        this.defenseBonus = 0;
        this.healingRate = 0.1; // 10% des PV max
    }

    activatePower(){
        this.symbiosisActive = true;
        this.symbiosisTurns = 5;
        this.defenseBonus = Math.floor(this.defense * 0.25) // +25% défense
        return {
            type: 'symbiosis',
            duration: 5,
            effect: 'Symbiose Naturelle ! Régénération 10% PV/tour + 25% défense'

        };

    }

    processSymbiosis(){
        if (this.symbiosisActive && this.symbiosisTurn > 0 ){
            const healing = Math.floor(this.pvMax * this.healingRate);
            const oldPv = this.pv;
            this.pv = Math.min(this.pvMax, thispv + healing);

            this.symbiosisTurns--;
            if (this.symbiosisTurns === 0){
                this.symbiosisActive = false;
                this.defenseBonus = 0;
            }

            return {
                healed: this.pv - oldPv,
                turnsLeft: this.symbiosisTurns
            };
        }
        return null;
    }

    getTotalDefense(){
        return this.defense + this.defenseBonus;

    }

}

// Factory function pour créer les héros selon leur classe
export function createHero(nom, avatar, classe, force, agility, magic, defence){
    switch(classe){
        case 'Assassin':
        return new Assassin(nom, avatar, force, agility, magic, defense);
        case 'Druide':
            return new Druide(nom, avatar, force, agility, magic, defense);
            default:
                return new Hero(nom, avatar, classe, force, agility,magic, defense)

    }
}