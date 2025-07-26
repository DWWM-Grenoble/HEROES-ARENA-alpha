// Chargeur d'application - Heroes Arena
// Ce fichier gère l'initialisation et les fonctions globales de l'application

// Objet temporaire pour éviter les erreurs pendant le chargement
window.HeroesArena = {
    showSection: () => console.log('Chargement...'),
    showAvatarCategory: () => console.log('Chargement...'),
    updateClassInfo: () => console.log('Chargement...'),
    updateStats: () => console.log('Chargement...'),
    randomStats: () => console.log('Chargement...'),
    updateFighters: () => console.log('Chargement...'),
    createHeroFromForm: () => console.log('Chargement...'),
    filterHeroes: () => console.log('Chargement...'),
    exportData: () => console.log('Chargement...'),
    loadData: () => console.log('Chargement...'),
    clearAllData: () => console.log('Chargement...'),
    createDemoHeroes: () => console.log('Chargement...'),
    startCombat: () => console.log('Chargement...'),
    resetArena: () => console.log('Chargement...'),
    stopCombat: () => console.log('Chargement...'),
    showHeroDetails: () => console.log('Chargement...'),
    healHero: () => console.log('Chargement...'),
    deleteHero: () => console.log('Chargement...'),
    ui: { selectAvatar: () => console.log('Chargement...') }
};

// Configuration pour l'initialisation
const APP_CONFIG = {
    maxInitAttempts: 3,
    retryDelay: 1000,
    initModulePath: './init-refactored.js'
};

// Protection contre les erreurs d'extension browser
let initializationAttempts = 0;

/**
 * Fonction principale d'initialisation de l'application
 */
async function initializeApp() {
    try {
        initializationAttempts++;
        console.log(`🔄 Tentative d'initialisation ${initializationAttempts}/${APP_CONFIG.maxInitAttempts}`);
        
        // Initialiser l'application refactorisée
        const { initHeroesArenaRefactored } = await import(APP_CONFIG.initModulePath);
        const app = await initHeroesArenaRefactored();
        
        // L'objet HeroesArena est déjà défini dans init-refactored.js
        if (window.HeroesArena) {
            console.log('✅ HeroesArena refactorisé correctement exposé');
        } else {
            console.warn('⚠️ HeroesArena non exposé, correction...');
            window.HeroesArena = app;
        }
        
        // Mettre à jour le statut
        updateAppStatus('✅ Application chargée avec succès', '#10b981');
        
        console.log('🎉 Heroes Arena initialisé avec succès');
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur lors du chargement (tentative ${initializationAttempts}):`, error);
        
        // Si c'est une erreur liée aux extensions browser, on réessaie
        if (shouldRetryInitialization(error)) {
            console.log(`🔄 Réessai dans ${APP_CONFIG.retryDelay}ms...`);
            setTimeout(() => initializeApp(), APP_CONFIG.retryDelay);
            return false;
        }
        
        // Erreur définitive
        handleInitializationFailure(error);
        return false;
    }
}

/**
 * Vérifie si on doit réessayer l'initialisation
 */
function shouldRetryInitialization(error) {
    return initializationAttempts < APP_CONFIG.maxInitAttempts && 
           (error.message.includes('message channel') || 
            error.message.includes('listener indicated') ||
            error.message.includes('Extension context'));
}

/**
 * Met à jour le statut d'initialisation de l'application
 */
function updateAppStatus(message, color = '#ef4444') {
    const statusElement = document.getElementById('appStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
    }
}

/**
 * Gère les erreurs définitives d'initialisation
 */
function handleInitializationFailure(error) {
    updateAppStatus(`❌ Erreur: ${error.message}`);
    
    // Message d'erreur détaillé
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px; color: #991b1b;">
            <h3>🚨 Erreur de chargement</h3>
            <p>L'application n'a pas pu se charger correctement après ${APP_CONFIG.maxInitAttempts} tentatives.</p>
            <details>
                <summary>Détails techniques</summary>
                <pre style="background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto;">${error.stack || error.message}</pre>
            </details>
            <button onclick="location.reload()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Recharger la page</button>
        </div>
    `;
    const content = document.querySelector('.content') || document.body;
    content.appendChild(errorDiv);
}

// ============= GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX =============

/**
 * Gestionnaire pour l'import de fichiers
 */
async function handleFileImport(input) {
    const file = input.files[0];
    if (file && window.HeroesArena && window.HeroesArena.importData) {
        try {
            const result = await window.HeroesArena.importData(file);
            if (result.success) {
                console.log('Import réussi:', result);
            } else {
                console.error('Erreur d\'import:', result.error);
            }
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
        }
    }
    // Réinitialiser l'input pour permettre la re-sélection du même fichier
    input.value = '';
}

/**
 * Fonction de debug global
 */
window.debugApp = function() {
    if (window.app) {
        window.app.debug();
    } else {
        console.log('Application non encore chargée');
    }
};

// ============= FONCTIONS POUR LA CARTE UTILISATEUR =============

/**
 * Basculer l'ouverture/fermeture du menu utilisateur
 */
window.toggleUserMenu = function() {
    const userCard = document.getElementById('userCard');
    if (userCard) {
        userCard.classList.toggle('open');
    }
};

/**
 * Afficher le profil utilisateur (fonctionnalité à venir)
 */
window.showUserProfile = function() {
    alert('Fonctionnalité de profil à venir !');
};

/**
 * Afficher les paramètres utilisateur (fonctionnalité à venir)
 */
window.showUserSettings = function() {
    alert('Fonctionnalité de paramètres à venir !');
};

// ============= INITIALISATION =============

// Fermer le menu utilisateur en cliquant ailleurs
document.addEventListener('click', function(event) {
    const userCard = document.getElementById('userCard');
    if (userCard && !userCard.contains(event.target)) {
        userCard.classList.remove('open');
    }
});

// Exposer les fonctions globales nécessaires
window.handleFileImport = handleFileImport;

// Démarrer l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Log de chargement du module
console.log('📦 Module app-loader.js chargé');