// We import Chai to use its asserting functions here.
const { func } = require("assert-plus");
const { expect } = require("chai");
const { min } = require("lodash");
const { isConstructorDeclaration } = require("typescript");

describe("Contrroller contract", function () {

    let controller
    let hardhatController
    let vault;
    let hardhatVault;
    let ousd;
    let hardhatOusd;
    let miniUSD;
    let hardhatMiniUSD;

    let owner;
    let endUserAddr;
    let addrs;

    // in realife,x*sqr(10,18) is eaqul to one coin 
    const minTransferAmount = 1

    // helper method for tests. Deposit oUSD into controller and also checks deposit amount balance 
    async function depositFundInTest(amount, expectedDepositAmount) {
        await hardhatOusd.connect(endUserAddr).approve(hardhatVault.address, amount)
        await hardhatController.connect(endUserAddr).deposit(amount)
        expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(expectedDepositAmount)
    }

    beforeEach(async function () {
        controller = await ethers.getContractFactory("Controller");
        ousd = await ethers.getContractFactory("OUSD");
        vault = await ethers.getContractFactory("Vault");
        miniUSD = await ethers.getContractFactory("MiniUSD");


        [owner, endUserAddr, ...addrs] = await ethers.getSigners();
        const [deployer] = await ethers.getSigners();
        hardhatMiniUSD = await miniUSD.deploy()

        hardhatOusd = await ousd.deploy();
        hardhatVault = await vault.deploy(hardhatOusd.address);
        hardhatController = await controller.deploy(hardhatVault.address, hardhatMiniUSD.address)
        // , owner.address)


        // setup funds for address2, ie test customer
        await hardhatOusd.transfer(endUserAddr.address, minTransferAmount)
        await hardhatOusd.transfer(hardhatVault.address, minTransferAmount * 100)

        hardhatVault.transferOwnership(hardhatController.address);

        // Make Controller owner of miniUS and move all funds to it
        await hardhatMiniUSD.approve(owner.address, 1000000)
        await hardhatMiniUSD.transferFrom(owner.address, hardhatController.address, 1000000)
        await hardhatMiniUSD.transferOwnership(hardhatController.address);

    });

    describe("Deposit", function () {
        it("deposit funds from user to vault", async function () {
            // remove
            const endUserItialAmount = await hardhatOusd.balanceOf(endUserAddr.address)
            expect(endUserItialAmount).to.equal(minTransferAmount)
            expect(minTransferAmount).to.equal(1);
            // remove 
            // important - vault is going to excute the actual trasnfewr so we need to give VAULT approval!!
            await hardhatOusd.connect(endUserAddr).approve(hardhatVault.address, minTransferAmount + 1)

            await hardhatController.connect(endUserAddr).deposit(minTransferAmount)

            const vaultBalance = await hardhatOusd.balanceOf(hardhatVault.address);

            expect(vaultBalance).to.equal(minTransferAmount + 100)
        });

        it("deposit should fail because user doesnt have enough funds", async function () {
            await hardhatOusd.connect(endUserAddr).approve(hardhatVault.address, minTransferAmount * 100)
            await expect(hardhatController.connect(endUserAddr).deposit(minTransferAmount * 100)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
        });

        it("deposit should increase oUDS deposit amount in ledger", async function () {
            await hardhatOusd.connect(endUserAddr).approve(hardhatVault.address, minTransferAmount)
            await hardhatController.connect(endUserAddr).deposit(minTransferAmount)

            const userDepositedAmount = await hardhatController.connect(endUserAddr).getDepositedAmount()
            expect(userDepositedAmount).to.equal(minTransferAmount)
        });

        describe("withdrawwh", function () {
            it("Withdraw should transfer oUSD to users address if they have enough money deposited and it is not borrowed against", async function () {
                // deposit first
                await depositFundInTest(minTransferAmount, minTransferAmount)

                await hardhatController.connect(endUserAddr).withdraw(minTransferAmount)
                const userOusdBalance = await hardhatOusd.balanceOf(endUserAddr.address);
                expect(userOusdBalance).to.equal(minTransferAmount)
            });

            it("withdraw should transfer a partial amount of oUSD from vault to user, if user has enough free funds", async function () {
                await hardhatOusd.transfer(endUserAddr.address, 100)

                await depositFundInTest(minTransferAmount * 4, minTransferAmount * 4)
                await hardhatController.connect(endUserAddr).withdraw(minTransferAmount)
                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(3)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(0)
            })

            /// TODO: add tests about how it handles borrowed amount once we can borrow miniUSD
        });

        describe("borrow", function () {
            it("Borrow should transfer miniUSD to user if they have enough free oUSD deposited", async function () {
                await hardhatOusd.transfer(endUserAddr.address, 100)
                await depositFundInTest(100, 100)
                console.log("Controller test-borrow: hardhatController miniUSD balance", await hardhatMiniUSD.balanceOf(hardhatController.address))

                await hardhatController.connect(endUserAddr).borrow(minTransferAmount)
                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(100)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(minTransferAmount)
            })

            it("Borrow should transfer miniUSD if customer only partially borrowed against deposit", async function () {

                await hardhatOusd.transfer(endUserAddr.address, 100)
                await depositFundInTest(100, 100)
                await hardhatController.connect(endUserAddr).borrow(40)
                await hardhatController.connect(endUserAddr).borrow(30)

                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(100)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(70)
            })

            it("Borrow should fail if customer does not have oUSD deposited", async function () {
                await expect(hardhatController.connect(endUserAddr).borrow(minTransferAmount)).to.be.revertedWith("insufficient funds to borrow")
                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(0)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(0)
            })

            it("Borrow should fail if customer borrowed all miniUSD dollars it can", async function () {

                await hardhatOusd.transfer(endUserAddr.address, 100)
                await depositFundInTest(100, 100)
                await hardhatController.connect(endUserAddr).borrow(100)

                await expect(hardhatController.connect(endUserAddr).borrow(minTransferAmount)).to.be.revertedWith("insufficient funds to borrow")
                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(100)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(100)
            })

            it("Borrow should fail if customer tries to borrow more then he depoisted", async function () {

                await hardhatOusd.transfer(endUserAddr.address, 100)
                await depositFundInTest(100, 100)

                await expect(hardhatController.connect(endUserAddr).borrow(120)).to.be.revertedWith("insufficient funds to borrow")
                expect(await hardhatController.connect(endUserAddr).getDepositedAmount()).to.equal(100)
                expect(await hardhatController.connect(endUserAddr).getBorrowedAmount()).to.equal(0)
            });
        });
    });
});