#!/bin/bash

# Cores para melhorar a legibilidade
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Encerrando ambiente CarbonPay =====${NC}"

# Verificar containers em execução
echo -e "${YELLOW}Containers em execução:${NC}"
docker-compose ps

# Parar todos os containers
echo -e "\n${YELLOW}Parando containers...${NC}"
docker-compose down

# Verificar se há volumes que precisam ser removidos
echo -e "\n${YELLOW}Verificando volumes Docker...${NC}"
VOLUMES=$(docker volume ls -q -f "dangling=true")

if [ -n "$VOLUMES" ]; then
    echo -e "${YELLOW}Removendo volumes não utilizados...${NC}"
    docker volume rm $VOLUMES
    echo -e "${GREEN}Volumes removidos com sucesso!${NC}"
else
    echo -e "${GREEN}Nenhum volume para remover.${NC}"
fi

# Limpar cache do Docker
echo -e "\n${YELLOW}Limpando cache do Docker...${NC}"
docker system prune -f

echo -e "\n${GREEN}===== Ambiente encerrado com sucesso! =====${NC}"
echo -e "${YELLOW}Para iniciar novamente, execute:${NC} ./docker-start.sh" 