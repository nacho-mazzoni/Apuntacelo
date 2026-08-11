import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, keccak256, parseUnits, stringToHex, zeroAddress } from "viem";

const Status = { Open: 0, Closed: 1 } as const;
const CONTENT_HASH = keccak256(stringToHex("apuntes"));
const REWARD_6 = parseUnits("10", 6);
const MINT_AMOUNT = parseUnits("1000", 6);

async function deployFixture() {
  const token = await hre.viem.deployContract("MockERC20", ["Test USDC", "USDC", 6]);
  const [owner, seller] = await hre.viem.getWalletClients();
  await token.write.mint([owner.account.address, MINT_AMOUNT]);
  await token.write.mint([seller.account.address, MINT_AMOUNT]);

  const contract = await hre.viem.deployContract("BountyBasedNotes", [[token.address]]);
  const publicClient = await hre.viem.getPublicClient();
  await token.write.approve([contract.address, MINT_AMOUNT]);

  return { contract, token, owner, seller, publicClient };
}

async function createRequest(contract: any, token: any, amount: bigint, account?: `0x${string}`) {
  const wallet = account ? { account } : undefined;
  const hash = await contract.write.createRequest([CONTENT_HASH, token.address, amount], wallet);
  return hash;
}

describe("BountyBasedNotes", function () {
  it("initializes the supported token whitelist", async function () {
    const { contract, token } = await loadFixture(deployFixture);
    expect(await contract.read.supportedTokens([token.address])).to.equal(true);
    expect(await contract.read.supportedTokens([zeroAddress])).to.equal(false);
  });

  it("creates a bounty and escrows the ERC-20 reward", async function () {
    const { contract, token, owner, publicClient } = await loadFixture(deployFixture);
    const hash = await createRequest(contract, token, REWARD_6);
    await publicClient.waitForTransactionReceipt({ hash });

    const request = await contract.read.getRequest([1n]);
    expect(request[0]).to.equal(1n);
    expect(request[1].toLowerCase()).to.equal(getAddress(owner.account.address).toLowerCase());
    expect(request[2]).to.equal(CONTENT_HASH);
    expect(request[3]).to.equal(REWARD_6);
    expect(request[4].toLowerCase()).to.equal(getAddress(token.address).toLowerCase());
    expect(request[5]).to.equal(Status.Open);
    expect(await token.read.balanceOf([contract.address])).to.equal(REWARD_6);
  });

  it("rejects zero amounts and unsupported tokens", async function () {
    const { contract, token } = await loadFixture(deployFixture);
    const otherToken = await hre.viem.deployContract("MockERC20", ["Other", "OTHER", 6]);

    await expect(createRequest(contract, token, 0n)).to.be.rejectedWith("La recompensa debe ser mayor a 0");
    await expect(createRequest(contract, otherToken, REWARD_6)).to.be.rejectedWith("Token no soportado");
    await expect(contract.write.createRequest([CONTENT_HASH, zeroAddress, REWARD_6])).to.be.rejectedWith("Token no soportado");
  });

  it("pays the seller when an offer is accepted", async function () {
    const { contract, token, seller, publicClient } = await loadFixture(deployFixture);
    await createRequest(contract, token, REWARD_6);
    await contract.write.offerNote([1n], { account: seller.account.address });

    const before = await token.read.balanceOf([seller.account.address]);
    const hash = await contract.write.acceptOffer([1n, 0n, 5]);
    await publicClient.waitForTransactionReceipt({ hash });

    expect((await token.read.balanceOf([seller.account.address])) - before).to.equal(REWARD_6);
    expect(await contract.read.reputation([seller.account.address])).to.equal(5n);
    expect(await contract.read.completedTasks([seller.account.address])).to.equal(1n);
    expect((await contract.read.getRequest([1n]))[5]).to.equal(Status.Closed);
  });

  it("returns the escrow when a bounty is cancelled", async function () {
    const { contract, token, owner } = await loadFixture(deployFixture);
    const before = await token.read.balanceOf([owner.account.address]);
    await createRequest(contract, token, REWARD_6);
    await contract.write.cancelRequest([1n]);

    expect((await token.read.balanceOf([owner.account.address])) - before).to.equal(0n);
    expect(await token.read.balanceOf([contract.address])).to.equal(0n);
  });

  it("supports token-specific decimal amounts", async function () {
    const token18 = await hre.viem.deployContract("MockERC20", ["Test USDm", "USDm", 18]);
    const [owner] = await hre.viem.getWalletClients();
    const amount = parseUnits("1.25", 18);
    await token18.write.mint([owner.account.address, amount]);
    const contract = await hre.viem.deployContract("BountyBasedNotes", [[token18.address]]);
    await token18.write.approve([contract.address, amount]);

    await contract.write.createRequest([CONTENT_HASH, token18.address, amount]);
    expect((await contract.read.getRequest([1n]))[3]).to.equal(amount);
  });
});
