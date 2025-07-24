// Module d'authentification pour Heroes Arena
// Gestion complète de l'authentification avec validation et gestion d'erreurs

class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.recoveryCodes = this.loadRecoveryCodes();
    this.currentRecoveryEmail = null;

    // Expressions régulières pour validation
    this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    this.usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;

    this.init();
  }

  init() {
    // Vérifier si un utilisateur est déjà connecté
    const savedUser = localStorage.getItem("heroesArena_currentUser");
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.showMainApp();
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        this.logout();
      }
    } else {
      this.showAuthScreen();
    }
  }

  // Gestion du stockage des utilisateurs
  loadUsers() {
    try {
      const users = localStorage.getItem("heroesArena_users");
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      return [];
    }
  }

  saveUsers() {
    try {
      localStorage.setItem("heroesArena_users", JSON.stringify(this.users));
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des utilisateurs:", error);
      return false;
    }
  }

  // Gestion des codes de récupération
  loadRecoveryCodes() {
    try {
      const codes = localStorage.getItem("heroesArena_recoveryCodes");
      return codes ? JSON.parse(codes) : {};
    } catch (error) {
      console.error(
        "Erreur lors du chargement des codes de récupération:",
        error
      );
      return {};
    }
  }

  saveRecoveryCodes() {
    try {
      localStorage.setItem(
        "heroesArena_recoveryCodes",
        JSON.stringify(this.recoveryCodes)
      );
      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde des codes de récupération:",
        error
      );
      return false;
    }
  }

  generateRecoveryCode() {
    // Génère un code de 6 chiffres
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  cleanExpiredCodes() {
    const now = Date.now();
    const expiredEmails = [];

    for (const [email, data] of Object.entries(this.recoveryCodes)) {
      if (now > data.expiresAt) {
        expiredEmails.push(email);
      }
    }

    expiredEmails.forEach((email) => {
      delete this.recoveryCodes[email];
    });

    if (expiredEmails.length > 0) {
      this.saveRecoveryCodes();
    }
  }

  // Validation des données
  validateEmail(email) {
    if (!email || email.trim() === "") {
      return { valid: false, message: "L'email est requis" };
    }

    if (!this.emailRegex.test(email)) {
      return { valid: false, message: "Format d'email invalide" };
    }

    return { valid: true };
  }

  validatePassword(password) {
    if (!password || password.length === 0) {
      return { valid: false, message: "Le mot de passe est requis" };
    }

    if (password.length < 8) {
      return {
        valid: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      };
    }

    if (!this.passwordRegex.test(password)) {
      return {
        valid: false,
        message:
          "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
      };
    }

    return { valid: true };
  }

  validateUsername(username) {
    if (!username || username.trim() === "") {
      return { valid: false, message: "Le nom d'utilisateur est requis" };
    }

    if (username.length < 3) {
      return {
        valid: false,
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
      };
    }

    if (username.length > 20) {
      return {
        valid: false,
        message: "Le nom d'utilisateur ne peut pas dépasser 20 caractères",
      };
    }

    if (!this.usernameRegex.test(username)) {
      return {
        valid: false,
        message:
          "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores",
      };
    }

    return { valid: true };
  }

  // Vérification de l'existence d'un utilisateur
  userExists(email, username = null) {
    return this.users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() ||
        (username && user.username.toLowerCase() === username.toLowerCase())
    );
  }

  // Hashage simple du mot de passe (à remplacer par une solution plus sécurisée en production)
  hashPassword(password) {
    // Simulation d'un hashage - en production, utiliser bcrypt ou équivalent
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Conversion en 32bit
    }
    return hash.toString();
  }

  // Inscription
  async register(userData) {
    try {
      const { username, email, password, confirmPassword } = userData;

      // Validation des champs
      const usernameValidation = this.validateUsername(username);
      if (!usernameValidation.valid) {
        return {
          success: false,
          field: "username",
          message: usernameValidation.message,
        };
      }

      const emailValidation = this.validateEmail(email);
      if (!emailValidation.valid) {
        return {
          success: false,
          field: "email",
          message: emailValidation.message,
        };
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          field: "password",
          message: passwordValidation.message,
        };
      }

      if (password !== confirmPassword) {
        return {
          success: false,
          field: "confirmPassword",
          message: "Les mots de passe ne correspondent pas",
        };
      }

      // Vérifier que l'utilisateur n'existe pas déjà
      if (this.userExists(email, username)) {
        const existingUser = this.users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() ||
            u.username.toLowerCase() === username.toLowerCase()
        );

        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          return {
            success: false,
            field: "email",
            message: "Cet email est déjà utilisé",
          };
        } else {
          return {
            success: false,
            field: "username",
            message: "Ce nom d'utilisateur est déjà pris",
          };
        }
      }

      // Créer le nouvel utilisateur
      const newUser = {
        id: Date.now().toString(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: this.hashPassword(password),
        createdAt: new Date().toISOString(),
        heroes: [],
      };

      this.users.push(newUser);

      if (!this.saveUsers()) {
        return { success: false, message: "Erreur lors de la sauvegarde" };
      }

      // Connexion automatique après inscription
      this.currentUser = { ...newUser };
      delete this.currentUser.password; // Ne pas stocker le mot de passe dans la session

      localStorage.setItem(
        "heroesArena_currentUser",
        JSON.stringify(this.currentUser)
      );

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return {
        success: false,
        message: "Erreur technique lors de l'inscription",
      };
    }
  }

  // Connexion
  async login(email, password) {
    try {
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.valid) {
        return {
          success: false,
          field: "email",
          message: emailValidation.message,
        };
      }

      if (!password || password.length === 0) {
        return {
          success: false,
          field: "password",
          message: "Le mot de passe est requis",
        };
      }

      const user = this.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return {
          success: false,
          field: "email",
          message: "Email ou mot de passe incorrect",
        };
      }

      const hashedPassword = this.hashPassword(password);
      if (user.password !== hashedPassword) {
        return {
          success: false,
          field: "password",
          message: "Email ou mot de passe incorrect",
        };
      }

      // Connexion réussie
      this.currentUser = { ...user };
      delete this.currentUser.password; // Ne pas stocker le mot de passe dans la session

      localStorage.setItem(
        "heroesArena_currentUser",
        JSON.stringify(this.currentUser)
      );

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return {
        success: false,
        message: "Erreur technique lors de la connexion",
      };
    }
  }

  // Déconnexion
  logout() {
    this.currentUser = null;
    localStorage.removeItem("heroesArena_currentUser");
    this.showAuthScreen();

    // Nettoyer les données de session si nécessaire
    if (window.HeroesArena && window.HeroesArena.resetArena) {
      window.HeroesArena.resetArena();
    }
  }

  // Récupération de mot de passe - Étape 1: Génération du code
  async forgotPassword(email) {
    try {
      this.cleanExpiredCodes(); // Nettoyer les codes expirés

      const emailValidation = this.validateEmail(email);
      if (!emailValidation.valid) {
        return {
          success: false,
          field: "email",
          message: emailValidation.message,
        };
      }

      // Vérifier que l'utilisateur existe
      const user = this.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!user) {
        return {
          success: false,
          field: "email",
          message: "Aucun compte associé à cette adresse email",
        };
      }

      // Générer un code de récupération
      const code = this.generateRecoveryCode();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      this.recoveryCodes[email.toLowerCase()] = {
        code: code,
        expiresAt: expiresAt,
        attempts: 0,
        maxAttempts: 3,
      };

      this.currentRecoveryEmail = email.toLowerCase();

      if (!this.saveRecoveryCodes()) {
        return {
          success: false,
          message: "Erreur lors de la sauvegarde du code",
        };
      }

      return {
        success: true,
        code: code, // En production, ceci serait envoyé par email
        expiresAt: expiresAt,
        message: "Code de récupération généré avec succès",
      };
    } catch (error) {
      console.error("Erreur lors de la génération du code:", error);
      return {
        success: false,
        message: "Erreur technique lors de la génération du code",
      };
    }
  }

  // Récupération de mot de passe - Étape 2: Vérification du code
  async verifyRecoveryCode(email, code) {
    try {
      this.cleanExpiredCodes();

      if (!email || !code) {
        return {
          success: false,
          field: "code",
          message: "Email et code requis",
        };
      }

      const recoveryData = this.recoveryCodes[email.toLowerCase()];
      if (!recoveryData) {
        return {
          success: false,
          field: "code",
          message: "Code de récupération invalide ou expiré",
        };
      }

      // Vérifier l'expiration
      if (Date.now() > recoveryData.expiresAt) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          field: "code",
          message: "Le code de récupération a expiré",
        };
      }

      // Vérifier le nombre de tentatives
      if (recoveryData.attempts >= recoveryData.maxAttempts) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          field: "code",
          message: "Trop de tentatives. Demandez un nouveau code.",
        };
      }

      // Vérifier le code
      if (code.trim() !== recoveryData.code) {
        recoveryData.attempts++;
        this.saveRecoveryCodes();
        const attemptsLeft = recoveryData.maxAttempts - recoveryData.attempts;
        return {
          success: false,
          field: "code",
          message: `Code incorrect. ${attemptsLeft} tentative(s) restante(s)`,
        };
      }

      // Code valide - marquer comme vérifié
      recoveryData.verified = true;
      this.saveRecoveryCodes();

      return { success: true, message: "Code vérifié avec succès" };
    } catch (error) {
      console.error("Erreur lors de la vérification du code:", error);
      return {
        success: false,
        message: "Erreur technique lors de la vérification",
      };
    }
  }

  // Récupération de mot de passe - Étape 3: Changement du mot de passe
  async resetPassword(email, newPassword, confirmPassword) {
    try {
      this.cleanExpiredCodes();

      const recoveryData = this.recoveryCodes[email.toLowerCase()];
      if (!recoveryData || !recoveryData.verified) {
        return {
          success: false,
          message:
            "Session de récupération invalide. Recommencez le processus.",
        };
      }

      // Vérifier l'expiration
      if (Date.now() > recoveryData.expiresAt) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          message: "Session de récupération expirée. Recommencez le processus.",
        };
      }

      // Validation du mot de passe
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          field: "password",
          message: passwordValidation.message,
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          field: "confirmPassword",
          message: "Les mots de passe ne correspondent pas",
        };
      }

      // Trouver l'utilisateur et changer le mot de passe
      const userIndex = this.users.findIndex(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (userIndex === -1) {
        return { success: false, message: "Utilisateur introuvable" };
      }

      // Mettre à jour le mot de passe
      this.users[userIndex].password = this.hashPassword(newPassword);

      if (!this.saveUsers()) {
        return {
          success: false,
          message: "Erreur lors de la sauvegarde du nouveau mot de passe",
        };
      }

      // Nettoyer le code de récupération utilisé
      delete this.recoveryCodes[email.toLowerCase()];
      this.saveRecoveryCodes();

      // Réinitialiser l'email de récupération
      this.currentRecoveryEmail = null;

      return { success: true, message: "Mot de passe changé avec succès" };
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      return {
        success: false,
        message: "Erreur technique lors du changement de mot de passe",
      };
    }
  }

  // Interface utilisateur
  showAuthScreen() {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");

    if (authScreen) authScreen.style.display = "flex";
    if (mainApp) mainApp.style.display = "none";
  }

  showMainApp() {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");

    if (authScreen) authScreen.style.display = "none";
    if (mainApp) mainApp.style.display = "block";

    // Mettre à jour la carte utilisateur
    this.updateUserCard();
  }

  // Mettre à jour la carte utilisateur avec les informations actuelles
  updateUserCard() {
    if (!this.currentUser) return;

    // Nom d'utilisateur
    const usernameElement = document.getElementById("currentUsername");
    if (usernameElement) {
      usernameElement.textContent = this.currentUser.username;
    }

    // Initiales de l'avatar
    const userInitials = document.getElementById("userInitials");
    if (userInitials) {
      const initials = this.currentUser.username
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
      userInitials.textContent = initials;
    }

    // Email
    const userEmail = document.getElementById("userEmail");
    if (userEmail) {
      userEmail.textContent = this.currentUser.email;
    }

    // Date d'inscription
    const userJoinDate = document.getElementById("userJoinDate");
    if (userJoinDate && this.currentUser.createdAt) {
      const date = new Date(this.currentUser.createdAt);
      userJoinDate.textContent = date.toLocaleDateString("fr-FR");
    }

    // Statistiques des héros
    this.updateUserStats();
  }

  // Mettre à jour les statistiques utilisateur
  updateUserStats() {
    if (!this.currentUser) return;

    const userHeroes = this.getUserHeroes();

    // Nombre de héros
    const heroCountElement = document.getElementById("userHeroCount");
    if (heroCountElement) {
      heroCountElement.textContent = userHeroes.length.toString();
    }

    // Calcul des victoires totales
    const totalWins = userHeroes.reduce((total, hero) => {
      return total + (hero.victoires || 0);
    }, 0);

    const totalWinsElement = document.getElementById("userTotalWins");
    if (totalWinsElement) {
      totalWinsElement.textContent = totalWins.toString();
    }
  }

  // Méthode pour rafraîchir les stats après une bataille
  refreshUserStats() {
    this.updateUserStats();
  }

  // Nouvelle méthode pour mettre en évidence les erreurs de formulaire
  highlightFormErrors() {
    const errorInputs = document.querySelectorAll(".error");
    errorInputs.forEach((input) => {
      input.style.borderColor = "#ff4757";
      input.style.boxShadow = "0 0 5px rgba(255, 71, 87, 0.3)";

      // Enlever l'effet après 3 secondes
      setTimeout(() => {
        input.style.borderColor = "";
        input.style.boxShadow = "";
      }, 3000);
    });
  }

  showLogin() {
    this.hideAllForms();
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.classList.add("active");
      loginForm.style.display = "block";
    }
    this.clearAllErrors();
  }

  showRegister() {
    this.hideAllForms();
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.classList.add("active");
      registerForm.style.display = "block";
    }
    this.clearAllErrors();
  }

  showForgotPassword() {
    this.hideAllForms();
    const forgotForm = document.getElementById("forgotPasswordForm");
    if (forgotForm) {
      forgotForm.classList.add("active");
      forgotForm.style.display = "block";
    }
    this.clearAllErrors();
  }

  showVerifyCode() {
    this.hideAllForms();
    const verifyForm = document.getElementById("verifyCodeForm");
    if (verifyForm) {
      verifyForm.classList.add("active");
      verifyForm.style.display = "block";
    }
    this.clearAllErrors();
  }

  showResetPassword() {
    this.hideAllForms();
    const resetForm = document.getElementById("resetPasswordForm");
    if (resetForm) {
      resetForm.classList.add("active");
      resetForm.style.display = "block";
    }
    this.clearAllErrors();
  }

  hideAllForms() {
    const forms = [
      "loginForm",
      "registerForm",
      "forgotPasswordForm",
      "verifyCodeForm",
      "resetPasswordForm",
    ];

    forms.forEach((formId) => {
      const form = document.getElementById(formId);
      if (form) {
        form.classList.remove("active");
        form.style.display = "none";
      }
    });
  }

  // Gestion des erreurs d'affichage
  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + "Error");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";

      // Animation d'apparition
      errorElement.style.opacity = "0";
      errorElement.style.transform = "translateY(-10px)";
      setTimeout(() => {
        errorElement.style.transition = "all 0.3s ease";
        errorElement.style.opacity = "1";
        errorElement.style.transform = "translateY(0)";
      }, 10);

      // Auto-masquage après 15 secondes
      setTimeout(() => {
        if (errorElement.style.display === "block") {
          errorElement.style.opacity = "0";
          setTimeout(() => {
            errorElement.style.display = "none";
            this.clearFieldError(fieldId);
          }, 300);
        }
      }, 15000);
    }

    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
      inputElement.classList.add("error");
      // Focus sur le champ en erreur
      setTimeout(() => {
        inputElement.focus();
        inputElement.select();
      }, 100);
    }
  }

  clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + "Error");
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }

    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
      inputElement.classList.remove("error");
    }
  }

  clearAllErrors() {
    const errorFields = [
      "loginEmail",
      "loginPassword",
      "registerUsername",
      "registerEmail",
      "registerPassword",
      "confirmPassword",
      "forgotEmail",
      "verificationCode",
      "newPassword",
      "confirmNewPassword",
    ];

    errorFields.forEach((field) => this.clearFieldError(field));

    const authMessages = document.getElementById("authMessages");
    if (authMessages) {
      const messageEl = authMessages.querySelector(".message");
      if (messageEl) {
        messageEl.style.opacity = "0";
        setTimeout(() => {
          authMessages.innerHTML = "";
        }, 300);
      } else {
        authMessages.innerHTML = "";
      }
    }
  }

  // Nouvelle méthode pour animer les erreurs
  shakeActiveForm() {
    const forms = [
      "loginForm",
      "registerForm",
      "forgotPasswordForm",
      "verifyCodeForm",
      "resetPasswordForm",
    ];

    const activeForm = forms.find((formId) => {
      const form = document.getElementById(formId);
      return (
        form &&
        (form.classList.contains("active") || form.style.display === "block")
      );
    });

    if (activeForm) {
      const form = document.getElementById(activeForm);
      form.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        form.style.animation = "";
      }, 500);
    }
  }

  showGeneralMessage(message, type = "error") {
    const authMessages = document.getElementById("authMessages");
    if (authMessages) {
      authMessages.innerHTML = `<div class="message ${type}">${message}</div>`;

      // Animation d'entrée
      const messageEl = authMessages.querySelector(".message");
      if (messageEl) {
        messageEl.style.opacity = "0";
        messageEl.style.transform = "translateY(-10px)";
        setTimeout(() => {
          messageEl.style.transition = "all 0.3s ease";
          messageEl.style.opacity = "1";
          messageEl.style.transform = "translateY(0)";
        }, 10);
      }

      // Effet de secousse pour les erreurs
      if (type === "error") {
        this.shakeActiveForm();
      }

      // Effacer le message après 8 secondes
      setTimeout(() => {
        if (messageEl) {
          messageEl.style.opacity = "0";
          setTimeout(() => {
            authMessages.innerHTML = "";
          }, 300);
        }
      }, 8000);
    }
  }

  // Gestionnaires d'événements
  async handleLogin(event) {
    event.preventDefault();
    this.clearAllErrors();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const result = await this.login(email, password);

    if (result.success) {
      this.showGeneralMessage("Connexion réussie!", "success");
      setTimeout(() => {
        this.showMainApp();
        // Réinitialiser l'application si nécessaire
        if (window.HeroesArena && window.HeroesArena.loadData) {
          window.HeroesArena.loadData();
        }
      }, 1000);
    } else {
      if (result.field) {
        this.showFieldError(
          "login" +
            result.field.charAt(0).toUpperCase() +
            result.field.slice(1),
          result.message
        );
      } else {
        this.showGeneralMessage(result.message, "error");
      }

      // Effet visuel supplémentaire pour les échecs de connexion
      this.highlightFormErrors();
    }

    return false;
  }

  async handleRegister(event) {
    event.preventDefault();
    this.clearAllErrors();

    const userData = {
      username: document.getElementById("registerUsername").value.trim(),
      email: document.getElementById("registerEmail").value.trim(),
      password: document.getElementById("registerPassword").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    const result = await this.register(userData);

    if (result.success) {
      this.showGeneralMessage("Compte créé avec succès!", "success");
      setTimeout(() => {
        this.showMainApp();
        // Réinitialiser l'application si nécessaire
        if (window.HeroesArena && window.HeroesArena.loadData) {
          window.HeroesArena.loadData();
        }
      }, 1000);
    } else {
      if (result.field) {
        this.showFieldError(
          "register" +
            result.field.charAt(0).toUpperCase() +
            result.field.slice(1),
          result.message
        );
      } else {
        this.showGeneralMessage(result.message, "error");
      }

      // Effet visuel supplémentaire pour les échecs d'inscription
      this.highlightFormErrors();
    }

    return false;
  }

  // Gestionnaires pour la récupération de mot de passe
  async handleForgotPassword(event) {
    event.preventDefault();
    this.clearAllErrors();

    const email = document.getElementById("forgotEmail").value.trim();

    const result = await this.forgotPassword(email);

    if (result.success) {
      // Afficher le code généré (en production, ceci serait envoyé par email)
      const codeDisplay = document.getElementById("recoveryCodeDisplay");
      if (codeDisplay) {
        codeDisplay.innerHTML = `
                    <div class="recovery-code-box">
                        <h4>Code de récupération généré</h4>
                        <div class="recovery-code">${result.code}</div>
                        <p class="recovery-note">
                            <strong>Important :</strong> Notez ce code, il expire dans 15 minutes.<br>
                            <small>En production, ce code serait envoyé par email.</small>
                        </p>
                    </div>
                `;
      }

      this.showGeneralMessage(
        "Code de récupération généré avec succès!",
        "success"
      );
      setTimeout(() => {
        this.showVerifyCode();
      }, 2000);
    } else {
      if (result.field) {
        this.showFieldError(
          "forgot" +
            result.field.charAt(0).toUpperCase() +
            result.field.slice(1),
          result.message
        );
      } else {
        this.showGeneralMessage(result.message, "error");
      }
    }

    return false;
  }

  async handleVerifyCode(event) {
    event.preventDefault();
    this.clearAllErrors();

    const code = document.getElementById("verificationCode").value.trim();

    if (!this.currentRecoveryEmail) {
      this.showGeneralMessage(
        "Session de récupération invalide. Recommencez le processus."
      );
      this.showForgotPassword();
      return false;
    }

    const result = await this.verifyRecoveryCode(
      this.currentRecoveryEmail,
      code
    );

    if (result.success) {
      this.showGeneralMessage("Code vérifié avec succès!", "success");
      setTimeout(() => {
        this.showResetPassword();
      }, 1000);
    } else {
      if (result.field) {
        this.showFieldError("verificationCode", result.message);
      } else {
        this.showGeneralMessage(result.message, "error");
      }
    }

    return false;
  }

  async handleResetPassword(event) {
    event.preventDefault();
    this.clearAllErrors();

    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword =
      document.getElementById("confirmNewPassword").value;

    if (!this.currentRecoveryEmail) {
      this.showGeneralMessage(
        "Session de récupération invalide. Recommencez le processus."
      );
      this.showForgotPassword();
      return false;
    }

    const result = await this.resetPassword(
      this.currentRecoveryEmail,
      newPassword,
      confirmNewPassword
    );

    if (result.success) {
      this.showGeneralMessage("Mot de passe changé avec succès!", "success");
      setTimeout(() => {
        this.showLogin();
        // Pré-remplir l'email de connexion
        const loginEmail = document.getElementById("loginEmail");
        if (loginEmail) {
          loginEmail.value = this.currentRecoveryEmail;
        }
      }, 2000);
    } else {
      if (result.field) {
        this.showFieldError(
          result.field === "password" ? "newPassword" : "confirmNewPassword",
          result.message
        );
      } else {
        this.showGeneralMessage(result.message, "error");
      }
    }

    return false;
  }

  // Méthodes utilitaires
  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Gestion des héros liés à l'utilisateur
  getUserHeroes() {
    if (!this.currentUser) return [];

    const user = this.users.find((u) => u.id === this.currentUser.id);
    const heroesData = user ? user.heroes || [] : [];

    console.log(
      `📖 Chargement de ${heroesData.length} héros pour l'utilisateur ${this.currentUser.username}`
    );
    heroesData.forEach((heroData) => {
      console.log(
        `  - ${heroData.nom}: XP=${heroData.xp}, Niveau=${heroData.niveau}, Victoires=${heroData.victoires}`
      );
    });

    // Convertir les données en instances de Hero pour restaurer les méthodes
    return heroesData.map((heroData) => {
      // Dynamically import Hero class to avoid circular dependency
      if (window.Hero && window.Hero.fromJSON) {
        const hero = window.Hero.fromJSON(heroData);
        console.log(
          `✅ Héros ${hero.nom} chargé avec Hero.fromJSON - XP: ${hero.xp}, Niveau: ${hero.niveau}`
        );
        return hero;
      } else {
        // Fallback: créer un objet avec les méthodes essentielles
        return this.createHeroWithMethods(heroData);
      }
    });
  }

  // Méthode de fallback pour créer un héros avec les méthodes nécessaires
  createHeroWithMethods(heroData) {
    const hero = { ...heroData };

    // S'assurer que toutes les propriétés importantes sont préservées
    hero.xp = heroData.xp !== undefined ? heroData.xp : 0;
    hero.niveau = heroData.niveau !== undefined ? heroData.niveau : 1;
    hero.victoires = heroData.victoires !== undefined ? heroData.victoires : 0;
    hero.defaites = heroData.defaites !== undefined ? heroData.defaites : 0;

    console.log(
      `🔧 Héros ${hero.nom} chargé avec fallback - XP: ${hero.xp}, Niveau: ${hero.niveau}`
    );

    // Ajouter les méthodes essentielles
    hero.getBadgeText = function () {
      const ratio =
        this.victoires + this.defaites > 0
          ? Math.round(
              (this.victoires / (this.victoires + this.defaites)) * 100
            )
          : 0;

      if (this.victoires >= 50) return "🏆 Légende";
      if (this.victoires >= 25) return "👑 Champion";
      if (this.victoires >= 15) return "⭐ Vétéran";
      if (this.victoires >= 10) return "🥉 Expert";
      if (this.victoires >= 5) return "🛡️ Guerrier";
      if (this.victoires >= 1) return "⚔️ Combattant";
      return "🆕 Novice";
    };

    hero.getRatio = function () {
      if (this.victoires + this.defaites === 0) return 0;
      return Math.round(
        (this.victoires / (this.victoires + this.defaites)) * 100
      );
    };

    hero.heal = function () {
      this.pv = this.pvMax;
    };

    hero.isValid = function () {
      return (
        this.nom &&
        this.classe &&
        this.force &&
        this.agility &&
        this.magic &&
        this.defense
      );
    };

    // Ajouter les méthodes de progression XP
    hero.gainXp = function (amount) {
      this.xp = (this.xp || 0) + amount;
      const newLevel = Math.floor(this.xp / 100) + 1;
      if (newLevel > this.niveau) {
        this.niveau = newLevel;
        // Level up bonus (simplifié pour le fallback)
        const bonus = Math.floor(Math.random() * 3) + 1;
        const stats = ["force", "agility", "magic", "defense"];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        this[randomStat] += bonus;
        this.pvMax = Math.floor((this.force + this.defense) * 2.5);
        this.pv = this.pvMax;
      }
      this.updatedAt = new Date().toISOString();
    };

    hero.calculateLevel = function () {
      return Math.floor(this.xp / 100) + 1;
    };

    return hero;
  }

  saveUserHeroes(heroes) {
    if (!this.currentUser) return false;

    const userIndex = this.users.findIndex((u) => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      // Convertir les héros en JSON pour la sauvegarde, en préservant l'XP
      const heroesData = heroes.map((hero) => {
        if (hero.toJSON) {
          return hero.toJSON();
        } else {
          // Fallback : sauvegarder toutes les propriétés importantes
          return {
            id: hero.id,
            nom: hero.nom,
            avatar: hero.avatar,
            classe: hero.classe,
            force: hero.force,
            agility: hero.agility,
            magic: hero.magic,
            defense: hero.defense,
            pvMax: hero.pvMax,
            pv: hero.pv,
            victoires: hero.victoires || 0,
            defaites: hero.defaites || 0,
            xp: hero.xp || 0,
            niveau: hero.niveau || 1,
            createdAt: hero.createdAt,
            updatedAt: hero.updatedAt,
          };
        }
      });

      console.log(
        `💾 Sauvegarde de ${heroesData.length} héros pour l'utilisateur ${this.currentUser.username}`
      );
      heroesData.forEach((hero) => {
        console.log(
          `  - ${hero.nom}: XP=${hero.xp}, Niveau=${hero.niveau}, Victoires=${hero.victoires}`
        );
      });

      this.users[userIndex].heroes = heroesData;
      return this.saveUsers();
    }

    return false;
  }
}

