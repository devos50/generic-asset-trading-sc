const truffleAssert = require('truffle-assertions');
const AssetTrading = artifacts.require("AssetTrading");

advanceTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      const newBlockHash = web3.eth.getBlock('latest').hash

      return resolve(newBlockHash)
    })
  })
}

advanceTimeAndBlock = async (time) => {
  await advanceTime(time)
  await advanceBlock()
  return Promise.resolve(web3.eth.getBlock('latest'))
}

contract("AssetTrading unit tests", async accounts => {
	let contract;

    beforeEach(async () => {
        contract = await AssetTrading.new();

        // set watchers
        await contract.registerAsWatcher.sendTransaction([1, 2], {"from": accounts[2]})
        await contract.registerAsWatcher.sendTransaction([1], {"from": accounts[3]})
        await contract.registerAsWatcher.sendTransaction([2], {"from": accounts[4]})
    });

	it("Test creating a new order", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"value": 10000});
	});

	it("Test creating a new order with an invalid buy asset type", async () => {
		await truffleAssert.reverts(contract.makeOrder(1, "BTC", 1, "NONEXISTENT", 1));
	});

	it("Test creating a new order with an invalid sell asset type", async () => {
		await truffleAssert.reverts(contract.makeOrder(1, "NONEXISTENT", 1, "BTC", 1));
	});

	it("Test starting a trade by taking an order", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000});
	});

	it("Test advancing a trade by the taker", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await contract.proveTransfer.sendTransaction(1, {"from": accounts[2]});
	});

	it("Test completing a trade by the maker", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await contract.proveTransfer.sendTransaction(1, {"from": accounts[2]});
		await contract.proveTransfer.sendTransaction(1, {"from": accounts[1]});
	});

	it("Test claiming taker collateral before the timeout has expired", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await advanceTimeAndBlock(120);
		await truffleAssert.reverts(contract.claimTakerCollateral.sendTransaction(1, {"from": accounts[1]}));
	});

	it("Test claiming taker collateral", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await advanceTimeAndBlock(7200);
		await contract.claimTakerCollateral.sendTransaction(1, {"from": accounts[1]});
	});

	it("Test claiming maker collateral before the timeout has expired", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await contract.proveTransfer.sendTransaction(1, {"from": accounts[2]});
		await advanceTimeAndBlock(120);
		await truffleAssert.reverts(contract.claimMakerCollateral.sendTransaction(1, {"from": accounts[2]}));
	});

	it("Test claiming maker collateral", async () => {
		await contract.makeOrder.sendTransaction(1, "BTC", 1, "XRP", 1, {"from": accounts[1], "value": 10000});
		await contract.takeOrder.sendTransaction(1, 1, {"value": 10000, "from": accounts[2]});
		await contract.proveTransfer.sendTransaction(1, {"from": accounts[2]});
		await advanceTimeAndBlock(7200);
		await contract.claimMakerCollateral.sendTransaction(1, {"from": accounts[2]});
	});
});