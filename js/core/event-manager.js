// Gestionnaire d'événements centralisé pour l'application

export class EventManager {
    constructor() {
        this.events = new Map();
        this.listeners = new Map();
    }

    /**
     * S'abonner à un événement
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = {
            callback,
            context,
            id: Date.now() + Math.random()
        };

        this.events.get(eventName).push(listener);
        
        // Stocker la référence pour pouvoir se désabonner
        if (!this.listeners.has(context)) {
            this.listeners.set(context, []);
        }
        this.listeners.get(context).push({ eventName, listenerId: listener.id });

        return listener.id;
    }

    /**
     * Se désabonner d'un événement
     */
    off(eventName, listenerId) {
        if (!this.events.has(eventName)) return false;

        const listeners = this.events.get(eventName);
        const index = listeners.findIndex(l => l.id === listenerId);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Se désabonner de tous les événements d'un contexte
     */
    offAll(context) {
        if (!this.listeners.has(context)) return;

        const contextListeners = this.listeners.get(context);
        contextListeners.forEach(({ eventName, listenerId }) => {
            this.off(eventName, listenerId);
        });

        this.listeners.delete(context);
    }

    /**
     * Émettre un événement
     */
    emit(eventName, data = null) {
        if (!this.events.has(eventName)) return;

        const listeners = this.events.get(eventName);
        const results = [];

        listeners.forEach(listener => {
            try {
                const result = listener.context 
                    ? listener.callback.call(listener.context, data)
                    : listener.callback(data);
                results.push(result);
            } catch (error) {
                console.error(`Erreur dans l'événement '${eventName}':`, error);
            }
        });

        return results;
    }

    /**
     * Émettre un événement de manière asynchrone
     */
    async emitAsync(eventName, data = null) {
        if (!this.events.has(eventName)) return [];

        const listeners = this.events.get(eventName);
        const promises = [];

        listeners.forEach(listener => {
            try {
                const result = listener.context 
                    ? listener.callback.call(listener.context, data)
                    : listener.callback(data);
                
                // Si c'est une promesse, l'ajouter à la liste
                if (result && typeof result.then === 'function') {
                    promises.push(result);
                } else {
                    promises.push(Promise.resolve(result));
                }
            } catch (error) {
                console.error(`Erreur dans l'événement '${eventName}':`, error);
                promises.push(Promise.reject(error));
            }
        });

        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error(`Erreur lors de l'émission asynchrone de '${eventName}':`, error);
            throw error;
        }
    }

    /**
     * Une seule fois - s'abonner à un événement qui se désabonne après la première émission
     */
    once(eventName, callback, context = null) {
        const listenerId = this.on(eventName, (data) => {
            // Exécuter le callback
            const result = context ? callback.call(context, data) : callback(data);
            
            // Se désabonner immédiatement
            this.off(eventName, listenerId);
            
            return result;
        }, context);

        return listenerId;
    }

    /**
     * Obtenir la liste des événements disponibles
     */
    getEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Obtenir le nombre d'écouteurs pour un événement
     */
    getListenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }

    /**
     * Vider tous les événements et écouteurs
     */
    clear() {
        this.events.clear();
        this.listeners.clear();
    }

    /**
     * Debug - afficher l'état des événements
     */
    debug() {
        console.log('=== EVENT MANAGER DEBUG ===');
        console.log('Événements enregistrés:', this.getEvents());
        
        this.events.forEach((listeners, eventName) => {
            console.log(`📢 ${eventName}: ${listeners.length} écouteur(s)`);
        });

        console.log('Contexts:', Array.from(this.listeners.keys()));
        console.log('========================');
    }
}

// Événements prédéfinis de l'application
export const AppEvents = {
    // Événements d'authentification
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    AUTH_STATE_CHANGED: 'auth:state:changed',

    // Événements de héros
    HERO_CREATED: 'hero:created',
    HERO_DELETED: 'hero:deleted',
    HERO_UPDATED: 'hero:updated',
    HERO_HEALED: 'hero:healed',
    HERO_RENAMED: 'hero:renamed',
    HEROES_LOADED: 'heroes:loaded',

    // Événements de combat
    COMBAT_STARTED: 'combat:started',
    COMBAT_ENDED: 'combat:ended',
    COMBAT_PAUSED: 'combat:paused',
    COMBAT_RESUMED: 'combat:resumed',
    COMBAT_LOG_UPDATED: 'combat:log:updated',

    // Événements de navigation
    SECTION_CHANGED: 'navigation:section:changed',
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',

    // Événements de données
    DATA_SAVED: 'data:saved',
    DATA_LOADED: 'data:loaded',
    DATA_EXPORTED: 'data:exported',
    DATA_IMPORTED: 'data:imported',

    // Événements d'interface
    UI_UPDATED: 'ui:updated',
    NOTIFICATION_SHOWN: 'notification:shown',
    ERROR_OCCURRED: 'error:occurred'
};

// Instance globale
export const eventManager = new EventManager();