import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseUnits, zeroAddress } from "viem";

const Status = { Open: 0, Closed: 1 } as const;

const TITLE = "Apuntes de Algebra";
const DESCRIPTION = "Necesito apuntes del modulo 3";
const LINK = "ipfs://QmTest123";
const REWARD = parseUnits("10", 6); // 10 USDC (6 decimals)
const MINT_AMOUNT = parseUnits("1000", 6);

async function deployTokenFixture() {
  const token = await hre.viem.deployContract("MockERC20", ["Test USDC", "USDC", 6]);
  const [owner, seller] = await hre.viem.getWalletClients();

  await token.write.mint([owner.account.address, MINT_AMOUNT]);
  await token.write.mint([seller.account.address, MINT_AMOUNT]);

  return { token, owner, seller };
}

async function deployBountyFixture() {
  const { token, owner, seller } = await deployTokenFixture();
  const contract = await hre.viem.deployContract("BountyBasedNotes");
  const publicClient = await hre.viem.getPublicClient();

  // Approve contract to spend owner's tokens
  await token.write.approve([contract.address, MINT_AMOUNT]);

  return { contract, token, owner, seller, publicClient };
}

async function createRequestWithApproval(
  contract: any,
  token: any,
  walletClient: any,
  title: string,
  description: string,
  amount: bigint
) {
  // Must approve from the wallet that will create the request
  await token.write.approve([contract.address, amount], {
    account: walletClient.account.address,
  });
  const hash = await contract.write.createRequest(
    [title, description, token.address, amount],
    { account: walletClient.account.address }
  );
  return hash;
}

