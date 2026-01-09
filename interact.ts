import { ethers } from "hardhat";

// Update this with the deployed contract address
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

async function main() {
  if (!CONTRACT_ADDRESS) {
    console.error("Please set CONTRACT_ADDRESS in your environment or .env file");
    process.exit(1);
  }

  const [user] = await ethers.getSigners();
  console.log("Interacting with contract using account:", user.address);

  const escrow = await ethers.getContractAt(
    "MerchantPaymentEscrow",
    CONTRACT_ADDRESS
  );

  // Check if already registered
  const statsBefore = await escrow.getMerchantStats(user.address);
  if (!statsBefore.registered) {
    console.log("Registering merchant...");
    const tx1 = await escrow.registerMerchant();
    await tx1.wait();
    console.log("Merchant registered tx:", tx1.hash);
  } else {
    console.log("Merchant already registered");
  }

  // Make payment (0.001 BNB for testing)
  console.log("Making payment...");
  const tx2 = await escrow.makePayment(user.address, {
    value: ethers.parseEther("0.001")
  });
  const receipt = await tx2.wait();
  console.log("Payment made tx:", tx2.hash);

  // @ts-ignore
  const paymentId = receipt.logs[0].args[0];
  console.log("Payment ID:", paymentId);

  const statsAfter = await escrow.getMerchantStats(user.address);
  console.log("Merchant Total Balance:", ethers.formatEther(statsAfter.totalBalance), "BNB");
  console.log("Merchant Withdrawable Balance:", ethers.formatEther(statsAfter.withdrawableBalance), "BNB");
}

main().catch(console.error);
