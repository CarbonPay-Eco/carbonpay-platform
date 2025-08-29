import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Script para gerar tipos TypeScript a partir do IDL do Anchor
async function generateTypes() {
  try {
    console.log("🔧 Generating TypeScript types from Anchor IDL...");

    // Verificar se o Anchor CLI está instalado
    try {
      execSync("anchor --version", { stdio: "pipe" });
    } catch (error) {
      console.error("❌ Anchor CLI not found. Please install it first:");
      console.error("   npm install -g @coral-xyz/anchor-cli");
      process.exit(1);
    }

    // Navegar para o diretório raiz do projeto
    const projectRoot = path.resolve(__dirname, "../../../..");
    process.chdir(projectRoot);

    // Build do programa Anchor para gerar o IDL
    console.log("📦 Building Anchor program...");
    execSync("anchor build", { stdio: "inherit" });

    // Gerar tipos TypeScript
    console.log("📝 Generating TypeScript types...");
    execSync("anchor build --skip-lint", { stdio: "inherit" });

    // Copiar o IDL para o frontend se necessário
    const idlSource = path.join(projectRoot, "target/idl/carbon_pay.json");
    const idlDest = path.join(
      projectRoot,
      "app/frontend/src/types/carbon_pay.json"
    );

    if (fs.existsSync(idlSource)) {
      fs.copyFileSync(idlSource, idlDest);
      console.log("✅ IDL copied to frontend types directory");
    }

    console.log("✅ TypeScript types generated successfully!");
    console.log("📁 Types available at: target/types/");
    console.log("📁 IDL available at: target/idl/");
  } catch (error) {
    console.error("❌ Error generating types:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateTypes();
}

export { generateTypes };
