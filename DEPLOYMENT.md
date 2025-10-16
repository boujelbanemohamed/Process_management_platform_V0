# Guide de Déploiement sur Red Hat

Ce guide explique comment déployer cette application Next.js sur un serveur Red Hat.

## Prérequis

- Un serveur Red Hat avec un accès root ou sudo.
- Git installé sur le serveur.
- Les informations de connexion à votre base de données Neon.

## Étape 1 : Préparation du Serveur

Ces commandes doivent être exécutées sur votre serveur Red Hat.

### 1. Installer Node.js et pnpm

Nous utiliserons `nvm` (Node Version Manager) pour installer Node.js, ce qui facilite la gestion des versions.

```bash
# Mettre à jour les paquets
sudo yum update -y

# Installer les outils de compilation
sudo yum groupinstall "Development Tools" -y

# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Charger nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Installer Node.js (LTS)
nvm install --lts

# Installer pnpm
npm install -g pnpm
```

### 2. Installer PM2

PM2 est un gestionnaire de processus pour les applications Node.js qui maintiendra notre application en ligne.

```bash
npm install -g pm2
```

### 3. Installer et Configurer Nginx

Nginx sera utilisé comme reverse proxy.

```bash
# Installer Nginx
sudo yum install nginx -y

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Créez un fichier de configuration pour votre application :

```bash
sudo nano /etc/nginx/conf.d/yourapp.conf
```

Collez la configuration suivante, en remplaçant `your_domain.com` par votre nom de domaine ou l'adresse IP de votre serveur :

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Testez la configuration de Nginx et redémarrez le service :

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Étape 2 : Déploiement de l'Application

### 1. Cloner le Dépôt

Clonez votre projet sur le serveur.

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Configurer les Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet pour stocker vos variables d'environnement.

```bash
nano .env.local
```

Ajoutez votre URL de base de données Neon. **Ne commitez jamais ce fichier avec des informations sensibles.**

```
DATABASE_URL="votre_url_de_base_de_donnees_neon"
```

### 3. Exécuter les Scripts

Rendez les scripts exécutables et lancez-les.

```bash
chmod +x init-db.sh deploy.sh

# Exécutez ce script uniquement lors du premier déploiement
./init-db.sh

# Exécutez ce script pour chaque déploiement
./deploy.sh
```

Votre application devrait maintenant être en ligne et accessible via votre nom de domaine ou votre adresse IP.