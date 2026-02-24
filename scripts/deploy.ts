import { ethers } from "hardhat";

async function main() {
  console.log("Deploying NxtFiPayments contract...");

  const NxtFiPayments = await ethers.getContractFactory("NxtFiPayments");
  const contract = await NxtFiPayments.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("NxtFiPayments deployed to:", address);
  console.log("Owner (feeCollector):", await contract.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
