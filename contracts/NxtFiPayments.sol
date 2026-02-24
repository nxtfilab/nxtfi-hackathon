// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * NxtFi – Stablecoin Merchant Settlement Protocol
 * Built for BNB Chain Hackathon (Payments Track)
 *
 * Features:
 * - Merchant onboarding
 * - Stablecoin payment routing
 * - Platform fee model
 * - Event-based settlement tracking
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract NxtFiPayments {

    struct Merchant {
        address wallet;
        bool isActive;
    }

    address public owner;
    uint256 public platformFeeBps = 100; // 1% default fee (100 basis points)
    address public feeCollector;

    mapping(address => Merchant) public merchants;

    event MerchantRegistered(address indexed merchant, address wallet);
    event MerchantStatusUpdated(address indexed merchant, bool isActive);
    event PaymentProcessed(
        address indexed payer,
        address indexed merchant,
        address token,
        uint256 grossAmount,
        uint256 feeAmount,
        uint256 netAmount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyActiveMerchant(address merchant) {
        require(merchants[merchant].isActive, "Merchant not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        feeCollector = msg.sender;
    }

    // --------------------------
    // Merchant Management
    // --------------------------

    function registerMerchant(address _wallet) external {
        require(!merchants[msg.sender].isActive, "Already registered");
        require(_wallet != address(0), "Invalid wallet");

        merchants[msg.sender] = Merchant({
            wallet: _wallet,
            isActive: true
        });

        emit MerchantRegistered(msg.sender, _wallet);
    }

    function updateMerchantStatus(address merchant, bool status) external onlyOwner {
        merchants[merchant].isActive = status;
        emit MerchantStatusUpdated(merchant, status);
    }

    // --------------------------
    // Payment Logic
    // --------------------------

    function payMerchant(
        address merchant,
        address token,
        uint256 amount
    ) external onlyActiveMerchant(merchant) {

        require(amount > 0, "Amount must be > 0");

        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        IERC20(token).transferFrom(msg.sender, merchants[merchant].wallet, netAmount);

        if (fee > 0) {
            IERC20(token).transferFrom(msg.sender, feeCollector, fee);
        }

        emit PaymentProcessed(
            msg.sender,
            merchant,
            token,
            amount,
            fee,
            netAmount
        );
    }

    // --------------------------
    // Admin Controls
    // --------------------------

    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Fee too high"); // Max 5%
        platformFeeBps = newFeeBps;
    }

    function updateFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }
}
