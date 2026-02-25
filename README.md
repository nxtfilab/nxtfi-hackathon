# NxtFi – Stablecoin Merchant Settlement Protocol (BNB Hackathon Submission)

**BNB Chain Hackathon 2026 – Payments Track**

---

## Overview

NxtFi is a merchant-focused stablecoin payment settlement protocol built on BNB Chain.  
It enables:  
- On-chain merchant payment acceptance  
- Stablecoin settlement (USDT / USDC style tokens)  
- Transparent transaction logging  
- Future-ready fiat settlement integration layer  

This submission is built for the BNB Chain – Payments Track under the challenge:  
*"Building the Future of Web3 on BNB Chain."*

---

## Problem

Stablecoins are growing rapidly, but merchant tools for on-chain settlement are fragmented and not optimized for real-world adoption.  
Merchants need:  
- Simple smart contract payment routing  
- Transparent on-chain logs  
- Automated settlement logic  
- Easy integration with off-chain APIs

---

## Solution

NxtFi provides:  
- Merchant registration contract  
- On-chain stablecoin payment acceptance  
- Event-based settlement tracking  
- Open infrastructure layer for PSP integrations  

Built on:  
- Solidity  
- Hardhat  
- opBNB / BSC Testnet  

---

## Architecture

Payer —> NxtFiPayments —> Merchant

—> FeeCollector

- `NxtFiPayments` handles merchant registration, payments, and fee logic.  
- `MockUSDT` token simulates stablecoin payments for testing and demo.

---

## Live Deployment

Network: BNB Chain Testnet (or opBNB Testnet)  
Contract Address: (Paste after deploy)  

**Important:** Ensure at least 2 successful transactions completed within the hackathon timeframe for submission compliance.

---

## Tech Stack

- Solidity  
- Hardhat  
- TypeScript  
- BNB Chain (Testnet / opBNB)

---

## Smart Contract Features

- Merchant onboarding  
- Stablecoin payment routing  
- Payment confirmation events  
- Withdraw settlement function  

---

## Demo Instructions

1. Copy `.env.example` to `.env` and fill RPC keys and private key.
2. Run demo script:

```bash
npx hardhat run scripts/demoPayment.ts --network bscTestnet

This script will:
	•	Deploy NxtFiPayments
	•	Deploy MockUSDT
	•	Register a merchant
	•	Mint USDT to a payer
	•	Approve NxtFiPayments contract
	•	Execute a payment and collect platform fee

You can switch to opBNB testnet by changing the network in the command.

⸻

Test Instructions

Run the integration test:

npx hardhat test test/NxtFiIntegration.ts

This validates:
	•	Contract deployment
	•	Merchant registration
	•	Stablecoin payment
	•	Fee calculation
	•	Event emission

⸻

Quick Start

git clone https://github.com/nxtfilab/nxtfi-hackathon.git
cd nxtfi-hackathon
npm install
cp .env.example .env
# Fill RPC and private key in .env
npx hardhat compile


⸻

Why NxtFi
	•	Merchant-first stablecoin payment protocol
	•	Transparent, auditable on-chain settlement
	•	Low-cost and scalable on BNB Chain
	•	Ready for fiat off-ramp integration
	•	Open-source and extensible

⸻

Future Roadmap
	1.	Multi-merchant batch payments
	2.	Integration with fiat off-ramps
	3.	Enhanced UX for wallet-based payments
	4.	Cross-chain expansion (BNB → Ethereum / Polygon)

⸻

Submission Artifacts
	•	GitHub repo (this repo)
	•	Demo video showing demoPayment.ts workflow
	•	Integration test (NxtFiIntegration.ts) running successfully
	•	Pitch deck highlighting problem, solution, BNB alignment, and roadmap
	•	Submission tweet tagging @BNBChain with hashtag #BNBHack

⸻

License

MIT License © 2026 NxtFi Team

---
