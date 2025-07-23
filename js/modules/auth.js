class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.recoveryCodes = this.loadRecoveryCodes();
    this.currentRecoveryEmail = null;

    //Expression régulières pour validation
    this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    this.passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

    this.init();
  }

  init() {
    // Vérifier si un utilisateur n'est pas déjà connecté
    const savedUser = localStorage.getItem("heroesArena_currentUser");
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.showMainApp();
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          error
        );
        this.logout();
      }
    } else {
      this.showAuthScreen();
    }
  }

  //Gestion du stockage des utilisateurs
  loadUsers() {
    try {
      const users = localStorage.getItem("heroesArena_users");
      return users ? JSON.parse(users) : {};
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      return [];
    }
  }

  savedUser() {
    try {
      localStorage.setItem("heroesArena_users", JSON.stringify(this.users));
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des utilisateurs:", error);
      return false;
    }
  }

  //Gestion des codes de récupération
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

  generateRecoveryCodes() {
    //Génère un code de 6 chiffres aléatoires
    const code = Math.floor(100000 + Math.random() * 900000).to;
  }

  cleanExpiredCodes() {
    const now = Date.now();
    const expiredEmails = [];

    for (const [email, data] of Object.entries(this.recoveryCodes)) {
      if (data.expiresAt) {
        expiredEmails.push(email);
      }
    }
    expiredEmails.forEach((email) => {
      delete this.recoveryCodes[email];
      console.log(
        `Code de récupération expiré supprimé pour l'email: ${email}`
      );
    });

    if (expiredEmails.length > 0) {
      this.saveRecoveryCodes();
    }
  }

  //Validation des entrées
  validateEmail(email) {
    if (!email || email.trim() === "") {
      return "L'email ne peut pas être vide.";
    }
    if (!this.emailRegex.test(email)) {
      return "L'email n'est pas valide.";
    }

    return { valid: true };
  }

  validatePassword(password) {
    if (!password || password.length === 0) {
      return "Le mot de passe ne peut pas être vide.";
    }
    if (!password.length < 8) {
      return {
        valid: false,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      };
    }
    if (!this.passwordRegex.test(password)) {
      return {
        valid: false,
        message:
          "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.",
      };
    }
    return { valid: true };
  }

  validateUsername(username) {
    if (!username || username.trim() === "") {
      return {
        valid: false,
        message: "Le nom d'utilisateur ne peut pas être vide.",
      };
    }
    if (username.length < 3 || username.length > 20) {
      return {
        valid: false,
        message: "Le nom d'utilisateur doit contenir entre 3 et 20 caractères.",
      };
    }
    if (!this.usernameRegex.test(username)) {
      return {
        valid: false,
        message:
          "Le nom d'utilisateur doit contenir entre 3 et 20 caractères alphanumériques ou des underscores.",
      };
    }
    return { valid: true };
  }

  //Vérification de l'existence de l'utilisateur
  userExists(email, username = null) {
    return this.users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() ||
        (username && user.username.toLowerCase() === username.toLowerCase())
    );
  }

  //Hashage simple du mot de passe ( à remplacer par une méthode sécurisée en production )
  hashPassword(password) {
    // Simulation d'un hashage simple - en production utiliser bcrypt ou équivalent
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir en entier 32 bits
    }
    return hash.toString(16); // Convertir en hexadécimal
  }

  //Inscription
  async register(userData) {
    try {
      const { username, email, password } = userData;

      //Validation des données
      const emailValidation = this.validateEmail(email);
      if (emailValidation.valid !== true) {
        return { success: false, message: emailValidation.message };
      }

      const usernameValidation = this.validateUsername(username);
      if (usernameValidation.valid !== true) {
        return { success: false, message: usernameValidation.message };
      }

      const passwordValidation = this.validatePassword(password);
      if (passwordValidation.valid !== true) {
        return { success: false, message: passwordValidation.message };
      }

      if (password !== confirmPassword) {
        return {
          success: false,
          field: "confirmPassword",
          message: "Les mots de passe ne correspondent pas.",
        };
      }

      //Vérifier si l'utilisateur existe déjà
      if (this.userExists(email, username)) {
        return { success: false, message: "Cet utilisateur existe déjà." };
      }

      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return {
          success: false,
          field: "email",
          message: "Cet email est déjà utilisé.",
        };
      } else {
        return {
          success: false,
          field: "username",
          message: "Ce nom d'utilisateur est déjà pris.",
        };
      }

      //Créer l'utilisateur
      const newUser = {
        id: userId,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        heroes: [],
        lastLogin: null,
        isActive: true,
      };

      this.users.push(newUser);
      if (!this.savedUser()) {
        return {
          success: false,
          message: "Erreur lors de la sauvegarde de l'utilisateur.",
        };
      }

      //Connexion automatique après l'inscription
      this.currentUser = { ...newUser };
      delete this.currentUser.password; // Ne pas stocker le mot de passe en clair
      localStorage.setItem(
        "heroesArena_currentUser",
        JSON.stringify(this.currentUser)
      );

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription. Veuillez réessayer plus tard.",
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
    } catch (error) {
      console.error(
        "Erreur lors de la génération du code de récupération:",
        error
      );
      return { success: false, message: "Erreur technique" };
    }
  }

  // Récupération de mot de passe - Étape 2: Vérification du code
  async veryfyRecoveryCode(email, code) {
    try {
      this.cleanExpiredCodes(); // Nettoyer les codes expirés

      if (!email || !code) {
        return {
          success: false,
          field: "email",
          message: "L'email et le code sont requis",
        };
      }
      const recoveryData = this.recoveryCodes[email.toLowerCase()];
      if (!recoveryData) {
        return {
          success: false,
          field: "email",
          message: "Aucun code de récupération trouvé pour cet email",
        };
      }
      //Vérifier l'expiration
      if (Date.now() > recoveryData.expiresAt) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          field: "code",
          message: "Le code de récupération a expiré",
        };
      }

      //Vérifier le nombre de tentatives
      if (recoveryData.attempts >= recoveryData.maxAttempts) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          field: "code",
          message: "Trop de tentatives. Veuillez réessayer plus tard.",
        };
      }

      //Vérifier le code
      if (code.trim() !== recoveryData.code) {
        recoveryData.attempts++;
        this.saveRecoveryCodes();
        const attemptsLeft =
          recoveryData.maxAttempts - recoveryData.attempts;
        return {
          success: false,
          field: "code",
          message: `Code de récupération incorrect ${attemptsLeft} tentatives restantes`,
        };
      }

      //Code correct
      recoveryData.verified = true;
      this.saveRecoveryCodes();

      return {
        success: true,
        message: "Code de récupération vérifié avec succès",
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du code de récupération:", error);
      return { success: false, message: "Erreur technique lors de la vérification" };
    }
  }


  //Récupération de mot de passe - Étape 3: Réinitialisation du mot de passe
  async resetPassword(email, newPassword, confirmPassword) {
    try {
      this.cleanExpiredCodes(); // Nettoyer les codes expirés
      const recoveryData = this.recoveryCodes[email.toLowerCase()];
      if (!recoveryData || !recoveryData.verified) {
        return {
          success: false,
          field: "email",
          message: "Aucun code de récupération vérifié trouvé pour cet email, veuillez vérifier votre code"
        };
      }

      //Vérifier l'expiration
      if (Date.now() > recoveryData.expiresAt) {
        delete this.recoveryCodes[email.toLowerCase()];
        this.saveRecoveryCodes();
        return {
          success: false,
          field: "code",
          message: "Le code de récupération a expiré, veuillez en générer un nouveau",
        };
      }

      //Validation du mot de passe 
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          field: "newPassword",
          message: passwordValidation.message,
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          field: "confirmPassword",
          message: "Les mots de passe ne correspondent pas.",
        };
      }

      //Trouver l'utilisateur et changer le mot de passe
      const userIndex = this.users.findIndex(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (userIndex === -1) {
        return {
          success: false,
          field: "email",
          message: "Aucun compte associé à cette adresse email",
        };
      }

      //Mettre à jour le mot de passe
      this.users[userIndex].password = this.hashPassword(newPassword);
      if (!this.savedUser()) {
        return {
          success: false,
          message: "Erreur lors de la sauvegarde du nouveau mot de passe",
        };
      }

      //Supprimer le code de récupération
      delete this.recoveryCodes[email.toLowerCase()];
      this.saveRecoveryCodes();

      //Réinitialiser l'email de récupération
      this.currentRecoveryEmail = null;
      return {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      };
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      return {
        success: false,
        message: "Erreur technique lors de la réinitialisation du mot de passe",
      };
    }
  }

  //Interface utilisateur 
  showAuthScreen() {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");
    if (authScreen) {
      authScreen.style.display = "flex";
      mainApp.style.display = "none";
    }

    showMainApp() {
      const authScreen = document.getElementById("authScreen");
      const mainApp = document.getElementById("mainApp");
      if (authScreen) {
        authScreen.style.display = "none";
        mainApp.style.display = "block";

        //Mettre à jour l'interface utilisateur
        this.updateUserCard() {
          if (!this.currentUser) return;
          //Nom d'utilisateur 
          const usernameElement = document.getElementById("username");
          if (usernameElement) {
            usernameElement.textContent = this.currentUser.username;
          }

          //Initiales de l'avatar 
          const userInitials = document.getElementById("userInitials");
          if (userInitials) {
            const initials = this.currentUser.username
              .split(" ")
              .map(word => word.charAt(0).toUpperCase())
              .join("");
              .substring(0, 2); // Limiter à 2 initiales
            userInitials.textContent = initials;
          }

          //Email
          const userEmail = document.getElementById("userEmail");
          if (userEmail) {
            userEmail.textContent = this.currentUser.email;
          }

          //Date d'inscription
          const userJoinDate = document.getElementById("userJoinDate");
          if (userJoinDate && this.currentUser.createdAt) {
            const date = new Date(this.currentUser.createdAt);
            userJoinDate.textContent = date.toLocaleDateString("fr-FR")
          };

          // Statistique des héros
          this.updateUserStats();
        }

        //Mettre à jour les statistiques de l'utilisateur
        updateUserStats() {
          if (!this.currentUser) return;
          const userHeroes = this.getUserHeroes();

          //Nombre de héros 
          const heroCountElement = document.getElementById("UserHeroCount");
          if (heroCountElement) {
            heroCountElement.textContent = userHeroes.length.toString();
          }

          //Calcul des victoires totales 
          const totalWins = userHeroes.reduce((total, hero) => {
            return total + (hero.victoires || 0);
          }, 0);

          const totalWinsElement = document.getElementById("UserTotalWins");
          if (totalWinsElement) {
            totalWinsElement.textContent = totalWins.toString();
          }
        }

        //Méthode pour rafraîchir les stats après une bataille 
        refreshUserStats() {
          this.updateUserStats();
        }

        showLogin() {
          this.hideAllForms();
          const loginForm = document.getElementById("loginForm");
          if (loginForm) {
            loginForm.style.display = "block";
            loginForm.classList.add("active");
          }
          this.clearAllErrors();
        }

        showForgotPassword() {
          this.hideAllForms();
          const forgotForm = document.getElementById("forgotPasswordForm");
          if (forgotForm) {
            forgotForm.style.display = "block";
            forgotForm.classList.add("active");
          }
          this.clearAllErrors();
        }

        showVerifyCode() {
          this.hideAllForms();
          const verifyForm = document.getElementById("verifyCodeForm");
          if (verifyForm) {
            verifyForm.style.display = "block";
            verifyForm.classList.add("active");
          }
          this.clearAllErrors();
        }

        showResetPassword() {
          this.hideAllForms();
          const resetForm = document.getElementById("resetPasswordForm");
          if (resetForm) {
            resetForm.style.display = "block";
            resetForm.classList.add("active");
          }
          this.clearAllErrors();
        }

        hideAllForms() {
          const forms = [
            'loginForm',
            'registerForm',
            'forgotPasswordForm',
            'verifyCodeForm',
            'resetPasswordForm'
          ];
          forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
              form.style.display = "none";
              form.classList.remove("active");
            }
          });
      }

      // Gestion des erreurs d'affichage
      showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + "Error");
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.style.display = "block";
        }

        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
          inputElement.classList.add("error");
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
            "registerEmail",
            "registerUsername",
            "registerPassword",
            "registerConfirmPassword",
            "forgotEmail",
            "verificationCode",
            "newPassword",
            "confirmNewPassword",
          ];

          errorFields.forEach(fieldId => {
            this.clearFieldError(fieldId);
          });

          const authMessage = document.getElementById("authMessage");
          if (authMessage) {
            authMessage.innerHTML = "";
          }
        }
        showGenericError(message, type = "error" ) {
          const authMessage = document.getElementById("authMessage");
          if (authMessage) {
            authMessage.innerHTML = `<div class="${type}">${message}</div>`;

            //Effacer le message après 5 secondes
            setTimeout(() => {
              authMessage.innerHTML = "";
            }, 5000); 
          }
        }

        //Gestionnaire d'événements 
        
      }
    }
  }
}
