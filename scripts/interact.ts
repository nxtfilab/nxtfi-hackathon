import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "PASTE_DEPLOYED_CONTRACT_ADDRESS";

async function main() {
  const [user] = await ethers.getSigners();

  const escrow = await ethers.getContractAt(
    "MerchantPaymentEscrow",
    CONTRACT_ADDRESS
  );

  // Register merchant
  const tx1 = await escrow.registerMerchant();
  await tx1.wait();
  console.log("Merchant registered tx:", tx1.hash);

  // Make payment (0.01 BNB)
  const tx2 = await escrow.makePayment(user.address, {
    value: ethers.parseEther("0.01")
  });
  await tx2.wait();
  console.log("Payment made tx:", tx2.hash);

  const balance = await escrow.getBalance(user.address);
  console.log("Merchant balance:", ethers.formatEther(balance), "BNB");
}

main().catch(console.error);
