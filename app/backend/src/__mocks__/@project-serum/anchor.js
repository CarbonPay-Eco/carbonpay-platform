const jest = require('@jest/globals').jest;

const Program = jest.fn();
const AnchorProvider = jest.fn();

const web3 = {
  Connection: jest.fn(),
  Keypair: {
    generate: jest.fn(),
    fromSecretKey: jest.fn(),
  },
  PublicKey: jest.fn(),
  SystemProgram: {
    transfer: jest.fn(),
  },
};

module.exports = {
  Program,
  AnchorProvider,
  web3,
}; 