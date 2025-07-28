// Système de combat - Heroes Arena

import { AppState, gameConfig } from '../core/config.js';
import { randomBetween, delay } from '../core/utils.js';
import { combatEffects } from './combat-effects.js';
import { uiManager } from './ui.js';

export class CombatSystem {
    constructor() {
        this.currentCombat = null;
        this.combatLog = [];
        this.isRunning = false;
        this.onLogUpdate = null;
    }
    
    async startCombat(fighter1, fighter2) {
        if (this.isRunning) {
            return { success: false, error: 'Un combat est déjà en cours' };
        }
        
        if (!fighter1 || !fighter2) {
            return { success: false, error: 'Deux combattants sont requis' };
        }
        
        if (fighter1.id === fighter2.id) {
            return { success: false, error: 'Un héros ne peut pas combattre contre lui-même' };
        }
        
        this.currentCombat = {
            id: this.generateCombatId(),
            fighter1: this.cloneHero(fighter1),
            fighter2: this.cloneHero(fighter2),
            originalFighter1: fighter1,
            originalFighter2: fighter2,
            round: 0,
            startTime: new Date().toISOString(),
            log: []
        };
        
        this.currentCombat.fighter1.heal();
        this.currentCombat.fighter2.heal();
        
        this.isRunning = true;
        this.combatLog = [];
        
        // Initialiser les effets visuels de combat
        console.log('🎨 Initialisation forcée des effets de combat...');
        combatEffects.forceInit();
        
        this.addLogEntry(`🏟️ NOUVEAU COMBAT ! ${fighter1.nom} VS ${fighter2.nom}`, 'info');
        this.addLogEntry(`⚔️ Que le meilleur gagne !`, 'info');
        this.addLogEntry(`${fighter1.nom}: ${this.currentCombat.fighter1.pv}/${this.currentCombat.fighter1.pvMax} PV`, 'info');
        this.addLogEntry(`${fighter2.nom}: ${this.currentCombat.fighter2.pv}/${this.currentCombat.fighter2.pvMax} PV`, 'info');
        
        try {
            const result = await this.runCombat();
            return { success: true, result };
        } catch (error) {
            this.isRunning = false;
            return { success: false, error: error.message };
        }
    }
    
    cloneHero(hero) {
        return {
            id: hero.id,
            nom: hero.nom,
            classe: hero.classe,
            avatar: hero.avatar,
            force: hero.force,
            agility: hero.agility,
            magic: hero.magic,
            defense: hero.defense,
            pvMax: hero.pvMax,
            pv: hero.pv,
            victoires: hero.victoires,
            defaites: hero.defaites,
            niveau: hero.niveau,
            heal: function() {
                this.pv = this.pvMax;
            },
            takeDamage: function(damage) {
                this.pv = Math.max(0, this.pv - damage);
                return this.pv;
            }
        };
    }
    
    async runCombat() {
        while (this.isRunning && this.currentCombat.round < gameConfig.maxCombatRounds) {
            const roundResult = await this.executeRound();
            
            if (roundResult.finished) {
                return this.endCombat(roundResult);
            }
            
            await delay(gameConfig.combatDelay);
        }
        
        this.addLogEntry('⏰ Combat trop long ! Match nul par épuisement.', 'info');
        return this.endCombat({ draw: true });
    }
    
