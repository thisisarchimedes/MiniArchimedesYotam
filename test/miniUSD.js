// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("MiniUSD contract", function () {
    const maxMiniUSDSupply = 1000000

    let MiniUSD;
    let hardhatToken;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        MiniUSD = await ethers.getContractFactory("MiniUSD");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        hardhatToken = await MiniUSD.deploy();
    });

    describe("Deployment", function () {
        // it("Should set the right owner", async function () {
        //     // This test expects the owner variable stored in the contract to be equal
        //     // to our Signer's owner.
        //     expect(await hardhatToken.owner()).to.equal(owner.address);
        // });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await hardhatToken.balanceOf(owner.address);
            expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
        });

        it("Should assign 1m tokens to the owner", async function () {
            const ownerBalance = await hardhatToken.balanceOf(owner.address);
            expect(await hardhatToken.totalSupply()).to.equal(maxMiniUSDSupply);
        });

        // Some more possible tests:
        // - transfer all the money to different account, make sure you cant withdraw anymore money
        // - 
    });

    describe("Transactions", function () {
        it("Owner should not be able to transfer any amount if supply is zero", async function () {
            await hardhatToken.transfer(addr1.address,maxMiniUSDSupply)

            await expect(
                hardhatToken.transfer(addr2.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should transfer tokens between accounts", async function () {
            // Transfer 50 tokens from owner to addr1
            await hardhatToken.transfer(addr1.address, 50);
            const addr1Balance = await hardhatToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(50);

            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await hardhatToken.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await hardhatToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
            // `require` will evaluate false and revert the transaction.
            await expect(
                hardhatToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed.
            expect(await hardhatToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });

        it("Should update balances after transfers", async function () {
            const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

            // Transfer 100 tokens from owner to addr1.
            await hardhatToken.transfer(addr1.address, 100);

            // Transfer another 50 tokens from owner to addr2.
            await hardhatToken.transfer(addr2.address, 50);

            // Check balances.
            const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

            const addr1Balance = await hardhatToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);

            const addr2Balance = await hardhatToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });
    });
});