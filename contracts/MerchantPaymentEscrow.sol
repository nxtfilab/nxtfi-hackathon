// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MerchantPaymentEscrow {
    mapping(address => uint256) public merchantBalances;

    event PaymentReceived(address merchant, address customer, uint256 amount);

    function registerMerchant() external {
        merchantBalances[msg.sender] = 0;
    }

    function makePayment(address merchant) external payable {
        require(msg.value > 0, "Send BNB");
        merchantBalances[merchant] += msg.value;
        emit PaymentReceived(merchant, msg.sender, msg.value);
    }

    function getBalance(address merchant) external view returns (uint256) {
        return merchantBalances[merchant];
    }
}
