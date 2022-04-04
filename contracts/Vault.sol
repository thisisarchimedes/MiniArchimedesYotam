// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Vault is Ownable {
    address private oUSDContractAdress;

    constructor(address oUSDContract) {
        oUSDContractAdress = oUSDContract;
    }

    function depositFunds(address from, uint256 amount) external onlyOwner {
        console.log(
            "balance of user is: ",
            IERC20(oUSDContractAdress).balanceOf(from)
        );
        console.log("In Vault - address of sender is: ", msg.sender);
        IERC20(oUSDContractAdress).transferFrom(from, address(this), amount);
    }

    function witdrawFunds(address to, uint256 amount) external onlyOwner {
        console.log(
            "witdrawFunds: balance of vault's address is: ",
            IERC20(oUSDContractAdress).balanceOf(address(this))
        );

        if (IERC20(oUSDContractAdress).balanceOf(address(this)) < amount) {
            revert("Not enough funds in vault");
        }
        // approve inside contract as "user" cant approve it. Discuss if needed
        IERC20(oUSDContractAdress).approve(address(this), amount);
        IERC20(oUSDContractAdress).transferFrom(address(this), to, amount);
    }
}