// Créer l'instance globale du système d'authentification
const authSystem = new AuthSystem();

// Exposer les méthodes globalement pour utilisation dans les formulaires HTML
window.HeroesAuth = {
  showLogin: () => authSystem.showLogin(),
  showRegister: () => authSystem.showRegister(),
  showForgotPassword: () => authSystem.showForgotPassword(),
  showVerifyCode: () => authSystem.showVerifyCode(),
  showResetPassword: () => authSystem.showResetPassword(),
  handleLogin: (event) => authSystem.handleLogin(event),
  handleRegister: (event) => authSystem.handleRegister(event),
  handleForgotPassword: (event) => authSystem.handleForgotPassword(event),
  handleVerifyCode: (event) => authSystem.handleVerifyCode(event),
  handleResetPassword: (event) => authSystem.handleResetPassword(event),
  logout: () => authSystem.logout(),
  isAuthenticated: () => authSystem.isAuthenticated(),
  getCurrentUser: () => authSystem.getCurrentUser(),
  getUserHeroes: () => authSystem.getUserHeroes(),
  saveUserHeroes: (heroes) => authSystem.saveUserHeroes(heroes),
  updateUserCard: () => authSystem.updateUserCard(),
  refreshUserStats: () => authSystem.refreshUserStats(),
};

export { authSystem };
