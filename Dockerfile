# Utiliser une image Node.js légère
FROM node:18-alpine

# Créer le dossier de l'app
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Construire l'application Next.js
RUN npm run build

# Exposer le port 3000
EXPOSE 3000

# Lancer l'application
CMD ["npm", "start"]