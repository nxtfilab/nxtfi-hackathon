// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * Mock USDT Token for testing NxtFiPayments
 * Used only for local testing and BSC testnet demo
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {

    constructor() ERC20("Mock USDT", "mUSDT") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
