# Solana Program Integration Guide

Este guia explica como integrar diretamente o frontend com os programas Solana/Anchor sem depender de um backend.

## 📁 Estrutura dos Arquivos

```
src/
├── lib/
│   ├── solana-client.ts          # Cliente principal para interação com programas
│   └── solana-hooks.ts           # Hooks React para gerenciamento de estado
├── hooks/
│   └── useSolanaClient.ts        # Hook para gerenciar conexão e wallet
├── components/
│   └── solana/
│       └── CarbonPayActions.tsx  # Componente de exemplo com UI
└── app/
    └── solana-integration/
        └── page.tsx              # Página de exemplo
```

## 🚀 Como Usar

### 1. Configuração Inicial

Primeiro, certifique-se de que o programa Anchor está buildado:

```bash
# No diretório raiz do projeto
anchor build

# Ou usando o script do frontend
cd app/frontend
npm run anchor-build
```

### 2. Gerar Tipos TypeScript

```bash
# Gerar tipos automaticamente
npm run generate-types
```

### 3. Usar o Cliente Solana

```typescript
import { useSolanaClient } from '../hooks/useSolanaClient';

function MyComponent() {
  const { client, isConnected, publicKey } = useSolanaClient();
  
  const handleCreateProject = async () => {
    if (!client) return;
    
    try {
      const result = await client.initializeProject({
        amount: 1000,
        pricePerToken: 1,
        carbonPayFee: 5,
        uri: 'https://example.com/metadata.json',
        name: 'Carbon Project',
        symbol: 'CARBON',
        nftMint: new PublicKey('...'),
        tokenMint: new PublicKey('...'),
      });
      
      console.log('Project created:', result.tx);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <button onClick={handleCreateProject}>
      Create Project
    </button>
  );
}
```

### 4. Usar Hooks Avançados

```typescript
import { useProjects, useCreateProject } from '../lib/solana-hooks';

function ProjectsList() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  const handleCreate = async () => {
    await createProject.mutateAsync({
      amount: 1000,
      pricePerToken: 1,
      carbonPayFee: 5,
      uri: 'https://example.com/metadata.json',
      name: 'New Project',
      symbol: 'PROJ',
      nftMint: Keypair.generate().publicKey,
      tokenMint: Keypair.generate().publicKey,
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {projects?.map((project, index) => (
        <div key={index}>
          <h3>{project.account.name}</h3>
          <p>Amount: {project.account.amount.toString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Funcionalidades Disponíveis

### SolanaClient Methods

- `initializeCarbonCredits()` - Inicializa a conta de carbon credits
- `initializeProject(params)` - Cria um novo projeto
- `requestOffset(params)` - Solicita offset de carbono
- `purchaseCarbonCredits(params)` - Compra carbon credits
- `getProject(projectPDA)` - Busca dados de um projeto
- `getAllProjects()` - Lista todos os projetos
- `getCarbonCredits()` - Busca dados do carbon credits

### React Hooks

- `useProjects()` - Busca todos os projetos com cache
- `useProject(projectPDA)` - Busca projeto específico
- `useCarbonCredits()` - Busca dados do carbon credits
- `useCreateProject()` - Mutation para criar projeto
- `useRequestOffset()` - Mutation para solicitar offset
- `usePurchaseCarbonCredits()` - Mutation para comprar credits
- `useTransactionStatus(signature)` - Monitora status de transação

## 📋 Exemplo Completo

```typescript
import React, { useState } from 'react';
import { useSolanaClient } from '../hooks/useSolanaClient';
import { useProjects, useCreateProject } from '../lib/solana-hooks';
import { Keypair, PublicKey } from '@solana/web3.js';

export const CarbonPayDashboard: React.FC = () => {
  const { client, isConnected } = useSolanaClient();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    name: '',
    amount: 1000,
    pricePerToken: 1,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;
    
    try {
      const nftMint = Keypair.generate();
      const tokenMint = Keypair.generate();
      
      await createProject.mutateAsync({
        ...formData,
        carbonPayFee: 5,
        uri: 'https://example.com/metadata.json',
        symbol: 'PROJ',
        nftMint: nftMint.publicKey,
        tokenMint: tokenMint.publicKey,
      });
      
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };
  
  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }
  
  return (
    <div>
      <h1>CarbonPay Dashboard</h1>
      
      {/* Form para criar projeto */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Project Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
        />
        <button type="submit" disabled={createProject.isPending}>
          {createProject.isPending ? 'Creating...' : 'Create Project'}
        </button>
      </form>
      
      {/* Lista de projetos */}
      {isLoading ? (
        <div>Loading projects...</div>
      ) : (
        <div>
          <h2>Projects ({projects?.length || 0})</h2>
          {projects?.map((project, index) => (
            <div key={index} className="project-card">
              <h3>{project.account.name}</h3>
              <p>Amount: {project.account.amount.toString()}</p>
              <p>Remaining: {project.account.remainingAmount.toString()}</p>
              <p>Price: {project.account.pricePerToken.toString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## ⚠️ Considerações Importantes

1. **Wallet Connection**: Sempre verifique se a wallet está conectada antes de usar o cliente
2. **Error Handling**: Implemente tratamento de erros adequado para todas as operações
3. **Transaction Confirmation**: Use `useTransactionStatus` para monitorar confirmações
4. **Network Selection**: Certifique-se de estar na rede correta (devnet/mainnet)
5. **Gas Fees**: Considere os custos de transação ao fazer operações

## 🔄 Fluxo de Desenvolvimento

1. **Desenvolver programa Anchor** → `anchor build`
2. **Gerar tipos** → `npm run generate-types`
3. **Implementar UI** → Usar hooks e componentes
4. **Testar** → Usar devnet ou localnet
5. **Deploy** → Deploy para mainnet

## 🛠️ Troubleshooting

### Erro: "Client not available"
- Verifique se a wallet está conectada
- Certifique-se de que o provider está configurado corretamente

### Erro: "Program not found"
- Verifique se o programa está deployado na rede correta
- Confirme se o IDL está atualizado

### Erro: "Invalid account"
- Verifique se todos os PDAs estão sendo calculados corretamente
- Confirme se as contas existem antes de usar

## 📚 Recursos Adicionais

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js](https://docs.solana.com/developing/clients/javascript-api)
- [React Query](https://tanstack.com/query/latest) 