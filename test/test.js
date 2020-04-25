const truffleAssert = require('truffle-assertions');
const AssetTrading = artifacts.require("AssetTrading");

contract("AssetTrading unit tests", async accounts => {
	let contract;

    beforeEach(async () => {
        contract = await AssetTrading.new();
    });

	it("Test creating a new order", async () => {
		await contract.makeOrder(1, "BTC", 1, "XRP");
	});

	it("Test creating a new order with an invalid buy asset type", async () => {
		await truffleAssert.reverts(contract.makeOrder(1, "BTC", 1, "NONEXISTENT"));
	});

	it("Test creating a new order with an invalid sell asset type", async () => {
		await truffleAssert.reverts(contract.makeOrder(1, "NONEXISTENT", 1, "BTC"));
	});
});