    async executeRound() {
        this.currentCombat.round++;
        this.addLogEntry(`--- Round ${this.currentCombat.round} ---`, 'info');
        await delay(600);
        
        const { fighter1, fighter2 } = this.currentCombat;
        
        // Traiter les effets continus des nouvelles classes
        await this.processOngoingEffects(fighter1);
        await this.processOngoingEffects(fighter2);
        
        const f1Speed = fighter1.agility + randomBetween(0, 10);
        const f2Speed = fighter2.agility + randomBetween(0, 10);
        
        let firstAttacker, secondAttacker;
        if (f1Speed >= f2Speed) {
            firstAttacker = fighter1;
            secondAttacker = fighter2;
            this.addLogEntry(`⚡ ${firstAttacker.nom} prend l'initiative !`, 'info');
        } else {
            firstAttacker = fighter2;
            secondAttacker = fighter1;
            this.addLogEntry(`⚡ ${firstAttacker.nom} prend l'initiative !`, 'info');
        }
        
        await delay(500);
        
        if (secondAttacker.pv > 0) {
            this.addLogEntry(`🎯 ${firstAttacker.nom} s'apprête à attaquer ${secondAttacker.nom}`, 'info');
            await delay(400);
            await this.executeAttack(firstAttacker, secondAttacker);
            
            if (secondAttacker.pv <= 0) {
                await delay(600);
                this.addLogEntry(`💥 ${secondAttacker.nom} ne peut plus combattre !`, 'attack');
                return { finished: true, winner: firstAttacker, loser: secondAttacker };
            }
        }
        
        await delay(800);
        
        if (firstAttacker.pv > 0 && secondAttacker.pv > 0) {
            this.addLogEntry(`🎯 ${secondAttacker.nom} contre-attaque !`, 'info');
            await delay(400);
            await this.executeAttack(secondAttacker, firstAttacker);
            
            if (firstAttacker.pv <= 0) {
                await delay(600);
                this.addLogEntry(`💥 ${firstAttacker.nom} ne peut plus combattre !`, 'attack');
                return { finished: true, winner: secondAttacker, loser: firstAttacker };
            }
        }
        
        return { finished: false };
    }
    
    async executeAttack(attacker, defender) {
        // Appliquer les effets visuels
        const attackerId = attacker.id === this.currentCombat.fighter1.id ? 'fighter1Display' : 'fighter2Display';
        const defenderId = defender.id === this.currentCombat.fighter1.id ? 'fighter1Display' : 'fighter2Display';
        
        // Animation d'attaque
        uiManager.applyAttackingEffect(attackerId);
        
        // Also apply improved arena animation if available
        const attackerFighterId = attacker.id === this.currentCombat.fighter1.id ? 'fighter1' : 'fighter2';
        const defenderFighterId = defender.id === this.currentCombat.fighter1.id ? 'fighter1' : 'fighter2';
        
        if (uiManager.setCombatStateImproved) {
            uiManager.setCombatStateImproved(attackerFighterId + 'Display', 'attacking');
            uiManager.setCombatStateImproved(defenderFighterId + 'Display', 'defending');
        }
        
        await delay(gameConfig.attackAnimationDelay);
        
        // Vérifier si c'est un pouvoir spécial
        const powerUsed = this.checkSpecialPower(attacker, defender);
        
        if (powerUsed) {
            // Animation de défense pour les pouvoirs
            uiManager.applyDefendingEffect(defenderId);
            await delay(gameConfig.effectsDelay);
            return;
        }
        
        const attackType = Math.random() < 0.7 ? 'normal' : 'special';
        
        // Animation de défense
        uiManager.applyDefendingEffect(defenderId);
        await delay(gameConfig.damageAnimationDelay);
        
        if (attackType === 'normal') {
            this.normalAttack(attacker, defender);
        } else {
            this.specialAttack(attacker, defender);
        }
        
        // Pause après l'attaque pour voir les effets
        await delay(gameConfig.effectsDelay);
    }
    
