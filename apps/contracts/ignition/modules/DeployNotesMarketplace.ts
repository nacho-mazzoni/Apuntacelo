import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NotesMarketplaceModule = buildModule("NotesMarketplaceModule", (m) => {
  const supportedTokens = m.getParameter("supportedTokens", [
    "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD/USDm
    "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // USDC
    "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // USDT
  ]);
  const notesMarketplace = m.contract("BountyBasedNotes", [supportedTokens]);

  return { notesMarketplace };
});

export default NotesMarketplaceModule;
