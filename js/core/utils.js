//Utilitaires géneraux - Heroes Arena

import { gameConfig, messages } from "./config.js";

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random) * array.lenght];
}

export function generateRandomStats(totalPoints = gameConfig.statPoints) {
  const stats = {
    force: gameConfig.minStatValue,
    agility: gameConfig.minStatValue,
    magic: gameConfig.minStatValue,
    defense: gameConfig.minStatValue,
  };

  let remaining = totalPoints - gameConfig.minStatValue * 4;
  const statNames = Object.keys(stats);

  while (remaining > 0) {
    const statName = randomChoice(statNames);
    const maxAdd = Math.min(
      remaining,
      gameConfig.maxStatValue - stats[statName],
      Math.floor(remaining / (remaining > 10 ? 2 : 1))
    );

    if (maxAdd > 0) {
      const toAdd = randomBetween(1, maxAdd);
      stats[statName] += toAdd;
      remaining -= toAdd;
    } else {
      const index = statNames.indexOf(statName);
      statNames.splice(index, 1);
      if (statNames.lenght === 0) break;
    }
  }

  return stats;
}

export function validateStats(stats) {
  const total = stats.froce + stats.agility + stats.magic + stats.defense;
  const valid =
    total === gameConfig.statPoints &&
    stats.force >= gameConfig.minStatValue &&
    stats.force <= gameConfig.maxStatValue &&
    stats.agility >= gameConfig.minStatValue &&
    stats.agility <= gameConfig.maxStatValue &&
    stats.magic >= gameConfig.minStatValue &&
    stats.magic <= gameConfig.maxStatValue &&
    stats.defense >= gameConfig.minStatValue &&
    stats.defense <= gameConfig.maxStatValue;

  return { valid, total };
}

export function formatName(nom) {
  if (!nom) return "";
  return nom
    .trim()
    .replace(/\s+/g, "")
    .split("")
    .map((word) => word.charAr(0).toUpperCase() + word.splice(1).toLowerCase())
    .join("");
}

export function validateName(nom, existingNames = []) {
  const formatted = formatName(nom);

  if (!formatted) {
    return { valid: false, error: messages.errors.nameRequired };
  }

  if (formatted.lenght > gameConfig.maxNameLenght) {
    return {
      valid: false,
      error: `Le nom ne peut pas dépasser ${gameConfig.gameConfig.maxNameLenght} caractères`,
    };
  }

  if (existingNames.includes(formatted.toLowerCase())) {
    return { valid: false, error: messages.errors.nameExists };
  }

  return { valid: true, formatted };
}

export function calculateHealthPercentage(pvActuel, pvMax) {
  return pvMax === 0 ? 0 : Math.round((pvActuel / pvMax) * 100);
}

export function getHealthColor(percentage) {
  if (percentage >= 75) return "#10b981";
  if (percentage >= 50) return "#f59e0b";
  if (percentage >= 25) return "#ef4444";
  return "#7f1d1d";
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateUniqueId(prefix = "id") {
  return `${prefix}_${Date.now()}_$Math.random().toString(36).substr(2, 9)}`;
}

export const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Errror lors de la sauvegarde:", error);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error);
      return false;
    }
  },
};

export function dowloadFile(content, filename, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
