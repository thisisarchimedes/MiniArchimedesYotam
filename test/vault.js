// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("Vault contract", function () {

    let vault;
    let hardhatVault;

    let ousd;
    let hardhatOusd;
    let owner;
    let endUserAddr;
    let addrs;

    // in realife,x*sqr(10,18) is eaqul to one coin 
    const minTransferAmount = 1

    beforeEach(async function () {
        vault = await ethers.getContractFactory("Vault");
        ousd = await ethers.getContractFactory("OUSD");
        [owner, endUserAddr, ...addrs] = await ethers.getSigners();

        hardhatOusd = await ousd.deploy();
        hardhatVault = await vault.deploy(hardhatOusd.address);

        // setup funds for address2, ie test customer
        await hardhatOusd.transfer(endUserAddr.address, minTransferAmount)
    });

    describe("Deposit", function () {
        it("depositFunds from user should transfer funds to vault's address", async function () {
            // remove
            const endUserItialAmount = await hardhatOusd.balanceOf(endUserAddr.address)
            expect(endUserItialAmount).to.equal(minTransferAmount)
            // remove 

            await hardhatOusd.connect(endUserAddr).approve(hardhatVault.address, minTransferAmount)
            await hardhatVault.depositFunds(endUserAddr.address, minTransferAmount)
            const archimedesOusdBalance = await hardhatOusd.balanceOf(hardhatVault.address);

            expect(archimedesOusdBalance).to.equal(minTransferAmount)
        });

        it("withdrawFunds should move OUSD back to reciever if total supply is enough", async function () {

            await hardhatOusd.transfer(hardhatVault.address, minTransferAmount)
            const vaultSupplyBeforeWithdraw = await hardhatOusd.balanceOf(hardhatVault.address);
            // important to test to make sure test actually does sometrhing!
            expect(vaultSupplyBeforeWithdraw).to.equal(minTransferAmount)

            await hardhatVault.witdrawFunds(endUserAddr.address, minTransferAmount)
            const archimedesOusdBalance = await hardhatOusd.balanceOf(hardhatVault.address);
            const userOusdBalance = await hardhatOusd.balanceOf(endUserAddr.address);

            expect(archimedesOusdBalance).to.equal(0)
            expect(userOusdBalance).to.equal(minTransferAmount * 2)
        });

        it("withdrawFunds should revert if total supply is not enough", async function () {

            const vaultSupplyBeforeWithdraw = await hardhatOusd.balanceOf(hardhatVault.address);
            // important to test to make sure test actually does sometrhing!
            expect(vaultSupplyBeforeWithdraw).to.equal(0)

            await  expect(hardhatVault.witdrawFunds(endUserAddr.address, minTransferAmount)).to.be.revertedWith("Not enough funds in vault")
        });
    });
});