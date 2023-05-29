// Import dependencies
const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set your private key and Alchemy API key
const privateKey = process.env.PRIVATE_KEY;
const alchemyApiKey = process.env.ALCHEMY_API_KEY;

module.exports = {
  networks: {
    // Local ganache
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 4600000
    },
    // Sepolia testnet configuration
    sepolia: {
      provider: () => new HDWalletProvider({
        privateKeys: [privateKey],
        providerOrUrl: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
      }),
      network_id: 11155111, // Sepolia testnet's network ID
      gas: 5500000,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.15", // Update this to match your desired Solidity version
    }
  }
};