#!/bin/sh

# Couleurs pour le logging
GREEN='\033[0;32m'
NC='\033[0m'

echo "${GREEN}Démarrage du script de surveillance...${NC}"

# Dossier git à surveiller (on vérifie l'existence de FETCH_HEAD ou HEAD)
WATCH_FILE=".git/FETCH_HEAD"

# Si le fichier n'existe pas encore (pas de git fetch fait), on le crée
if [ ! -f "$WATCH_FILE" ]; then
    touch "$WATCH_FILE"
fi

LAST_HASH=$(stat -c %Y "$WATCH_FILE")

# On s'assure que le dossier est marqué comme sûr pour git (nécessaire si monté en volume)
git config --global --add safe.directory /app

while true; do
    CURRENT_HASH=$(stat -c %Y "$WATCH_FILE")
    
    if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
        echo "${GREEN}Changement détecté dans .git ! Mise à jour en cours...${NC}"
        
        # On fait un pull pour être sûr d'avoir les derniers changements
        # Note: ceci suppose que le repo est déjà configuré
        git pull
        
        echo "${GREEN}Installation des dépendances...${NC}"
        pnpm install --frozen-lockfile
        
        echo "${GREEN}Application des migrations...${NC}"
        # On utilise db:push pour synchroniser le schéma sans forcément de fichiers de migration
        # S'il y a des fichiers de migration générés, on pourrait utiliser db:migrate
        pnpm run db:push --force || echo "Erreur lors du db:push, poursuite..."
        
        echo "${GREEN}Build de l'application...${NC}"
        pnpm run build
        
        echo "${GREEN}Redémarrage du service de production...${NC}"
        # On utilise docker pour redémarrer le conteneur app_prod défini dans docker-compose
        # On suppose que ce script tourne dans un conteneur qui a accès au socket docker
        docker compose restart app
        
        LAST_HASH=$CURRENT_HASH
        echo "${GREEN}Mise à jour terminée. Reprise de la surveillance...${NC}"
    fi
    
    sleep 10
done
