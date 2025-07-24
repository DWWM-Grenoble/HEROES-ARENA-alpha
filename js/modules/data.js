// Gestionnaire de données - Heroes Arena

import { AppState, gameConfig, messages } from "../core/config.js";
import { Hero, createHero } from "../core/classes.js";
import { Storage, downloadFile, readFile } from "../core/utils.js";

const STORAGE_KEYS = {
  heroes: "heroesArena_heroes",
  settings: "heroesArena_settings",
  lastSync: "heroesArena_lastSync",
};

export class DataManager {
  constructor() {
    this.autoSaveInterval = null;
    this.isLoading = false;
    this.isSaving = false;
  }

  async loadHeroes() {
    if (this.isLoading) return { success: false, error: "Chargement en cours" };

    this.isLoading = true;

    try {
      const heroesData = Storage.get(STORAGE_KEYS.heroes, []);
      const heroes = [];

      for (const heroData of heroesData) {
        try {
          const hero = Hero.fromJSON(heroData);
          if (hero.isValid()) {
            heroes.push(hero);
          }
        } catch (error) {
          console.error("Erreur lors de la création du héros:", error);
        }
      }

      AppState.heroes = heroes;
      return { success: true, heroes, count: heroes.length };
    } catch (error) {
      console.error("Erreur lors du chargement des héros:", error);
      return { success: false, error: error.message };
    } finally {
      this.isLoading = false;
    }
  }

  async saveHeroes() {
    if (this.isSaving) return { success: false, error: "Sauvegarde en cours" };

    this.isSaving = true;

    try {
      const heroesData = AppState.heroes.map((hero) => hero.toJSON());
      const success = Storage.set(STORAGE_KEYS.heroes, heroesData);

      if (success) {
        Storage.set(STORAGE_KEYS.lastSync, new Date().toISOString());
        return { success: true, count: AppState.heroes.length };
      } else {
        return { success: false, error: "Erreur lors de la sauvegarde" };
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des héros:", error);
      return { success: false, error: error.message };
    } finally {
      this.isSaving = false;
    }
  }

  async addHero(heroData) {
    try {
      if (AppState.heroes.length >= gameConfig.maxHeroes) {
        return { success: false, error: messages.errors.maxHeroes };
      }

      const existingNames = AppState.heroes.map((h) => h.nom.toLowerCase());
      if (existingNames.includes(heroData.nom.toLowerCase())) {
        return { success: false, error: messages.errors.nameExists };
      }

      const hero = createHero(
        heroData.nom,
        heroData.avatar || "hero1.png",
        heroData.classe,
        heroData.force,
        heroData.agility,
        heroData.magic,
        heroData.defense
      );

      if (!hero.isValid()) {
        return { success: false, error: messages.errors.statsInvalid };
      }

      AppState.heroes.push(hero);
      await this.saveHeroes();

      return { success: true, hero };
    } catch (error) {
      console.error("Erreur lors de l'ajout du héros:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteHero(heroOrIndex) {
    try {
      let hero, index;

      if (typeof heroOrIndex === "number") {
        index = heroOrIndex;
        hero = AppState.heroes[index];
      } else {
        hero = heroOrIndex;
        index = AppState.heroes.findIndex((h) => h.id === hero.id);
      }

      if (index === -1 || !hero) {
        return { success: false, error: "Héros non trouvé" };
      }

      if (AppState.fighter1 && AppState.fighter1.id === hero.id) {
        AppState.fighter1 = null;
      }
      if (AppState.fighter2 && AppState.fighter2.id === hero.id) {
        AppState.fighter2 = null;
      }

      AppState.heroes.splice(index, 1);
      await this.saveHeroes();

      return { success: true, hero };
    } catch (error) {
      console.error("Erreur lors de la suppression du héros:", error);
      return { success: false, error: error.message };
    }
  }

  async clearAllHeroes() {
    try {
      const count = AppState.heroes.length;
      AppState.heroes = [];
      AppState.fighter1 = null;
      AppState.fighter2 = null;

      await this.saveHeroes();
      return { success: true, count };
    } catch (error) {
      console.error("Erreur lors de la suppression de tous les héros:", error);
      return { success: false, error: error.message };
    }
  }

  async exportToFile() {
    try {
      const data = {
        heroes: AppState.heroes.map((h) => h.toJSON()),
        exportDate: new Date().toISOString(),
        version: "2.0.0",
        totalHeroes: AppState.heroes.length,
      };

      const filename = `heroes-arena-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      downloadFile(JSON.stringify(data, null, 2), filename);

      return { success: true, filename, count: data.totalHeroes };
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      return { success: false, error: error.message };
    }
  }

  async importFromFile(file) {
    try {
      const content = await readFile(file);
      const data = JSON.parse(content);

      if (!data.heroes || !Array.isArray(data.heroes)) {
        return { success: false, error: "Format de fichier invalide" };
      }

      const importedHeroes = [];
      const errors = [];

      for (const heroData of data.heroes) {
        try {
          const hero = Hero.fromJSON(heroData);
          if (hero.isValid()) {
            const existingNames = [...AppState.heroes, ...importedHeroes].map(
              (h) => h.nom.toLowerCase()
            );
            if (!existingNames.includes(hero.nom.toLowerCase())) {
              importedHeroes.push(hero);
            } else {
              errors.push(`Héros "${hero.nom}" ignoré (nom déjà existant)`);
            }
          } else {
            errors.push(`Héros "${heroData.nom}" invalide`);
          }
        } catch (error) {
          errors.push(
            `Erreur lors de l'import de "${heroData.nom}": ${error.message}`
          );
        }
      }

      const totalAfterImport = AppState.heroes.length + importedHeroes.length;
      if (totalAfterImport > gameConfig.maxHeroes) {
        const maxImportable = gameConfig.maxHeroes - AppState.heroes.length;
        importedHeroes.splice(maxImportable);
        errors.push(`Limite de ${gameConfig.maxHeroes} héros atteinte`);
      }

      AppState.heroes.push(...importedHeroes);
      await this.saveHeroes();

      return {
        success: true,
        imported: importedHeroes.length,
        total: data.heroes.length,
        errors,
      };
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      return { success: false, error: error.message };
    }
  }

  startAutoSave(interval = gameConfig.autoSaveInterval) {
    this.stopAutoSave();

    this.autoSaveInterval = setInterval(async () => {
      if (AppState.heroes.length > 0) {
        await this.saveHeroes();
      }
    }, interval);

    console.log(`🔄 Sauvegarde automatique activée`);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  getStats() {
    const stats = {
      total: AppState.heroes.length,
      byClass: {},
      totalBattles: 0,
      totalVictories: 0,
      totalDefeats: 0,
      averageLevel: 0,
      bestRatio: 0,
      topFighter: null,
    };

    if (AppState.heroes.length === 0) return stats;

    AppState.heroes.forEach((hero) => {
      stats.byClass[hero.classe] = (stats.byClass[hero.classe] || 0) + 1;
      stats.totalBattles += hero.victoires + hero.defaites;
      stats.totalVictories += hero.victoires;
      stats.totalDefeats += hero.defaites;
      stats.averageLevel += hero.niveau;

      const ratio = hero.getRatio();
      if (ratio > stats.bestRatio && hero.victoires + hero.defaites >= 3) {
        stats.bestRatio = ratio;
        stats.topFighter = hero;
      }
    });

    stats.averageLevel = Math.round(
      stats.averageLevel / AppState.heroes.length
    );

    return stats;
  }
}

export const dataManager = new DataManager();
