import { ethers } from "hardhat";

async function main() {
  const [owner, merchant, payer] = await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("Merchant:", merchant.address);
  console.log("Payer:", payer.address);

  // Deploy NxtFiPayments
  const NxtFiFactory = await ethers.getContractFactory("NxtFiPayments");
  const nxtFi = await NxtFiFactory.deploy();
  await nxtFi.waitForDeployment();
  console.log("NxtFiPayments deployed at:", await nxtFi.getAddress());

  // Deploy MockUSDT
  const USDTFactory = await ethers.getContractFactory("MockUSDT");
  const usdt = await USDTFactory.deploy();
  await usdt.waitForDeployment();
  console.log("MockUSDT deployed at:", await usdt.getAddress());

  // Register merchant
  await nxtFi.connect(merchant).registerMerchant(merchant.address);
  console.log("Merchant registered");

  // Mint USDT to payer
  const mintAmount = ethers.utils.parseUnits("1000", 18);
  await usdt.mint(payer.address, mintAmount);
  console.log("Minted 1000 USDT to payer");

  // Approve NxtFiPayments contract
  await usdt.connect(payer).approve(nxtFi.getAddress(), mintAmount);
  console.log("Payer approved NxtFiPayments contract");

  // Pay merchant
  const tx = await nxtFi.connect(payer).payMerchant(
    merchant.address,
    usdt.getAddress(),
    mintAmount
  );
  await tx.wait();
  console.log("Payment completed");

  // Show balances
  const feeCollector = await nxtFi.feeCollector();
  const merchantBalance = await usdt.balanceOf(merchant.address);
  const feeBalance = await usdt.balanceOf(feeCollector);

  console.log(`Merchant received: ${ethers.utils.formatUnits(merchantBalance, 18)} USDT`);
  console.log(`Platform fee collected: ${ethers.utils.formatUnits(feeBalance, 18)} USDT`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
