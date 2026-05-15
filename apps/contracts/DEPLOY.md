# Deploy a Celo Sepolia

1. Asegurate de tener el `.env` en `apps/contracts/` con tu private key:
```
PRIVATE_KEY=tu_private_key_aqui
```

2. Compile the contract:
```bash
cd apps/contracts
npx hardhat compile
```

3. Deploy a Celo Sepolia:
```bash
npx hardhat ignition deploy ignition/modules/DeployNotesMarketplace.ts --network celo-sepolia
```

4. Copy the deployed contract address y pegalo en `apps/web/.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

5. (Opcional) Verify on Celoscan:
```bash
npx hardhat verify --network celo-sepolia <CONTRACT_ADDRESS>
```
