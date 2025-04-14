#!/bin/bash

# Cores para melhorar a legibilidade
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}      CarbonPay - Testes Completos do Sistema     ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Função para executar um comando e verificar o resultado
run_test() {
    local name=$1
    local cmd=$2
    
    echo -e "\n${YELLOW}===== Executando teste: $name =====${NC}"
    echo -e "${YELLOW}Comando: $cmd${NC}"
    
    # Executar o comando
    eval $cmd
    
    # Verificar resultado
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Teste $name completado com sucesso!${NC}"
        return 0
    else
        echo -e "${RED}✗ Teste $name falhou!${NC}"
        return 1
    fi
}

# Menu de opções
echo -e "${YELLOW}Selecione os testes a serem executados:${NC}"
echo -e "${GREEN}1${NC} - Testes básicos (lint e unitários)"
echo -e "${GREEN}2${NC} - Testes básicos + compilação"
echo -e "${GREEN}3${NC} - Testes básicos + compilação + Docker build"
echo -e "${GREEN}4${NC} - Todos os testes (inclui execução do Docker)"
echo -e "${GREEN}0${NC} - Sair"

read -p "Opção: " option

# Arrays para armazenar resultados
declare -a passed_tests
declare -a failed_tests

# Funções para registrar resultados
record_success() {
    passed_tests+=("$1")
}

record_failure() {
    failed_tests+=("$1")
}

case $option in
    1|2|3|4)
        # Testes básicos - sempre rodam
        run_test "Verificação de tipos TypeScript" "yarn tsc --noEmit"
        if [ $? -eq 0 ]; then record_success "TypeScript"; else record_failure "TypeScript"; fi
        
        run_test "Testes unitários" "yarn test"
        if [ $? -eq 0 ]; then record_success "Testes unitários"; else record_failure "Testes unitários"; fi
        
        # Se opção >= 2, testar compilação
        if [ $option -ge 2 ]; then
            run_test "Compilação para produção" "yarn build"
            if [ $? -eq 0 ]; then record_success "Compilação"; else record_failure "Compilação"; fi
        fi
        
        # Se opção >= 3, testar Docker build
        if [ $option -ge 3 ]; then
            run_test "Build da imagem Docker" "docker build -t carbonpay-backend:test ."
            if [ $? -eq 0 ]; then record_success "Docker build"; else record_failure "Docker build"; fi
        fi
        
        # Se opção = 4, testar execução do Docker
        if [ $option -eq 4 ]; then
            # Parar contêineres existentes, se houver
            echo -e "${YELLOW}Parando contêineres existentes...${NC}"
            docker-compose down 2>/dev/null
            
            run_test "Iniciar contêineres com Docker Compose" "docker-compose up -d"
            if [ $? -eq 0 ]; then 
                record_success "Docker Compose up"
                
                # Esperar serviços iniciarem
                echo -e "${YELLOW}Aguardando serviços inicializarem...${NC}"
                sleep 10
                
                # Extrair porta do .env
                PORT=$(grep PORT .env | cut -d '=' -f2 | head -1 || echo 3000)
                
                run_test "Verificar API Health" "curl -s http://localhost:${PORT}/api/health"
                if [ $? -eq 0 ]; then record_success "API Health"; else record_failure "API Health"; fi
                
                # Parar contêineres
                echo -e "${YELLOW}Parando contêineres...${NC}"
                docker-compose down
            else
                record_failure "Docker Compose up"
            fi
        fi
        ;;
        
    0)
        echo -e "${GREEN}Saindo...${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Opção inválida!${NC}"
        exit 1
        ;;
esac

# Exibir resumo dos testes
echo -e "\n${BLUE}==================================================${NC}"
echo -e "${BLUE}                Resumo dos Testes                 ${NC}"
echo -e "${BLUE}==================================================${NC}"

echo -e "${GREEN}Testes bem-sucedidos: ${#passed_tests[@]}${NC}"
for test in "${passed_tests[@]}"; do
    echo -e "  ${GREEN}✓ $test${NC}"
done

echo -e "\n${RED}Testes falhos: ${#failed_tests[@]}${NC}"
for test in "${failed_tests[@]}"; do
    echo -e "  ${RED}✗ $test${NC}"
done

echo -e "\n${BLUE}==================================================${NC}"

# Finalizar com sucesso apenas se todos os testes passaram
if [ ${#failed_tests[@]} -eq 0 ]; then
    echo -e "${GREEN}Todos os testes foram bem-sucedidos!${NC}"
    exit 0
else
    echo -e "${RED}Alguns testes falharam. Verifique os logs acima.${NC}"
    exit 1
fi 