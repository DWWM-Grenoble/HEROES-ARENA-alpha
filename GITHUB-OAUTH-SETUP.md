# 🔐 Configuration GitHub SSO pour Heroes Arena

## 📋 Étape 1: Créer une GitHub OAuth App

### 1. Aller sur GitHub Settings
1. Connectez-vous à GitHub
2. Allez dans **Settings** → **Developer settings** → **OAuth Apps**
3. Cliquez sur **"New OAuth App"**

### 2. Configurer l'application
```
Application name: Heroes Arena
Homepage URL: http://localhost:3000
Application description: Système d'authentification pour Heroes Arena
Authorization callback URL: http://localhost:3001/api/auth/github/callback
```

### 3. Récupérer les clés
Après création, notez :
- **Client ID** (public)
- **Client Secret** (privé - à garder secret)

## 🔧 Étape 2: Configuration du projet

### Mettre à jour le fichier .env
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# JWT pour les sessions
JWT_SECRET=your_very_secure_jwt_secret_here
JWT_EXPIRE=7d

# Frontend URL pour les redirections
FRONTEND_URL=http://localhost:3000
```

## 🚨 Résolution des problèmes courants

### Problème: "Email not public"
**Solution**: L'API récupère automatiquement l'email même s'il n'est pas public

### Problème: "Email not verified"
**Solution**: Vérifie automatiquement le statut de vérification GitHub

### Problème: "Invalid redirect_uri"
**Solution**: Vérifiez que l'URL de callback correspond exactement

## 🔗 URLs importantes

- **URL d'autorisation**: `https://github.com/login/oauth/authorize`
- **URL de token**: `https://github.com/login/oauth/access_token`
- **API utilisateur**: `https://api.github.com/user`
- **API emails**: `https://api.github.com/user/emails`

## 🧪 Test de l'intégration

### 1. Démarrer le serveur
```bash
cd backend
npm run dev
```

### 2. Tester la route d'autorisation
```
http://localhost:3001/api/auth/github
```

### 3. Vérifier le callback
Après autorisation GitHub, vous devriez être redirigé vers votre frontend avec un token JWT.

## 🔍 Debugging

### Vérifier les logs
Les logs du serveur montreront :
- ✅ Données reçues de GitHub
- ✅ Email trouvé (public ou privé)
- ✅ Statut de vérification
- ✅ Création/mise à jour utilisateur

### Tester l'API GitHub manuellement
```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" https://api.github.com/user/emails
```