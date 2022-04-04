// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MiniUSD is ERC20, Ownable {
    constructor() ERC20("MiniUSDToken", "MiniUSD") {
        console.log(
            "InMinidUSD contrant const: address of sender ",
            msg.sender
        );
        _mint(msg.sender, 1000000);
    }
}
