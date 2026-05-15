import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NotesMarketplaceModule = buildModule("NotesMarketplaceModule", (m) => {
  const notesMarketplace = m.contract("BountyBasedNotes");

  return { notesMarketplace };
});

export default NotesMarketplaceModule;
