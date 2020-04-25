//const truffleAssert = require('truffle-assertions');
const AssetTrading = artifacts.require("AssetTrading");

contract("AssetTrading unit tests", async accounts => {
	let contract;

    beforeEach(async () => {
        contract = await AssetTrading.new();
    });

	it("Test creating a new order", async () => {
	});
});