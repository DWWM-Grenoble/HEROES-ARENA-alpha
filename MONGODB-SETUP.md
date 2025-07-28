# 🏗️ Configuration MongoDB pour Heroes Arena

## 📋 Prérequis

### 1. Installation de MongoDB

#### Option A: MongoDB Community Server (Local)
1. Téléchargez MongoDB Community Server : https://www.mongodb.com/try/download/community
2. Installez avec les options par défaut
3. MongoDB sera accessible sur `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud - Recommandé)
1. Créez un compte gratuit sur https://www.mongodb.com/atlas
2. Créez un cluster gratuit (M0)
3. Configurez l'accès réseau (0.0.0.0/0 pour les tests)
4. Créez un utilisateur de base de données
5. Récupérez la chaîne de connexion

### 2. Installation de Node.js
- Téléchargez Node.js : https://nodejs.org/ (version LTS recommandée)
- Vérifiez l'installation : `node --version` et `npm --version`

## 🚀 Installation du Backend

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration de l'environnement
```bash
# Copiez le fichier d'exemple
copy .env.example .env

# Éditez .env avec vos paramètres
notepad .env
```

### 3. Configuration MongoDB

#### Pour MongoDB Local :
```env
MONGODB_URI=mongodb://localhost:27017/heroes-arena
```

#### Pour MongoDB Atlas :
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/heroes-arena
```

## 📊 Initialisation des données

### 1. Seed de la base de données
```bash
npm run seed
```

Cette commande va :
- ✅ Nettoyer la base de données
- 👥 Créer 5 utilisateurs d'exemple
- 🦸 Créer 12 héros variés
- ⚔️ Créer 10 combats d'exemple
- 📈 Afficher les statistiques

### 2. Démarrage du serveur
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur : http://localhost:3001

## 🧪 Test de l'API

### 1. Vérification de la santé
```bash
curl http://localhost:3001/health
```

### 2. Test basique
```bash
curl http://localhost:3001/api/test
```

### 3. Obtenir tous les héros
```bash
curl http://localhost:3001/api/heroes
```

## 🔗 Intégration Frontend

### 1. Mise à jour de l'application frontend

Ajoutez dans votre `index.html`, avant les autres scripts :
```html
<script type="module" src="js/services/database-service.js"></script>
```

### 2. Utilisation dans votre code JavaScript

```javascript
// Import du service (si modules ES6)
import { databaseService } from './js/services/database-service.js';

// Ou utilisation directe (service disponible globalement)
const heroes = await databaseService.getUserHeroes('USER_ID');
```

### 3. Migration des données existantes

```javascript
// Exemple de migration des héros existants
async function migrateExistingData() {
    const userId = 'USER_ID'; // ID de l'utilisateur
    const existingHeroes = AppState.heroes; // Vos héros actuels
    
    // Synchroniser avec la base de données
    const syncedHeroes = await databaseService.syncExistingHeroes(existingHeroes, userId);
    
    // Mettre à jour AppState
    AppState.heroes = syncedHeroes;
}
```

## 📡 Endpoints de l'API

### Héros
- `GET /api/heroes` - Liste des héros
- `POST /api/heroes` - Créer un héros
- `GET /api/heroes/:id` - Obtenir un héros
- `PUT /api/heroes/:id` - Mettre à jour un héros
- `DELETE /api/heroes/:id` - Supprimer un héros
- `GET /api/heroes/classement` - Classement des héros

### Combats
- `GET /api/combats` - Liste des combats
- `POST /api/combats` - Créer un combat
- `GET /api/combats/:id` - Obtenir un combat
- `POST /api/combats/:id/finish` - Terminer un combat
- `POST /api/combats/:id/log` - Ajouter au log

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Obtenir un utilisateur
- `GET /api/users/:id/heroes` - Héros d'un utilisateur

### Statistiques
- `GET /api/stats/global` - Statistiques globales
- `GET /api/stats/classements` - Tous les classements
- `GET /api/stats/activite` - Statistiques d'activité

## 🛠️ Scripts disponibles

```bash
# Démarrage
npm start          # Production
npm run dev        # Développement avec nodemon

# Base de données
npm run seed       # Remplir avec des données d'example

# Utilitaires
node -e "console.log(require('./config/database').isConnected())"  # Test connexion
```

## 🔧 Dépannage

### Problème de connexion MongoDB
```bash
# Vérifier que MongoDB fonctionne (local)
mongosh

# Tester la connexion
node -e "require('./config/database').connect().then(() => console.log('OK')).catch(console.error)"
```

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3001
netstat -ano | findstr :3001

# Changer le port dans le .env
PORT=3002
```

### Erreurs de validation
- Vérifiez que tous les champs requis sont fournis
- Consultez les logs du serveur pour plus de détails
- Utilisez un client API comme Postman pour tester

## 📈 Monitoring

### Logs en temps réel
```bash
npm run dev  # Les logs s'affichent automatiquement
```

### Statistiques de performance
```bash
curl http://localhost:3001/api/stats/performances
```

### État de la base de données
```bash
curl http://localhost:3001/health
```

## 🚀 Déploiement en production

### 1. Variables d'environnement
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Atlas recommandé
PORT=3001
```

### 2. Optimisations
- Utilisez MongoDB Atlas pour la production
- Configurez les index appropriés
- Activez la compression
- Configurez le monitoring

### 3. Sécurité
- Changez `JWT_SECRET` pour une valeur sécurisée
- Configurez `ALLOWED_ORIGINS` avec vos domaines
- Ajustez les limites de requêtes

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Testez la connexion MongoDB
3. Consultez la documentation des erreurs
4. Vérifiez que toutes les dépendances sont installées

Bonne configuration ! 🎮