#!/usr/bin/env node

/**
 * Test Runner Utility for CarbonPay Backend
 * 
 * This script provides convenient ways to run different types of tests
 * and generate coverage reports.
 */

import { spawn } from 'child_process';
import path from 'path';

interface TestOptions {
  type: 'unit' | 'integration' | 'services' | 'controllers' | 'middleware' | 'utils' | 'all';
  coverage?: boolean;
  watch?: boolean;
  verbose?: boolean;
  pattern?: string;
}

const TEST_PATTERNS = {
  unit: 'src/__tests__/(services|controllers|middleware|utils)/**/*.test.ts',
  integration: 'src/__tests__/integration/**/*.test.ts',
  services: 'src/__tests__/services/**/*.test.ts',
  controllers: 'src/__tests__/controllers/**/*.test.ts',
  middleware: 'src/__tests__/middleware/**/*.test.ts',
  utils: 'src/__tests__/utils/**/*.test.ts',
  all: 'src/__tests__/**/*.test.ts'
};

const COVERAGE_THRESHOLDS = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
};

class TestRunner {
  private options: TestOptions;

  constructor(options: TestOptions) {
    this.options = options;
  }

  public async run(): Promise<void> {
    console.log(`🧪 Running ${this.options.type} tests...`);
    
    const jestArgs = this.buildJestArgs();
    
    try {
      await this.executeJest(jestArgs);
      console.log('✅ Tests completed successfully!');
    } catch (error) {
      console.error('❌ Tests failed!');
      process.exit(1);
    }
  }

  private buildJestArgs(): string[] {
    const args: string[] = [];

    // Add test pattern
    if (this.options.pattern) {
      args.push(this.options.pattern);
    } else {
      args.push(TEST_PATTERNS[this.options.type]);
    }

    // Add coverage flag
    if (this.options.coverage) {
      args.push('--coverage');
      args.push('--collectCoverageFrom=src/**/*.{ts,js}');
      args.push('--coverageReporters=text,lcov,html');
    }

    // Add watch flag
    if (this.options.watch) {
      args.push('--watch');
    }

    // Add verbose flag
    if (this.options.verbose) {
      args.push('--verbose');
    }

    // Add other useful flags
    args.push('--runInBand'); // Run tests serially
    args.push('--detectOpenHandles'); // Detect handles that prevent Jest from exiting
    args.push('--forceExit'); // Force Jest to exit after all tests complete

    return args;
  }

  private executeJest(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      jest.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Jest exited with code ${code}`));
        }
      });

      jest.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// CLI Interface
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    type: 'all',
    coverage: false,
    watch: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.type = args[++i] as TestOptions['type'];
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--pattern':
      case '-p':
        options.pattern = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
        // Assume it's a test pattern
        options.pattern = arg;
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
CarbonPay Backend Test Runner

Usage: ts-node test-runner.ts [options]

Options:
  -t, --type <type>      Test type: unit, integration, services, controllers, middleware, utils, all (default: all)
  -c, --coverage         Generate coverage report
  -w, --watch            Watch for changes
  -v, --verbose          Verbose output
  -p, --pattern <pattern> Custom test pattern
  -h, --help             Show help

Examples:
  ts-node test-runner.ts --type services --coverage
  ts-node test-runner.ts --type integration --watch
  ts-node test-runner.ts --pattern "auth" --verbose
  ts-node test-runner.ts --type all --coverage

Test Categories:
  unit         - All unit tests (services, controllers, middleware, utils)
  integration  - Integration tests
  services     - Service layer tests
  controllers  - Controller layer tests
  middleware   - Middleware tests
  utils        - Utility function tests
  all          - All tests
  `);
}

// Predefined test commands
export const TestCommands = {
  // Quick test commands
  async runServices(coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'services', coverage });
    await runner.run();
  },

  async runControllers(coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'controllers', coverage });
    await runner.run();
  },

  async runIntegration(coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'integration', coverage });
    await runner.run();
  },

  async runAll(coverage = true): Promise<void> {
    const runner = new TestRunner({ type: 'all', coverage });
    await runner.run();
  },

  // Development commands
  async watchServices(): Promise<void> {
    const runner = new TestRunner({ type: 'services', watch: true });
    await runner.run();
  },

  async watchControllers(): Promise<void> {
    const runner = new TestRunner({ type: 'controllers', watch: true });
    await runner.run();
  },

  // Custom patterns
  async runPattern(pattern: string, coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'all', pattern, coverage });
    await runner.run();
  },

  // Full test suite with coverage
  async runFullSuite(): Promise<void> {
    console.log('🚀 Running full test suite with coverage...');
    
    try {
      // Run unit tests
      console.log('\n📋 Running unit tests...');
      await this.runServices(true);
      await this.runControllers(true);
      await this.runMiddleware(true);
      await this.runUtils(true);
      
      // Run integration tests
      console.log('\n🔗 Running integration tests...');
      await this.runIntegration(true);
      
      console.log('\n✅ Full test suite completed successfully!');
      console.log('📊 Coverage reports generated in ./coverage/');
      
    } catch (error) {
      console.error('\n❌ Full test suite failed!');
      throw error;
    }
  },

  async runMiddleware(coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'middleware', coverage });
    await runner.run();
  },

  async runUtils(coverage = false): Promise<void> {
    const runner = new TestRunner({ type: 'utils', coverage });
    await runner.run();
  }
};

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const runner = new TestRunner(options);
  runner.run().catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export default TestRunner; 