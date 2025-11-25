import * as bcrypt from "bcryptjs";
import "dotenv/config";

/**
 * Script para gerar hash de senha usando bcrypt
 * Usage: ts-node scripts/hash-password.ts <senha>
 * 
 * Exemplo:
 * ts-node scripts/hash-password.ts minhaSenha123
 */
async function hashPassword(password: string) {
  try {
    // Usa 10 salt rounds (mesmo padrão usado no AuthService)
    const hash = await bcrypt.hash(password, 10);
    console.log("\n✅ Hash gerado com sucesso!\n");
    console.log("Senha:", password);
    console.log("Hash:", hash);
    console.log("\nCopie o hash acima e use no script create-admin.sql\n");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao gerar hash:", error);
    process.exit(1);
  }
}

// Get password from command line arguments
const password = process.argv[2];

if (!password) {
  console.error("Usage: ts-node scripts/hash-password.ts <senha>");
  console.error("Example: ts-node scripts/hash-password.ts minhaSenha123");
  process.exit(1);
}

hashPassword(password);

