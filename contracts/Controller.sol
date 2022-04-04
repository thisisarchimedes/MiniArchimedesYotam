// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Vault} from "contracts/Vault.sol";
import "hardhat/console.sol";

contract Controller {
    address private vaultContractAddress;
    address private miniUSDContractAddress;

    struct Ledger {
        uint256 oUSDDeposited;
        uint256 miniUSDBorrowed;
    }
    mapping(address => Ledger) private balances;

    constructor(
        address vaultContract,
        address miniUSDContract
    ) {
        vaultContractAddress = vaultContract;
        miniUSDContractAddress = miniUSDContract;
    }

    function deposit(uint256 amount) external {
        console.log("in controller - msg.sender", msg.sender);
        console.log("in controller - address of this", address(this));
        Vault(vaultContractAddress).depositFunds(msg.sender, amount);
        increaseBalance(amount, 0);
    }

    function withdraw(uint256 amount) external {
        if (getRemainingBorrowAllowance() < amount) {
            revert("insufficient funds to withdraw");
        }
        Vault(vaultContractAddress).witdrawFunds(msg.sender, amount);
        decreaseBalance(amount, 0);
    }

    function borrow(uint256 amount) external {
        if (getRemainingBorrowAllowance() < amount) {
            revert("insufficient funds to borrow");
        }
        console.log(
            "in borrow: balance of owner is ",
            IERC20(miniUSDContractAddress).balanceOf(address(this))
        );
        IERC20(miniUSDContractAddress).approve(address(this), amount);
        IERC20(miniUSDContractAddress).transferFrom(
            address(this),
            msg.sender,
            amount
        );
        increaseBalance(0,amount);
    }

    // helpers -- need to reduce file size so would be better to take this out of file

    function getDepositedAmount() public view returns (uint256) {
        return balances[msg.sender].oUSDDeposited;
    }

    function getBorrowedAmount() public view returns (uint256) {
        return balances[msg.sender].miniUSDBorrowed;
    }

    function increaseBalance(uint256 depositDelta, uint256 borrowDelta)
        private
    {
        if (
            balances[msg.sender].oUSDDeposited + depositDelta <
            balances[msg.sender].oUSDDeposited
        ) {
            revert("overflow error - cant deposit more");
        }
        if (
            balances[msg.sender].miniUSDBorrowed + borrowDelta <
            balances[msg.sender].miniUSDBorrowed
        ) {
            revert("overflow error - cant borrow more");
        }
        balances[msg.sender].oUSDDeposited += depositDelta;
        balances[msg.sender].miniUSDBorrowed += borrowDelta;
    }

    function decreaseBalance(uint256 depositDelta, uint256 borrowDelta)
        private
    {
        // we guard for minus values outside but maybe best to guard here as well
        balances[msg.sender].oUSDDeposited -= depositDelta;
        balances[msg.sender].miniUSDBorrowed -= borrowDelta;
    }

    function getRemainingBorrowAllowance() private view returns (uint256) {
        return getDepositedAmount() - getBorrowedAmount();
    }
}
