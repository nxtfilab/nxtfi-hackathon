import { ethers } from "hardhat";

async function main() {
  const Escrow = await ethers.getContractFactory("MerchantPaymentEscrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();

  console.log("MerchantPaymentEscrow deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
