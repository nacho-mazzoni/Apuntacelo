require("@celo/hardhat-celo");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "celo",
  networks: {
    hardhat: {},
    celo: {
      // Mainnet de Celo
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: [process.env.CELO_PRIVATE_KEY].filter(Boolean),
      // Opcional: puedes ajustar el gasPrice si lo deseas
      // gasPrice: 5000000000,
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
