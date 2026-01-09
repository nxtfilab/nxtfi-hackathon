import { expect } from "chai";
import { ethers } from "hardhat";
import { MerchantPaymentEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("MerchantPaymentEscrow", function () {
  let escrow: MerchantPaymentEscrow;
  let owner: SignerWithAddress;
  let merchant: SignerWithAddress;
  let customer: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  const HOLDING_PERIOD = 1 * 24 * 60 * 60; // 1 day
  const DISPUTE_PERIOD = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, merchant, customer, otherAccount] = await ethers.getSigners();
    const EscrowFactory = await ethers.getContractFactory("MerchantPaymentEscrow");
    escrow = await EscrowFactory.deploy();
  });

  describe("Merchant Registration", function () {
    it("Should register a merchant", async function () {
      await expect(escrow.connect(merchant).registerMerchant())
        .to.emit(escrow, "MerchantRegistered")
        .withArgs(merchant.address);

      const stats = await escrow.getMerchantStats(merchant.address);
      expect(stats.registered).to.be.true;
    });

    it("Should not allow double registration", async function () {
      await escrow.connect(merchant).registerMerchant();
      await expect(escrow.connect(merchant).registerMerchant()).to.be.revertedWith("Already registered");
    });
  });

  describe("Payments", function () {
    beforeEach(async function () {
      await escrow.connect(merchant).registerMerchant();
    });

    it("Should accept payments", async function () {
      const amount = ethers.parseEther("1.0");
      const tx = await escrow.connect(customer).makePayment(merchant.address, { value: amount });
      
      await expect(tx).to.emit(escrow, "PaymentReceived");
      
      const stats = await escrow.getMerchantStats(merchant.address);
      expect(stats.totalBalance).to.equal(amount);
    });

    it("Should not accept zero payments", async function () {
      await expect(escrow.connect(customer).makePayment(merchant.address, { value: 0 }))
        .to.be.revertedWith("Amount must be > 0");
    });

    it("Should not allow payments to unregistered merchants", async function () {
      await expect(escrow.connect(customer).makePayment(otherAccount.address, { value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Merchant not registered");
    });
  });

  describe("Releasing Payments", function () {
    let paymentId: string;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.connect(merchant).registerMerchant();
      const tx = await escrow.connect(customer).makePayment(merchant.address, { value: amount });
      const receipt = await tx.wait();
      // @ts-ignore
      paymentId = receipt.logs[0].args[0];
    });

    it("Should release payment after holding period", async function () {
      await time.increase(HOLDING_PERIOD + 1);
      
      await expect(escrow.connect(merchant).releasePayment(paymentId))
        .to.emit(escrow, "PaymentReleased")
        .withArgs(paymentId, merchant.address);

      const stats = await escrow.getMerchantStats(merchant.address);
      expect(stats.withdrawableBalance).to.equal(amount);
    });

    it("Should not release before holding period", async function () {
      await expect(escrow.connect(merchant).releasePayment(paymentId))
        .to.be.revertedWith("Holding period not passed");
    });
  });

  describe("Disputes", function () {
    let paymentId: string;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.connect(merchant).registerMerchant();
      const tx = await escrow.connect(customer).makePayment(merchant.address, { value: amount });
      const receipt = await tx.wait();
      // @ts-ignore
      paymentId = receipt.logs[0].args[0];
    });

    it("Should allow customer to dispute", async function () {
      await expect(escrow.connect(customer).disputePayment(paymentId))
        .to.emit(escrow, "PaymentDisputed")
        .withArgs(paymentId, customer.address);
    });

    it("Should not allow dispute after period", async function () {
      await time.increase(DISPUTE_PERIOD + 1);
      await expect(escrow.connect(customer).disputePayment(paymentId))
        .to.be.revertedWith("Dispute period expired");
    });

    it("Should allow owner to resolve dispute (refund)", async function () {
      await escrow.connect(customer).disputePayment(paymentId);
      
      const initialBalance = await ethers.provider.getBalance(customer.address);
      await escrow.connect(owner).resolveDispute(paymentId, true, merchant.address);
      const finalBalance = await ethers.provider.getBalance(customer.address);
      
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should allow owner to resolve dispute (release to merchant)", async function () {
      await escrow.connect(customer).disputePayment(paymentId);
      
      await escrow.connect(owner).resolveDispute(paymentId, false, merchant.address);
      const stats = await escrow.getMerchantStats(merchant.address);
      expect(stats.withdrawableBalance).to.equal(amount);
    });
  });

  describe("Withdrawals", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow.connect(merchant).registerMerchant();
      const tx = await escrow.connect(customer).makePayment(merchant.address, { value: amount });
      const receipt = await tx.wait();
      // @ts-ignore
      const paymentId = receipt.logs[0].args[0];
      await time.increase(HOLDING_PERIOD + 1);
      await escrow.connect(merchant).releasePayment(paymentId);
    });

    it("Should allow merchant to withdraw", async function () {
      const initialBalance = await ethers.provider.getBalance(merchant.address);
      const tx = await escrow.connect(merchant).withdraw(amount);
      const receipt = await tx.wait();
      // @ts-ignore
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(merchant.address);
      expect(finalBalance + gasUsed - initialBalance).to.equal(amount);
    });
  });
});
