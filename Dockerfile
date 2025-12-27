# Utiliser une image Node.js légère (Version 20 nécessaire pour Next.js récent)
FROM node:20-alpine

# Installer la librairie de compatibilité requise pour Next.js
RUN apk add --no-cache libc6-compat

# Créer le dossier de l'app
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Construire l'application Next.js
# Note : Si ESLint bloque, on peut ajouter ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Exposer le port 3000
EXPOSE 3000

# Lancer l'application
CMD ["npm", "start"]