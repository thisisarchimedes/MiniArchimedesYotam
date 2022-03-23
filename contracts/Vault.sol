// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

// Make Box inherit from the Ownable contract
contract Vault is Ownable {
    address private oUSDContractAdress;

    constructor(address oUSDContract) public {
        oUSDContractAdress = oUSDContract;
    }

    function depositFunds(address from, uint256 amount) public onlyOwner {
        console.log("balance of user is: ", IERC20(oUSDContractAdress).balanceOf(from));
        IERC20(oUSDContractAdress).transferFrom(from, address(this), amount);
    }

    function witdrawFunds(address to, uint256 amount) public onlyOwner {
        console.log("witdrawFunds: balance of vault's address is: ",IERC20(oUSDContractAdress).balanceOf(address(this)));

        if (IERC20(oUSDContractAdress).balanceOf(address(this)) < amount) {
            revert("Not enough funds in vault");
        }
        // approve inside contract as "user" cant approve it. Discuss if needed
        IERC20(oUSDContractAdress).approve(address(this), amount);
        IERC20(oUSDContractAdress).transferFrom(address(this), to, amount);
    }

    //Note: we can get rid of this call and save a static copy of total supply which is updated
    // when OUSD is deposited or withdrawn. But can be more open to bugs.
    function getTotalySupply() public onlyOwner returns (uint256) {
        // this one doesnt work, need to figure out why
        return IERC20(oUSDContractAdress).balanceOf(address(this));
    }
}
