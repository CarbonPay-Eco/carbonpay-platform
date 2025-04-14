import { AppDataSource } from './data-source';
import { NODE_ENV } from '../config/constants';

/**
 * Função para executar a migração do banco de dados
 */
export const runMigration = async () => {
  try {
    console.log(`Iniciando migração para o ambiente: ${NODE_ENV}`);
    
    // Inicializar conexão com o banco de dados
    await AppDataSource.initialize();
    console.log('Conexão com o banco de dados estabelecida.');
    
    // Verificar se há migrações pendentes (se não estiver usando synchronize)
    if (!AppDataSource.options.synchronize) {
      console.log('Executando migrações...');
      const migrations = await AppDataSource.runMigrations();
      console.log(`${migrations.length} migrações executadas.`);
    } else {
      console.log('Modo synchronize ativado. O esquema será sincronizado automaticamente.');
    }
    
    console.log('Migração concluída com sucesso.');
    
    return true;
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return false;
  } finally {
    // Encerrar a conexão
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Conexão com o banco de dados encerrada.');
    }
  }
};

// Executar a migração se este arquivo for chamado diretamente
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (result) {
        console.log('Migração executada com sucesso.');
        process.exit(0);
      } else {
        console.error('Erro ao executar migração.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Erro inesperado:', error);
      process.exit(1);
    });
} 