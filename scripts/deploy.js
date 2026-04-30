// SPDX-License-Identifier: MIT
/**
 * Script de despliegue para el contrato NotesMarketplace usando Hardhat.
 * 
 * Ejecución:
 *   npx hardhat run scripts/deploy.js --network celo
 * 
 * Requisitos:
 * - Tener una variable de entorno CELO_PRIVATE_KEY con la clave privada de la cuenta
 *   que realizará el despliegue.
 * - Instalar dependencias: @celo/hardhat-celo, dotenv, hardhat.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  // Verificar que la clave privada está configurada
  const privateKey = process.env.CELO_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "Falta la variable de entorno CELO_PRIVATE_KEY. Crea un archivo .env con tu clave privada."
    );
  }

  console.log("Desplegando NotesMarketplace...");

  // Obtener el factory del contrato
  const NotesMarketplace = await hre.ethers.getContractFactory("NotesMarketplace");

  // El contrato no tiene parámetros en el constructor
  const notesMarketplace = await NotesMarketplace.deploy();

  // Esperar a que el despliegue se confirme
  await notesMarketplace.waitForDeployment();

  console.log("NotesMarketplace desplegado en la dirección:", notesMarketplace.target);
}

// Manejo de errores
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error durante el despliegue:", error);
    process.exit(1);
  });
