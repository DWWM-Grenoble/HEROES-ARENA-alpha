// Service pour la gestion de la navigation et des interactions UI

export class NavigationService {
    constructor() {
        this.currentSection = 'create';
        this.setupEventListeners();
    }

    /**
     * Afficher une section spécifique
     */
    showSection(sectionName) {
        try {
            // Cacher toutes les sections
            const sections = document.querySelectorAll('.content .section');
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Afficher la section demandée
            const targetSection = document.getElementById(sectionName);
            if (targetSection) {
                targetSection.classList.add('active');
                this.currentSection = sectionName;
                
                // Mettre à jour la navigation
                this.updateNavigationState(sectionName);
                
                return { success: true, section: sectionName };
            } else {
                console.warn(`Section '${sectionName}' non trouvée`);
                return { success: false, error: `Section '${sectionName}' non trouvée` };
            }
        } catch (error) {
            console.error('Erreur lors du changement de section:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mettre à jour l'état de la navigation
     */
    updateNavigationState(activeSection) {
        // Chercher les onglets avec .nav-tab (cohérent avec l'HTML)
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.section === activeSection) {
                tab.classList.add('active');
            }
        });
        
        // Support pour les anciens boutons .nav-btn s'ils existent
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === activeSection) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Naviguer vers la page d'accueil
     */
    goToHome() {
        const homeScreen = document.getElementById('homeScreen');
        const authScreen = document.getElementById('authScreen');
        const appContainer = document.querySelector('.container');

        if (homeScreen) {
            homeScreen.style.display = 'flex';
            homeScreen.classList.remove('hidden');
        }

        if (authScreen) {
            authScreen.style.display = 'none';
        }

        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }

    /**
     * Naviguer vers l'application
     */
    goToApp() {
        const homeScreen = document.getElementById('homeScreen');
        const authScreen = document.getElementById('authScreen');

        if (homeScreen) {
            homeScreen.classList.add('hidden');
            setTimeout(() => {
                homeScreen.style.display = 'none';
            }, 800);
        }

        if (authScreen) {
            authScreen.style.display = 'flex';
            setTimeout(() => {
                authScreen.style.opacity = '1';
            }, 50);
        }
    }

    /**
     * Basculer le menu utilisateur
     */
    toggleUserMenu() {
        const userCard = document.getElementById('userCard');
        if (userCard) {
            userCard.classList.toggle('open');
        }
    }

    /**
     * Fermer tous les menus ouverts
     */
    closeAllMenus() {
        const userCard = document.getElementById('userCard');
        if (userCard) {
            userCard.classList.remove('open');
        }

        // Fermer toutes les modales
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    /**
     * Configurer les gestionnaires d'événements
     */
    setupEventListeners() {
        // Fermer les menus en cliquant ailleurs
        document.addEventListener('click', (event) => {
            this.handleOutsideClick(event);
        });

        // Gestion des touches clavier
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardNavigation(event);
        });

        // Gestion du redimensionnement de fenêtre
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    /**
     * Gérer les clics à l'extérieur des menus
     */
    handleOutsideClick(event) {
        const userCard = document.getElementById('userCard');
        if (userCard && !userCard.contains(event.target)) {
            userCard.classList.remove('open');
        }
    }

    /**
     * Gérer la navigation au clavier
     */
    handleKeyboardNavigation(event) {
        // Échap pour fermer les modales/menus
        if (event.key === 'Escape') {
            this.closeAllMenus();
        }

        // Navigation rapide par touches numériques
        if (event.key >= '1' && event.key <= '4' && event.altKey) {
            const sections = ['create', 'heroes', 'arena', 'import'];
            const sectionIndex = parseInt(event.key) - 1;
            if (sections[sectionIndex]) {
                this.showSection(sections[sectionIndex]);
            }
        }
    }

    /**
     * Gérer le redimensionnement de fenêtre
     */
    handleWindowResize() {
        // Fermer les menus mobiles si on passe en desktop
        if (window.innerWidth > 768) {
            this.closeAllMenus();
        }
    }

    /**
     * Obtenir la section active actuelle
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Vérifier si une section existe
     */
    sectionExists(sectionName) {
        return document.getElementById(sectionName) !== null;
    }

    /**
     * Obtenir la liste des sections disponibles
     */
    getAvailableSections() {
        const sections = document.querySelectorAll('.content .section[id]');
        return Array.from(sections).map(section => section.id);
    }

    /**
     * Naviguer vers la section précédente
     */
    goToPreviousSection() {
        const sections = this.getAvailableSections();
        const currentIndex = sections.indexOf(this.currentSection);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
        this.showSection(sections[previousIndex]);
    }

    /**
     * Naviguer vers la section suivante
     */
    goToNextSection() {
        const sections = this.getAvailableSections();
        const currentIndex = sections.indexOf(this.currentSection);
        const nextIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
        this.showSection(sections[nextIndex]);
    }

    /**
     * Créer un breadcrumb pour la navigation
     */
    createBreadcrumb() {
        const sectionNames = {
            'create': 'Créer un Héros',
            'heroes': 'Mes Héros',
            'arena': 'Arène de Combat',
            'import': 'Import/Export'
        };

        return {
            current: sectionNames[this.currentSection] || this.currentSection,
            sections: this.getAvailableSections().map(id => ({
                id,
                name: sectionNames[id] || id,
                active: id === this.currentSection
            }))
        };
    }
}