#!/bin/bash

# Cores para melhorar a legibilidade
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não está instalado. Por favor, instale o Docker e tente novamente.${NC}"
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não está instalado. Por favor, instale o Docker Compose e tente novamente.${NC}"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}Arquivo .env não encontrado.${NC}"
    echo -e "${YELLOW}Usando .env.docker se existir, ou criando um arquivo .env básico...${NC}"
    
    if [ -f .env.docker ]; then
        cp .env.docker .env
        echo -e "${GREEN}Arquivo .env.docker copiado para .env${NC}"
    else
        cp .env.example .env 2>/dev/null || echo -e "${RED}Arquivo .env.example também não encontrado.${NC}"
    fi
fi

echo -e "${YELLOW}===== Construindo e iniciando contêineres CarbonPay =====${NC}"

# Parar contêineres existentes, se houver
docker-compose down 2>/dev/null

# Construir e iniciar os contêineres em segundo plano
docker-compose up -d --build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao construir/iniciar os contêineres. Veja os logs acima.${NC}"
    exit 1
fi

echo -e "${GREEN}===== Contêineres iniciados com sucesso! =====${NC}"

# Esperar um momento para os serviços inicializarem
echo -e "${YELLOW}Aguardando serviços inicializarem...${NC}"
sleep 5

echo -e "${YELLOW}===== Verificando status dos contêineres =====${NC}"
docker-compose ps

echo -e "${YELLOW}===== Verificando saúde da API =====${NC}"
PORT=$(grep PORT .env | cut -d '=' -f2 | head -1 || echo 3000)

# Tentar verificar a saúde da API
for i in {1..5}; do
    echo -e "${YELLOW}Tentativa $i de verificar a API...${NC}"
    
    if curl -s http://localhost:${PORT}/api/health > /dev/null; then
        echo -e "${GREEN}API está respondendo em http://localhost:${PORT}/api${NC}"
        echo -e "${GREEN}Teste de saúde: http://localhost:${PORT}/api/health${NC}"
        echo -e "\n${YELLOW}===== Exibindo logs do backend =====${NC}"
        docker-compose logs -f backend
        exit 0
    else
        echo -e "${YELLOW}API ainda não está respondendo, aguardando...${NC}"
        sleep 3
    fi
done

echo -e "${RED}A API não respondeu após várias tentativas.${NC}"
echo -e "${YELLOW}Exibindo logs do backend para diagnóstico:${NC}"
docker-compose logs backend

echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  ${GREEN}docker-compose ps${NC} - Ver status dos contêineres"
echo -e "  ${GREEN}docker-compose logs -f backend${NC} - Ver logs em tempo real"
echo -e "  ${GREEN}docker-compose down${NC} - Parar todos os contêineres"
echo -e "  ${GREEN}docker-compose restart backend${NC} - Reiniciar apenas o backend" 