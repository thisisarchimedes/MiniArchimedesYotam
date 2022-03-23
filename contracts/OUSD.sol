// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This is kinda like a (java) Mock of an external contract, no need to test it

contract OUSD is ERC20 {
    constructor() ERC20("oUSD", "oUSD") { // do we want to talk about what needs to be here?
        _mint(msg.sender, 1000);
        // Find a way to send money to customers 
    }
}



