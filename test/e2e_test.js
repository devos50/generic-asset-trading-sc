const truffleAssert = require('truffle-assertions');
const AssetTrading = artifacts.require("AssetTrading");

contract("AssetTrading e2e tests", async accounts => {
	let contract;

    beforeEach(async () => {
        contract = await AssetTrading.new();
	});
});