    async normalAttack(attacker, defender) {
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Vérifier esquive d'abord
        const dodgeChance = this.getDodgeChance(defender);
        if (Math.random() * 100 < dodgeChance) {
            this.addLogEntry(`${attacker.nom} attaque ${defender.nom}...`, 'attack');
            await delay(300);
            
            combatEffects.createDodgeEffect(defenderSide);
            await delay(200);
            
            this.addLogEntry(`💨 ${defender.nom} esquive l'attaque !`, 'dodge');
            return;
        }
        
        // Vérifier blocage
        const blockChance = this.getBlockChance(defender);
        if (Math.random() * 100 < blockChance) {
            const baseDamage = Math.floor(attacker.force * (0.8 + Math.random() * 0.4));
            const reducedDamage = Math.max(1, Math.floor(baseDamage * 0.3)); // Blocage réduit de 70%
            
            const oldHp = defender.pv;
            defender.takeDamage(reducedDamage);
            
            this.addLogEntry(`${attacker.nom} attaque ${defender.nom}...`, 'attack');
            await delay(300);
            
            // Effet de blocage selon la classe
            const blockType = defender.classe === 'Paladin' ? 'shield' : 
                             defender.classe === 'Guerrier' ? 'parry' : 'armor';
            combatEffects.createBlockEffect(defenderSide, blockType);
            await delay(200);
            
            combatEffects.showDamageNumber(reducedDamage, defenderSide, 'normal');
            combatEffects.animateHealthBar(
                defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
                oldHp, defender.pv, defender.pvMax
            );
            
            // Update improved arena health bar if available
            const defenderFighterId = defender.id === this.currentCombat.fighter1.id ? 'fighter1' : 'fighter2';
            if (uiManager.updateHealthBarImproved) {
                uiManager.updateHealthBarImproved(defenderFighterId + 'Display', defender.pv, defender.pvMax);
            }
            
            this.addLogEntry(`🛡️ ${defender.nom} bloque ! Seulement ${reducedDamage} dégâts !`, 'defense');
            return;
        }
        
        // Attaque normale réussie
        const baseDamage = Math.floor(attacker.force * (0.8 + Math.random() * 0.4));
        const defense = Math.floor(defender.defense * (0.5 + Math.random() * 0.3));
        const finalDamage = Math.max(1, baseDamage - defense);
        
        const oldHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        // Log d'attaque d'abord
        this.addLogEntry(`${attacker.nom} attaque ${defender.nom}...`, 'attack');
        await delay(300);
        
        // Effets visuels améliorés - utiliser le type d'arme spécifique
        const weaponType = this.getWeaponType(attacker.classe);
        combatEffects.createPhysicalAttackEffect(attackerSide, weaponType, finalDamage);
        await delay(200);
        
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'normal');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldHp, defender.pv, defender.pvMax
        );
        
        // Update improved arena health bar if available
        const defenderFighterId = defender.id === this.currentCombat.fighter1.id ? 'fighter1' : 'fighter2';
        if (uiManager.updateHealthBarImproved) {
            uiManager.updateHealthBarImproved(defenderFighterId + 'Display', defender.pv, defender.pvMax);
        }
        
        // Log des dégâts
        this.addLogEntry(`💥 ${finalDamage} dégâts infligés !`, 'attack');
    }
    
    async specialAttack(attacker, defender) {
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Vérifier esquive d'abord pour les attaques spéciales
        const dodgeChance = this.getDodgeChance(defender) * 0.7; // Réduire la chance d'esquiver les attaques spéciales
        if (Math.random() * 100 < dodgeChance) {
            this.addLogEntry(`⚡ ${attacker.nom} charge une attaque spéciale...`, 'special');
            await delay(400);
            
            combatEffects.createDodgeEffect(defenderSide);
            await delay(200);
            
            this.addLogEntry(`💨 ${defender.nom} esquive l'attaque spéciale !`, 'dodge');
            return;
        }
        
        const specialMultiplier = 1.5 + (attacker.magic / 100);
        const baseDamage = Math.floor(attacker.force * specialMultiplier);
        const defense = Math.floor(defender.defense * 0.7);
        const finalDamage = Math.max(1, baseDamage - defense);
        
        const oldHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        // Log d'attaque spéciale
        this.addLogEntry(`⚡ ${attacker.nom} charge une attaque spéciale...`, 'special');
        await delay(400);
        
        // Effets visuels synchronisés avec le nouveau système d'armes
        const weaponType = this.getWeaponType(attacker.classe);
        combatEffects.createPhysicalAttackEffect(attackerSide, weaponType, finalDamage);
        
        // Ajouter un effet supplémentaire pour rendre l'attaque spéciale plus spectaculaire
        await delay(150);
        combatEffects.createAttackEffect(attackerSide, 'special', finalDamage);
        await delay(300);
        
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'special');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldHp, defender.pv, defender.pvMax
        );
        
        // Log des dégâts
        this.addLogEntry(`✨ ${finalDamage} dégâts spéciaux infligés !`, 'special');
    }
    
    checkSpecialPower(attacker, defender) {
        const powerChance = 0.25;
        const adjustedChance = powerChance + (attacker.magic / 200);
        const healthPercent = attacker.pv / attacker.pvMax;
        
        const finalChance = healthPercent < 0.4 ? adjustedChance * 2 : adjustedChance;
        
        if (Math.random() < finalChance) {
            this.activateSpecialPower(attacker, defender);
            return true;
        }
        
        return false;
    }
    
    async activateSpecialPower(attacker, defender) {
        switch (attacker.classe) {
            case 'Guerrier':
                await this.activateRageBerserker(attacker, defender);
                break;
            case 'Mage':
                await this.activateShieldMaster(attacker, defender);
                break;
            case 'Archer':
                await this.activateDeadlyShot(attacker, defender);
                break;
            case 'Paladin':
                await this.activateLightGuardian(attacker, defender);
                break;
            case 'Assassin':
                await this.activateShadowStrike(attacker, defender);
                break;
            case 'Druide':
                await this.activateNaturalSymbiosis(attacker, defender);
                break;
            default:
                await this.normalAttack(attacker, defender);
        }
    }
    
    async activateRageBerserker(attacker, defender) {
        const rageDamage = Math.floor(attacker.force * 2);
        const finalDamage = Math.max(1, rageDamage - Math.floor(defender.defense * 0.5));
        
        // Log d'activation
        this.addLogEntry(`🔥 ${attacker.nom} entre en RAGE BERSERKER !`, 'power');
        await delay(600);
        
        const oldHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        // Effets visuels étalés avec nouveau système classique
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Utiliser l'effet spécifique de classe Guerrier
        combatEffects.createClassSpecialEffect(attackerSide, 'Guerrier', finalDamage);
        await delay(300);
        
        combatEffects.screenShake(8, 400);
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'power');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldHp, defender.pv, defender.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`💥 ${finalDamage} dégâts dévastateurs !`, 'power');
    }
    
    async activateShieldMaster(attacker, defender) {
        const magicDamage = Math.floor(attacker.magic * 1.5);
        const finalDamage = Math.max(1, magicDamage - Math.floor(defender.defense * 0.3));
        
        // Log d'activation
        this.addLogEntry(`🛡️ ${attacker.nom} invoque un BOUCLIER MAGIQUE !`, 'power');
        await delay(600);
        
        const oldDefenderHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        const healing = Math.floor(attacker.magic * 0.5);
        const oldAttackerHp = attacker.pv;
        attacker.pv = Math.min(attacker.pvMax, attacker.pv + healing);
        
        // Effets visuels étalés avec nouveau système classique
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Utiliser l'effet spécifique de classe Mage
        combatEffects.createClassSpecialEffect(attackerSide, 'Mage', finalDamage);
        await delay(400);
        
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'special');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldDefenderHp, defender.pv, defender.pvMax
        );
        
        // Soins avec effet visuel de guérison
        await delay(300);
        combatEffects.createHealingEffect(attackerSide, healing);
        combatEffects.showDamageNumber(healing, attackerSide, 'heal');
        combatEffects.animateHealthBar(
            attackerSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldAttackerHp, attacker.pv, attacker.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`✨ ${finalDamage} dégâts et +${healing} PV !`, 'power');
    }
    
    async activateDeadlyShot(attacker, defender) {
        const precision = attacker.agility + attacker.force;
        const criticalChance = Math.min(0.8, precision / 100);
        
        let damage = Math.floor(attacker.force * 1.8);
        const oldHp = defender.pv;
        let isCritical = false;
        
        // Log de préparation
        this.addLogEntry(`🏹 ${attacker.nom} vise soigneusement...`, 'power');
        await delay(800);
        
        if (Math.random() < criticalChance) {
            damage *= 2;
            isCritical = true;
            this.addLogEntry(`🎯 TIR CRITIQUE MORTEL !`, 'power');
        } else {
            this.addLogEntry(`🏹 TIR MORTEL !`, 'power');
        }
        
        await delay(400);
        defender.takeDamage(damage);
        
        // Effets visuels étalés avec nouveau système classique
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Utiliser l'effet spécifique de classe Archer
        combatEffects.createClassSpecialEffect(attackerSide, 'Archer', damage);
        await delay(300);
        
        if (isCritical) {
            combatEffects.screenShake(10, 500);
        }
        
        combatEffects.showDamageNumber(damage, defenderSide, isCritical ? 'critical' : 'power');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldHp, defender.pv, defender.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`💥 ${damage} dégâts infligés !`, 'power');
    }
    
    async activateLightGuardian(attacker, defender) {
        const holyDamage = Math.floor((attacker.magic + attacker.defense) * 0.9);
        const finalDamage = Math.max(1, holyDamage - Math.floor(defender.defense * 0.4));
        
        // Log d'activation
        this.addLogEntry(`✨ ${attacker.nom} canalise la LUMIÈRE DIVINE !`, 'power');
        await delay(700);
        
        const oldDefenderHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        const healing = Math.floor(attacker.magic * 0.8);
        const oldAttackerHp = attacker.pv;
        attacker.pv = Math.min(attacker.pvMax, attacker.pv + healing);
        
        // Effets visuels étalés avec nouveau système classique
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Utiliser l'effet spécifique de classe Paladin
        combatEffects.createClassSpecialEffect(attackerSide, 'Paladin', finalDamage);
        await delay(400);
        
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'special');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldDefenderHp, defender.pv, defender.pvMax
        );
        
        // Guérison divine avec effet visuel
        await delay(400);
        combatEffects.createHealingEffect(attackerSide, healing);
        combatEffects.showDamageNumber(healing, attackerSide, 'heal');
        combatEffects.animateHealthBar(
            attackerSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldAttackerHp, attacker.pv, attacker.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`🔆 ${finalDamage} dégâts sacrés et +${healing} PV !`, 'power');
    }
    
    async activateShadowStrike(attacker, defender) {
        // Activer le pouvoir de l'assassin
        if (attacker.activatePower) {
            const powerResult = attacker.activatePower();
            this.addLogEntry(`🗡️ ${attacker.nom} active ${powerResult.effect}`, 'power');
            await delay(600);
        }
        
        // Vérifier le critique
        const isCritical = attacker.checkCritical ? attacker.checkCritical() : Math.random() < 0.25;
        const baseMultiplier = isCritical ? 2.0 : 1.0;
        
        // Vérifier l'esquive du défenseur
        const defenderDodge = defender.getDodgeChance ? defender.getDodgeChance() : Math.floor(defender.agility / 10);
        const dodged = Math.random() * 100 < defenderDodge;
        
        if (dodged) {
            this.addLogEntry(`💨 ${defender.nom} esquive l'attaque sournoise !`, 'info');
            await delay(400);
            return;
        }
        
        const baseDamage = Math.floor(attacker.force * baseMultiplier);
        const defense = Math.floor(defender.defense * 0.6); // L'assassin perce la défense
        const finalDamage = Math.max(1, baseDamage - defense);
        
        const oldHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        // Effets visuels
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        if (isCritical) {
            this.addLogEntry(`⚡ CRITIQUE ! Frappe mortelle dans l'ombre !`, 'power');
            combatEffects.createClassSpecialEffect(attackerSide, 'Assassin', finalDamage);
            await delay(300);
            combatEffects.showDamageNumber(finalDamage, defenderSide, 'critical');
        } else {
            this.addLogEntry(`🗡️ Attaque furtive précise !`, 'power');
            combatEffects.createClassSpecialEffect(attackerSide, 'Assassin', finalDamage);
            await delay(300);
            combatEffects.showDamageNumber(finalDamage, defenderSide, 'special');
        }
        
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldHp, defender.pv, defender.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`🎯 ${finalDamage} dégâts ${isCritical ? 'critiques' : 'furtifs'} !`, 'power');
    }
    
    async activateNaturalSymbiosis(attacker, defender) {
        // Activer le pouvoir du druide
        if (attacker.activatePower) {
            const powerResult = attacker.activatePower();
            this.addLogEntry(`🌿 ${attacker.nom} active ${powerResult.effect}`, 'power');
            await delay(600);
        }
        
        // Attaque équilibrée avec bonus de défense
        const balancedDamage = Math.floor((attacker.force + attacker.magic) * 0.8);
        const totalDefense = attacker.getTotalDefense ? attacker.getTotalDefense() : defender.defense;
        const finalDamage = Math.max(1, balancedDamage - Math.floor(totalDefense * 0.7));
        
        const oldDefenderHp = defender.pv;
        defender.takeDamage(finalDamage);
        
        // Régénération immédiate
        const oldAttackerHp = attacker.pv;
        const immediateHealing = Math.floor(attacker.pvMax * 0.15); // 15% immédiat
        attacker.pv = Math.min(attacker.pvMax, attacker.pv + immediateHealing);
        
        // Effets visuels
        const attackerSide = attacker.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        const defenderSide = defender.id === this.currentCombat.fighter1.id ? 'left' : 'right';
        
        // Attaque naturelle avec effet spécifique de classe Druide
        this.addLogEntry(`🌱 Attaque en symbiose avec la nature !`, 'power');
        combatEffects.createClassSpecialEffect(attackerSide, 'Druide', finalDamage);
        await delay(400);
        
        combatEffects.showDamageNumber(finalDamage, defenderSide, 'special');
        combatEffects.animateHealthBar(
            defenderSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldDefenderHp, defender.pv, defender.pvMax
        );
        
        // Régénération avec effet visuel de guérison
        await delay(400);
        this.addLogEntry(`🍃 Régénération naturelle instantanée !`, 'power');
        combatEffects.createHealingEffect(attackerSide, immediateHealing);
        combatEffects.showDamageNumber(immediateHealing, attackerSide, 'heal');
        combatEffects.animateHealthBar(
            attackerSide === 'left' ? 'fighter1Display' : 'fighter2Display',
            oldAttackerHp, attacker.pv, attacker.pvMax
        );
        
        await delay(200);
        this.addLogEntry(`🌿 ${finalDamage} dégâts naturels et +${immediateHealing} PV !`, 'power');
    }
    
    async processOngoingEffects(fighter) {
        // Traiter les effets de l'Assassin
        if (fighter.updateEffects) {
            fighter.updateEffects();
        }
        
        // Traiter les effets du Druide
        if (fighter.processSymbiosis) {
            const symbiosisResult = fighter.processSymbiosis();
            if (symbiosisResult && symbiosisResult.healed > 0) {
                this.addLogEntry(`🌿 ${fighter.nom} régénère ${symbiosisResult.healed} PV (${symbiosisResult.turnsLeft} tours restants)`, 'heal');
                
                // Effets visuels de régénération
                const fighterSide = fighter.id === this.currentCombat.fighter1.id ? 'left' : 'right';
                const fighterId = fighter.id === this.currentCombat.fighter1.id ? 'fighter1Display' : 'fighter2Display';
                
                combatEffects.createHealingEffect(fighterSide, symbiosisResult.healed);
                combatEffects.animateHealthBar(fighterId, fighter.pv - symbiosisResult.healed, fighter.pv, fighter.pvMax);
                await delay(400);
            }
        }
        
        // Traiter les effets de poison (si implémentés dans les classes)
        if (fighter.poisonDamage && fighter.poisonDamage > 0) {
            const poisonDamage = Math.floor(fighter.poisonDamage);
            fighter.takeDamage(poisonDamage);
            fighter.poisonDamage = Math.max(0, fighter.poisonDamage - 1);
            
            const fighterSide = fighter.id === this.currentCombat.fighter1.id ? 'left' : 'right';
            const fighterId = fighter.id === this.currentCombat.fighter1.id ? 'fighter1Display' : 'fighter2Display';
            
            this.addLogEntry(`☠️ ${fighter.nom} subit ${poisonDamage} dégâts de poison`, 'attack');
            combatEffects.createPoisonEffect(fighterSide);
            combatEffects.showDamageNumber(poisonDamage, fighterSide, 'poison');
            combatEffects.animateHealthBar(fighterId, fighter.pv + poisonDamage, fighter.pv, fighter.pvMax);
            await delay(400);
        }
    }
    
    async endCombat(result) {
        this.isRunning = false;
        const { winner, loser, draw } = result;
        
        this.currentCombat.endTime = new Date().toISOString();
        
        if (draw) {
            // Mise en scène du match nul
            await delay(800);
            this.addLogEntry('⏰ Les deux combattants s\'effondrent d\'épuisement...', 'info');
            await delay(1000);
            this.addLogEntry('🤝 MATCH NUL !', 'info');
            await delay(600);
            this.addLogEntry('🌟 Les deux héros ont montré une bravoure exceptionnelle !', 'info');
            this.currentCombat.result = 'draw';
        } else {
            // Mise en scène spectaculaire de la victoire
            await delay(1000);
            this.addLogEntry(`💔 ${loser.nom} s'effondre, vaincu...`, 'attack');
            await delay(800);
            
            // Appliquer les effets visuels de fin de combat
            const winnerId = winner.id === this.currentCombat.originalFighter1.id ? 'fighter1Display' : 'fighter2Display';
            const loserId = loser.id === this.currentCombat.originalFighter1.id ? 'fighter1Display' : 'fighter2Display';
            
            uiManager.applyDefeatEffect(loserId);
            await delay(1200);
            
            // Apply improved arena victory/defeat effects if available
            const winnerFighterId = winner.id === this.currentCombat.originalFighter1.id ? 'fighter1' : 'fighter2';
            const loserFighterId = loser.id === this.currentCombat.originalFighter1.id ? 'fighter1' : 'fighter2';
            
            if (uiManager.setCombatStateImproved) {
                uiManager.setCombatStateImproved(winnerFighterId + 'Display', 'victory');
                uiManager.setCombatStateImproved(loserFighterId + 'Display', 'defeat');
            }
            
            this.addLogEntry(`🏆 ${winner.nom} REMPORTE LE COMBAT !`, 'info');
            uiManager.applyVictoryEffect(winnerId);
            combatEffects.screenShake(6, 600);
            await delay(1500);
            
            // Mise à jour des statistiques avec cérémonie
            this.updateHeroStats(winner, loser);
            
            const originalWinner = winner.id === this.currentCombat.originalFighter1.id ? 
                this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
            const originalLoser = loser.id === this.currentCombat.originalFighter1.id ? 
                this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
            
            this.addLogEntry(`🎖️ ${originalWinner.nom} gagne de l'expérience et monte en puissance !`, 'info');
            await delay(800);
            this.addLogEntry(`📈 Nouveau badge : ${originalWinner.getBadgeText()}`, 'info');
            await delay(600);
            this.addLogEntry(`📊 Bilan - ${originalWinner.nom}: ${originalWinner.victoires}V/${originalWinner.defaites}D (${originalWinner.getRatio()}%)`, 'info');
            await delay(400);
            this.addLogEntry(`📊 Bilan - ${originalLoser.nom}: ${originalLoser.victoires}V/${originalLoser.defaites}D (${originalLoser.getRatio()}%)`, 'info');
            await delay(600);
            
            this.currentCombat.result = 'victory';
            this.currentCombat.winner = originalWinner;
            this.currentCombat.loser = originalLoser;
        }
        
        await delay(800);
        this.addLogEntry('✨ === FIN DU COMBAT ===', 'info');
        await delay(400);
        this.addLogEntry('💾 Résultats sauvegardés automatiquement.', 'info');
        
        // Préparer les données pour la modal
        const combatResult = {
            ...this.currentCombat,
            log: [...this.combatLog],
            draw: draw,
            winner: winner,
            loser: loser
        };
        
        if (!draw) {
            combatResult.originalWinner = winner.id === this.currentCombat.originalFighter1.id ? 
                this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
            combatResult.originalLoser = loser.id === this.currentCombat.originalFighter1.id ? 
                this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
        }
        
        // Afficher la modal après un délai pour laisser le temps de voir les derniers logs
        setTimeout(() => {
            if (this.onCombatEnd) {
                this.onCombatEnd(combatResult);
            }
        }, 2000);
        
        // Vider l'arène après un délai supplémentaire pour laisser le temps à l'utilisateur de voir le résultat
        const clearArenaDelay = gameConfig.clearArenaDelay || 5000; // Par défaut 5 secondes
        setTimeout(() => {
            uiManager.clearArena();
        }, clearArenaDelay);
        
        return combatResult;
    }
    
    updateHeroStats(winner, loser) {
        const originalWinner = winner.id === this.currentCombat.originalFighter1.id ? 
            this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
        const originalLoser = loser.id === this.currentCombat.originalFighter1.id ? 
            this.currentCombat.originalFighter1 : this.currentCombat.originalFighter2;
        
        originalWinner.victoires++;
        originalLoser.defaites++;
        
        const winnerXp = 50 + Math.floor(this.currentCombat.round * 5);
        const loserXp = 20 + Math.floor(this.currentCombat.round * 2);
        
        const winnerLevelBefore = originalWinner.niveau;
        const loserLevelBefore = originalLoser.niveau;
        
        originalWinner.gainXp(winnerXp);
        originalLoser.gainXp(loserXp);
        
        this.addLogEntry(`⭐ ${originalWinner.nom} gagne ${winnerXp} XP ! (Total: ${originalWinner.xp} XP)`, 'success');
        this.addLogEntry(`⭐ ${originalLoser.nom} gagne ${loserXp} XP ! (Total: ${originalLoser.xp} XP)`, 'info');
        
        if (originalWinner.niveau > winnerLevelBefore) {
            this.addLogEntry(`🎉 ${originalWinner.nom} passe au niveau ${originalWinner.niveau} !`, 'success');
        }
        
        if (originalLoser.niveau > loserLevelBefore) {
            this.addLogEntry(`🎉 ${originalLoser.nom} passe au niveau ${originalLoser.niveau} !`, 'success');
        }
        
        originalWinner.heal();
        originalLoser.heal();
        
        this.addLogEntry(`🎖️ ${originalWinner.nom} : ${originalWinner.getBadgeText()}`, 'info');
        this.addLogEntry(`🎖️ ${originalLoser.nom} : ${originalLoser.getBadgeText()}`, 'info');
    }
    
    stopCombat() {
        if (this.isRunning) {
            this.isRunning = false;
            this.addLogEntry('⏹️ Combat interrompu.', 'info');
            
            // Réinitialiser les effets visuels
            uiManager.resetCombatEffects();
            
            // Reset improved arena states if available
            if (uiManager.setCombatStateImproved) {
                uiManager.setCombatStateImproved('fighter1Display', 'ready');
                uiManager.setCombatStateImproved('fighter2Display', 'ready');
            }
            
            if (this.currentCombat) {
                this.currentCombat.endTime = new Date().toISOString();
                this.currentCombat.result = 'interrupted';
            }
        }
    }
    
    addLogEntry(message, type = 'info') {
        const entry = {
            id: this.generateLogId(),
            message,
            type,
            timestamp: new Date().toISOString(),
            round: this.currentCombat ? this.currentCombat.round : 0
        };
        
        this.combatLog.push(entry);
        
        if (this.currentCombat) {
            this.currentCombat.log.push(entry);
        }
        
        if (this.onLogUpdate) {
            this.onLogUpdate(entry);
        }
    }
    
    getCurrentCombat() {
        return this.currentCombat;
    }
    
    getCombatLog() {
        return [...this.combatLog];
    }
    
    clearCombatLog() {
        this.combatLog = [];
    }
    
    stopCombat() {
        if (this.isRunning) {
            this.isRunning = false;
            this.addLogEntry('⏹️ Combat interrompu', 'info');
            console.log('🛑 Combat arrêté manuellement');
        }
    }
    
    generateCombatId() {
        return 'combat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Déterminer le type d'arme selon la classe
    getWeaponType(heroClass) {
        const weaponMap = {
            'Guerrier': 'sword',
            'Mage': 'sword', // Les mages utilisent aussi des épées mais avec de la magie
            'Archer': 'bow',
            'Paladin': 'mace',
            'Assassin': 'dagger',
            'Druide': 'sword' // Les druides utilisent des armes basiques
        };
        return weaponMap[heroClass] || 'sword';
    }
    
    // Déterminer la probabilité d'esquive selon la classe
    getDodgeChance(defender) {
        const baseChance = Math.floor(defender.agility / 15);
        const classBonus = {
            'Assassin': 10,
            'Archer': 5,
            'Druide': 3,
            'Guerrier': 0,
            'Mage': 2,
            'Paladin': 0
        };
        return baseChance + (classBonus[defender.classe] || 0);
    }
    
    // Déterminer la probabilité de blocage selon la classe
    getBlockChance(defender) {
        const baseChance = Math.floor(defender.defense / 20);
        const classBonus = {
            'Paladin': 15,
            'Guerrier': 10,
            'Druide': 5,
            'Mage': 3,
            'Archer': 2,
            'Assassin': 0
        };
        return baseChance + (classBonus[defender.classe] || 0);
    }
    
    generateLogId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

export const combatSystem = new CombatSystem();