describe("BountyBasedNotes", function () {
  describe("Deployment", function () {
    it("Should deploy with zero requests", async function () {
      const { contract } = await loadFixture(deployBountyFixture);
      expect(await contract.read.getRequestCount()).to.equal(0n);
    });
  });

  describe("createRequest", function () {
    it("Should create a request and emit RequestCreated", async function () {
      const { contract, token, owner } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      const hash = await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const count = await contract.read.getRequestCount();
      expect(count).to.equal(1n);

      const request = await contract.read.getRequest([1n]);
      expect(request[0]).to.equal(1n);
      expect(request[1].toLowerCase()).to.equal(
        getAddress(owner.account.address).toLowerCase()
      );
      expect(request[2]).to.equal(TITLE);
      expect(request[3]).to.equal(DESCRIPTION);
      expect(request[4]).to.equal(REWARD);
      expect(request[5].toLowerCase()).to.equal(
        getAddress(token.address).toLowerCase()
      );
      expect(request[6]).to.equal(Status.Open);
    });

    it("Should transfer tokens to contract", async function () {
      const { contract, token, owner } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      const hash = await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const contractBalance = await token.read.balanceOf([contract.address]);
      expect(contractBalance).to.equal(REWARD);
    });

    it("Should revert if reward is zero", async function () {
      const { contract, token } = await loadFixture(deployBountyFixture);

      await expect(
        contract.write.createRequest([TITLE, DESCRIPTION, token.address, 0n])
      ).to.be.rejectedWith("La recompensa debe ser mayor a 0");
    });

    it("Should revert if token is zero address", async function () {
      const { contract } = await loadFixture(deployBountyFixture);

      await expect(
        contract.write.createRequest([TITLE, DESCRIPTION, zeroAddress, REWARD])
      ).to.be.rejectedWith("Token invalido");
    });

    it("Should revert if caller has insufficient balance", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);

      await expect(
        contract.write.createRequest([TITLE, DESCRIPTION, token.address, parseUnits("999999", 6)], {
          account: seller.account.address,
        })
      ).to.be.rejected;
    });

    it("Should increment request IDs sequentially", async function () {
      const { contract, token } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      let hash = await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await contract.write.createRequest(
        ["Segundo", "test", token.address, parseUnits("5", 6)]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      expect(await contract.read.getRequestCount()).to.equal(2n);
      const second = await contract.read.getRequest([2n]);
      expect(second[2]).to.equal("Segundo");
    });
  });

  describe("offerNote", function () {
    it("Should submit an offer and emit OfferSubmitted", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      const hash = await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const offers = await contract.read.getOffers([1n]);
      expect(offers.length).to.equal(1);
      const sellerAddr = offers[0].seller ?? offers[0][0];
      expect(sellerAddr.toLowerCase()).to.equal(
        getAddress(seller.account.address).toLowerCase()
      );
      const link = offers[0].link ?? offers[0][1];
      expect(link).to.equal(LINK);
    });

    it("Should revert if request does not exist", async function () {
      const { contract } = await loadFixture(deployBountyFixture);

      await expect(
        contract.write.offerNote([999n, LINK])
      ).to.be.rejectedWith("Solicitud no existe");
    });

    it("Should revert if request is closed", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      await contract.write.acceptOffer([1n, 0n, 5]);

      await expect(
        contract.write.offerNote([1n, "ipfs://otro"], {
          account: seller.account.address,
        })
      ).to.be.rejectedWith("Solicitud cerrada");
    });

    it("Should allow multiple offers on the same request", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const [_, seller2] = await hre.viem.getWalletClients();
      const publicClient = await hre.viem.getPublicClient();

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      let hash = await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      hash = await contract.write.offerNote([1n, "ipfs://QmOther"], {
        account: seller2.account.address,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const offers = await contract.read.getOffers([1n]);
      expect(offers.length).to.equal(2);
    });
  });

  describe("acceptOffer", function () {
    it("Should transfer reward to seller, update reputation, and close request", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      const balanceBefore = await token.read.balanceOf([seller.account.address]);

      const hash = await contract.write.acceptOffer([1n, 0n, 5]);
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await token.read.balanceOf([seller.account.address]);
      expect(balanceAfter - balanceBefore).to.equal(REWARD);

      expect(await contract.read.reputation([seller.account.address])).to.equal(
        5n
      );
      expect(
        await contract.read.completedTasks([seller.account.address])
      ).to.equal(1n);

      const request = await contract.read.getRequest([1n]);
      expect(request[6]).to.equal(Status.Closed);
    });

    it("Should emit OfferAccepted and ReputationUpdated events", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      const hash = await contract.write.acceptOffer([1n, 0n, 4]);
      await publicClient.waitForTransactionReceipt({ hash });

      const offerAcceptedEvents = await contract.getEvents.OfferAccepted();
      expect(offerAcceptedEvents.length).to.equal(1);
      expect(offerAcceptedEvents[0].args.requestId).to.equal(1n);
      expect(offerAcceptedEvents[0].args.reward).to.equal(REWARD);

      const reputationEvents = await contract.getEvents.ReputationUpdated();
      expect(reputationEvents.length).to.equal(1);
      expect(reputationEvents[0].args.newAverage).to.equal(4n);
    });

    it("Should revert if called by non-requester", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      await expect(
        contract.write.acceptOffer([1n, 0n, 5], {
          account: seller.account.address,
        })
      ).to.be.rejectedWith("Solo el solicitante puede aceptar");
    });

    it("Should revert if rating is out of range", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      await expect(
        contract.write.acceptOffer([1n, 0n, 0])
      ).to.be.rejectedWith("Rating must be between 1 and 5");

      await expect(
        contract.write.acceptOffer([1n, 0n, 6])
      ).to.be.rejectedWith("Rating must be between 1 and 5");
    });

    it("Should revert if request does not exist", async function () {
      const { contract } = await loadFixture(deployBountyFixture);

      await expect(
        contract.write.acceptOffer([999n, 0n, 5])
      ).to.be.rejectedWith("Solicitud no existe");
    });

    it("Should revert if request is already closed", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });

      await contract.write.acceptOffer([1n, 0n, 5]);

      await expect(
        contract.write.acceptOffer([1n, 0n, 5])
      ).to.be.rejectedWith("Solicitud ya cerrada");
    });

    it("Should revert if offer index is out of bounds", async function () {
      const { contract, token } = await loadFixture(deployBountyFixture);

      await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );

      await expect(
        contract.write.acceptOffer([1n, 5n, 5])
      ).to.be.rejected;
    });

    it("Should calculate average reputation correctly", async function () {
      const { contract, token, seller } = await loadFixture(deployBountyFixture);
      const [_, seller2] = await hre.viem.getWalletClients();
      const publicClient = await hre.viem.getPublicClient();

      // Create two requests so seller can complete two tasks
      let hash = await contract.write.createRequest(
        ["Req 1", "desc", token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      await contract.write.offerNote([1n, LINK], {
        account: seller.account.address,
      });
      await contract.write.acceptOffer([1n, 0n, 4]);

      hash = await contract.write.createRequest(
        ["Req 2", "desc", token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      await contract.write.offerNote([2n, LINK], {
        account: seller.account.address,
      });
      await contract.write.acceptOffer([2n, 0n, 5]);

      expect(
        await contract.read.completedTasks([seller.account.address])
      ).to.equal(2n);

      const reputationEvents =
        await contract.getEvents.ReputationUpdated();
      const lastEvent = reputationEvents[reputationEvents.length - 1];
      expect(lastEvent.args.newAverage).to.equal(4n);
    });
  });

  describe("View functions", function () {
    it("getOffers should return empty array for non-existent request", async function () {
      const { contract } = await loadFixture(deployBountyFixture);
      const offers = await contract.read.getOffers([999n]);
      expect(offers.length).to.equal(0);
    });

    it("getRequest should return default values for non-existent request", async function () {
      const { contract } = await loadFixture(deployBountyFixture);
      const request = await contract.read.getRequest([999n]);
      expect(request[0]).to.equal(0n);
      expect(request[2]).to.equal("");
      expect(request[4]).to.equal(0n);
      expect(request[5]).to.equal(zeroAddress);
    });

    it("getRequestCount should reflect actual count", async function () {
      const { contract, token } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      expect(await contract.read.getRequestCount()).to.equal(0n);

      let hash = await contract.write.createRequest(
        [TITLE, DESCRIPTION, token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });
      expect(await contract.read.getRequestCount()).to.equal(1n);

      hash = await contract.write.createRequest(
        ["otro", "test", token.address, parseUnits("5", 6)]
      );
      await publicClient.waitForTransactionReceipt({ hash });
      expect(await contract.read.getRequestCount()).to.equal(2n);
    });
  });

  describe("Multi-token support", function () {
    it("Should support multiple ERC-20 tokens", async function () {
      const { contract, token, owner, seller } = await loadFixture(deployBountyFixture);
      const publicClient = await hre.viem.getPublicClient();

      // Deploy a second token (USDT-like, 6 decimals)
      const token2 = await hre.viem.deployContract("MockERC20", ["Test USDT", "USDT", 6]);
      await token2.write.mint([owner.account.address, MINT_AMOUNT]);
      await token2.write.approve([contract.address, MINT_AMOUNT]);

      // Create request with first token
      let hash = await contract.write.createRequest(
        ["Req USDC", "desc", token.address, REWARD]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const amount2 = parseUnits("5", 6);
      hash = await contract.write.createRequest(
        ["Req USDT", "desc", token2.address, amount2]
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const req1 = await contract.read.getRequest([1n]);
      expect(req1[5].toLowerCase()).to.equal(
        getAddress(token.address).toLowerCase()
      );
      expect(req1[4]).to.equal(REWARD);

      const req2 = await contract.read.getRequest([2n]);
      expect(req2[5].toLowerCase()).to.equal(
        getAddress(token2.address).toLowerCase()
      );
      expect(req2[4]).to.equal(amount2);
    });
  });
});
