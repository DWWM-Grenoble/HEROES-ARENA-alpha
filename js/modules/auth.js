class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.recoveryCodes = this.loadRecoveryCodes();
    this.currentRecoveryEmail = null;

    //Expression régulières pour validation
    this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    this.passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

    this.init()
  }

  init() {
    // Vérifier si un utilisateur n'est pas déjà connecté
    const savedUser = localStorage.getItem('heroesArena_currentUser');
    if (savedUser){
      try {
        this.currentUser = JSON.parse(savedUser);
        this.showMainApp();
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        this.logout();
      }
    } else {
      this.showAuthScreen();
    }
  }

  //Gestion du stockage des utilisateurs
  loadUsers() {
    try {
      const users = localStorage.getItem('heroesArena_users');
      return users ? JSON.parse(users) : {};
    }catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      return [];
    } 
  }

  savedUser() {
    try {
      localStorage.setItem('heroesArena_users', JSON.stringify(this.users));
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des utilisateurs:", error);
      return false;
    }
  }

  //Gestion des codes de récupération
  loadRecoveryCodes() {
    try {
      const codes = localStorage.getItem('heroesArena_recoveryCodes');
      return codes ? JSON.parse(codes) : {};
    } catch (error) {
      console.error("Erreur lors du chargement des codes de récupération:", error);
      return {};
    }
  }

  saveRecoveryCodes() {
    try {
      localStorage.setItem('heroesArena_recoveryCodes', JSON.stringify(this.recoveryCodes));
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des codes de récupération:", error);
      return false;
    }
  }

  generateRecoveryCodes() {
    //Génère un code de 6 chiffres aléatoires
    const code = Math.floor(100000 + Math.random() * 900000).to
  }

  cleanExpiredCodes() {
    const now = Date.now();
    const expiredEmails = [];
    
    for (const email in this.recoveryCodes) {
      this.recoveryCodes[email] = this.recoveryCodes[email].filter(code => code.expiration > now);
      if (this.recoveryCodes[email].length === 0) {
        delete this.recoveryCodes[email];
      }
    }
    this.saveRecoveryCodes();
  }