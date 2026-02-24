import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("NxtFiPayments Integration Test", function () {
  let owner: any;
  let merchant: any;
  let payer: any;
  let NxtFiPayments: Contract;
  let MockUSDT: Contract;
  let usdtAmount = ethers.utils.parseUnits("1000", 18);

  before(async () => {
    [owner, merchant, payer] = await ethers.getSigners();

    // Deploy NxtFiPayments
    const NxtFiFactory = await ethers.getContractFactory("NxtFiPayments");
    NxtFiPayments = await NxtFiFactory.deploy();
    await NxtFiPayments.waitForDeployment();

    // Deploy MockUSDT
    const USDTFactory = await ethers.getContractFactory("MockUSDT");
    MockUSDT = await USDTFactory.deploy();
    await MockUSDT.waitForDeployment();

    // Mint USDT to payer
    await MockUSDT.mint(payer.address, usdtAmount);
  });

  it("Should register merchant successfully", async () => {
    await NxtFiPayments.connect(merchant).registerMerchant(merchant.address);
    const info = await NxtFiPayments.merchants(merchant.address);
    expect(info.isActive).to.be.true;
  });

  it("Should approve and make payment", async () => {
    // Payer approves contract
    await MockUSDT.connect(payer).approve(NxtFiPayments.address, usdtAmount);

    // Make payment
    const feeBps = await NxtFiPayments.platformFeeBps();
    const feeAmount = usdtAmount.mul(feeBps).div(10000);
    const netAmount = usdtAmount.sub(feeAmount);

    await expect(
      NxtFiPayments.connect(payer).payMerchant(
        merchant.address,
        MockUSDT.address,
        usdtAmount
      )
    ).to.emit(NxtFiPayments, "PaymentProcessed")
      .withArgs(
        payer.address,
        merchant.address,
        MockUSDT.address,
        usdtAmount,
        feeAmount,
        netAmount
      );

    // Check balances
    const merchantBalance = await MockUSDT.balanceOf(merchant.address);
    const ownerBalance = await MockUSDT.balanceOf(await NxtFiPayments.feeCollector());
    expect(merchantBalance).to.equal(netAmount);
    expect(ownerBalance).to.equal(feeAmount);
  });
});
