// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MerchantPaymentEscrow {
    struct Payment {
        address customer;
        uint256 amount;
        uint256 timestamp;
        bool released;
        bool disputed;
    }
    
    struct Merchant {
        bool registered;
        uint256 totalBalance;
        uint256 withdrawableBalance;
    }
    
    mapping(address => Merchant) public merchants;
    mapping(bytes32 => Payment) public payments;
    mapping(address => bytes32[]) public merchantPayments;
    
    address public owner;
    uint256 public constant DISPUTE_PERIOD = 7 days;
    uint256 public constant HOLDING_PERIOD = 1 days;
    
    event MerchantRegistered(address merchant);
    event PaymentReceived(bytes32 paymentId, address merchant, address customer, uint256 amount);
    event PaymentReleased(bytes32 paymentId, address merchant);
    event PaymentDisputed(bytes32 paymentId, address customer);
    event PaymentRefunded(bytes32 paymentId, address customer, uint256 amount);
    event Withdrawn(address merchant, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyMerchant(address _merchant) {
        require(merchants[_merchant].registered, "Not registered merchant");
        _;
    }
    
    function registerMerchant() external {
        require(!merchants[msg.sender].registered, "Already registered");
        merchants[msg.sender] = Merchant({
            registered: true,
            totalBalance: 0,
            withdrawableBalance: 0
        });
        emit MerchantRegistered(msg.sender);
    }
    
    function makePayment(address merchant) external payable returns (bytes32) {
        require(msg.value > 0, "Amount must be > 0");
        require(merchants[merchant].registered, "Merchant not registered");
        
        bytes32 paymentId = keccak256(abi.encodePacked(
            merchant,
            msg.sender,
            msg.value,
            block.timestamp
        ));
        
        payments[paymentId] = Payment({
            customer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            released: false,
            disputed: false
        });
        
        merchantPayments[merchant].push(paymentId);
        merchants[merchant].totalBalance += msg.value;
        
        emit PaymentReceived(paymentId, merchant, msg.sender, msg.value);
        return paymentId;
    }
    
    function releasePayment(bytes32 paymentId) external onlyMerchant(msg.sender) {
        Payment storage payment = payments[paymentId];
        require(payment.amount > 0, "Payment not found");
        require(!payment.released, "Already released");
        require(!payment.disputed, "Payment disputed");
        require(block.timestamp >= payment.timestamp + HOLDING_PERIOD, "Holding period not passed");
        
        payment.released = true;
        merchants[msg.sender].withdrawableBalance += payment.amount;
        
        emit PaymentReleased(paymentId, msg.sender);
    }
    
    function disputePayment(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.customer == msg.sender, "Not the payer");
        require(!payment.released, "Already released");
        require(!payment.disputed, "Already disputed");
        require(block.timestamp <= payment.timestamp + DISPUTE_PERIOD, "Dispute period expired");
        
        payment.disputed = true;
        emit PaymentDisputed(paymentId, msg.sender);
    }
    
    function resolveDispute(bytes32 paymentId, bool refundCustomer) external onlyOwner {
        Payment storage payment = payments[paymentId];
        require(payment.disputed, "Not disputed");
        require(!payment.released, "Already released");
        
        if (refundCustomer) {
            payable(payment.customer).transfer(payment.amount);
            emit PaymentRefunded(paymentId, payment.customer, payment.amount);
        } else {
            // Find which merchant this belongs to
            for (uint256 i = 0; i < merchantPayments[msg.sender].length; i++) {
                if (merchantPayments[msg.sender][i] == paymentId) {
                    merchants[msg.sender].withdrawableBalance += payment.amount;
                    break;
                }
            }
            emit PaymentReleased(paymentId, msg.sender);
        }
        
        payment.released = true;
    }
    
    function withdraw(uint256 amount) external onlyMerchant(msg.sender) {
        require(amount <= merchants[msg.sender].withdrawableBalance, "Insufficient balance");
        
        merchants[msg.sender].withdrawableBalance -= amount;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    function getMerchantStats(address merchant) external view returns (
        bool registered,
        uint256 totalBalance,
        uint256 withdrawableBalance,
        uint256 pendingBalance
    ) {
        Merchant storage m = merchants[merchant];
        return (
            m.registered,
            m.totalBalance,
            m.withdrawableBalance,
            m.totalBalance - m.withdrawableBalance
        );
    }
    
    function getPaymentDetails(bytes32 paymentId) external view returns (
        address customer,
        uint256 amount,
        uint256 timestamp,
        bool released,
        bool disputed,
        bool canBeDisputed
    ) {
        Payment storage p = payments[paymentId];
        bool disputable = !p.released && 
                         !p.disputed && 
                         block.timestamp <= p.timestamp + DISPUTE_PERIOD;
        
        return (
            p.customer,
            p.amount,
            p.timestamp,
            p.released,
            p.disputed,
            disputable
        );
    }
    
    function getMerchantPaymentIds(address merchant, uint256 start, uint256 count) 
        external view returns (bytes32[] memory) 
    {
        bytes32[] storage allPayments = merchantPayments[merchant];
        uint256 end = start + count;
        if (end > allPayments.length) {
            end = allPayments.length;
        }
        
        bytes32[] memory result = new bytes32[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = allPayments[i];
        }
        return result;
    }
    
    function getMerchantPaymentCount(address merchant) external view returns (uint256) {
        return merchantPayments[merchant].length;
    }
    
    // Emergency function to recover stuck funds (owner only)
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // For testing/verification
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
