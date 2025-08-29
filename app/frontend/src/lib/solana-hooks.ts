import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSolanaClient } from "../hooks/useSolanaClient";
import { PublicKey } from "@solana/web3.js";

// Hook para buscar todos os projetos
export const useProjects = () => {
  const { client } = useSolanaClient();

  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!client) throw new Error("Client not available");
      return await client.getAllProjects();
    },
    enabled: !!client,
    staleTime: 30000, // 30 segundos
  });
};

// Hook para buscar um projeto específico
export const useProject = (projectPDA: string | null) => {
  const { client } = useSolanaClient();

  return useQuery({
    queryKey: ["project", projectPDA],
    queryFn: async () => {
      if (!client || !projectPDA)
        throw new Error("Client or PDA not available");
      return await client.getProject(new PublicKey(projectPDA));
    },
    enabled: !!client && !!projectPDA,
    staleTime: 30000,
  });
};

// Hook para buscar dados do carbon credits
export const useCarbonCredits = () => {
  const { client } = useSolanaClient();

  return useQuery({
    queryKey: ["carbonCredits"],
    queryFn: async () => {
      if (!client) throw new Error("Client not available");
      return await client.getCarbonCredits();
    },
    enabled: !!client,
    staleTime: 30000,
  });
};

// Hook para inicializar carbon credits
export const useInitializeCarbonCredits = () => {
  const { client } = useSolanaClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not available");
      return await client.initializeCarbonCredits();
    },
    onSuccess: () => {
      // Invalidate queries para refetch
      queryClient.invalidateQueries({ queryKey: ["carbonCredits"] });
    },
  });
};

// Hook para criar projeto
export const useCreateProject = () => {
  const { client } = useSolanaClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      pricePerToken: number;
      carbonPayFee: number;
      uri: string;
      name: string;
      symbol: string;
      nftMint: PublicKey;
      tokenMint: PublicKey;
    }) => {
      if (!client) throw new Error("Client not available");
      return await client.initializeProject(params);
    },
    onSuccess: () => {
      // Invalidate queries para refetch
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["carbonCredits"] });
    },
  });
};

// Hook para solicitar offset
export const useRequestOffset = () => {
  const { client } = useSolanaClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      requestId: string;
      projectPDA: PublicKey;
    }) => {
      if (!client) throw new Error("Client not available");
      return await client.requestOffset(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries para refetch
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectPDA.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Hook para comprar carbon credits
export const usePurchaseCarbonCredits = () => {
  const { client } = useSolanaClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      projectPDA: PublicKey;
      tokenMint: PublicKey;
    }) => {
      if (!client) throw new Error("Client not available");
      return await client.purchaseCarbonCredits(params);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries para refetch
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectPDA.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["carbonCredits"] });
    },
  });
};

// Hook para monitorar transações
export const useTransactionStatus = (signature: string | null) => {
  const { connection } = useSolanaClient();

  return useQuery({
    queryKey: ["transaction", signature],
    queryFn: async () => {
      if (!signature) throw new Error("No signature provided");
      return await connection?.getSignatureStatus(signature);
    },
    enabled: !!signature && !!connection,
    refetchInterval: 2000, // Poll a cada 2 segundos
    refetchIntervalInBackground: true,
  });
};
