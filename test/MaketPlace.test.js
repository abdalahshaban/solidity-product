const Web3 = require("web3");
const web3 = new Web3("HTTP://127.0.0.1:7545");

require('chai')
    .use(require('chai-as-promised'))
    .should();

const MarketPlace = artifacts.require("./MarketPlace.sol");

contract('MarketPlace', ([deployer, seller, buyer]) => {
    let marketPlace;

    before(async () => {
        marketPlace = await MarketPlace.deployed();
    });

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await marketPlace.address
            expect(address).to.not.equal(0x0);
            expect(address).to.not.equal('');
            expect(address).to.not.equal(null);
            expect(address).to.not.equal(undefined);
        });

        it('has a name ', async () => {
            const name = await marketPlace.name();
            expect(name).to.equal("Market Place");
        });
    });


    describe('products', async () => {
        let result, productCount;
        before(async () => {
            result = await marketPlace.createProduct('iphone 12', web3.utils.toWei('1', 'ether'), { from: seller });
            productCount = await marketPlace.productCount();

        });

        it('creates products ', async () => {
            expect(productCount.toNumber()).to.equal(1);
            const event = result.logs[0].args;
            expect(event.id.toNumber()).to.equal(productCount.toNumber());
            expect(event.name).to.equal('iphone 12');
            expect(web3.utils.fromWei(event.price, 'wei')).to.equal(web3.utils.toWei('1', 'ether'));
            expect(event.owner).to.equal(seller);
            expect(event.purchased).to.equal(false);

            // faliure: Product must have a name
            await marketPlace.createProduct('', web3.utils.toWei('1', 'ether'), { from: seller }).should.be.rejected;
            // faliure: Product must have a price
            await marketPlace.createProduct('iphone 12', 0, { from: seller }).should.be.rejected;
        });

        it('lists Products', async () => {
            const product = await marketPlace.products(productCount);
            expect(product.id.toNumber()).to.equal(productCount.toNumber());
            expect(product.name).to.equal('iphone 12');
            expect(web3.utils.fromWei(product.price, 'wei')).to.equal(web3.utils.toWei('1', 'ether'));
            expect(product.owner).to.equal(seller);
            expect(product.purchased).to.equal(false);
        });

        it('sells Products', async () => {
            // track the seller balance before purchase
            let oldSellerBalance;
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = await web3.utils.toBN(oldSellerBalance);

            // Success buyer makes purchase
            result = await marketPlace.purchaseProduct(productCount, {
                from: buyer,
                value: web3.utils.toWei('1', 'ether')
            });
            // check logs
            const event = result.logs[0].args;
            expect(event.id.toNumber()).to.equal(productCount.toNumber());
            expect(event.name).to.equal('iphone 12');
            expect(web3.utils.fromWei(event.price, 'wei')).to.equal(web3.utils.toWei('1', 'ether'));
            expect(event.owner).to.equal(buyer);
            expect(event.purchased).to.equal(true);


            //check that seller received funds
            let newSellerBalance;
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = await web3.utils.toBN(newSellerBalance);

            let price;
            price = web3.utils.toWei('1', 'ether');
            price = new web3.utils.toBN(price);

            let expectedBalance = oldSellerBalance.add(price);
            expect(newSellerBalance.toString()).to.equal(expectedBalance.toString());

            // Faliure : tries to buy a product that does not exist , product must have valid id
            await marketPlace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            // faliure : buyer tries to buy without enough ether
            await marketPlace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;
            // faliure : Deployer tries to buy the product , product can not b purchased twice
            await marketPlace.purchaseProduct(99, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            // faliure : buyer tries to buy again , buyer can not be the seller
            await marketPlace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;

        });

    });
})

