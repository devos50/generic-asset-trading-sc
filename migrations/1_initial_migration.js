const Migrations = artifacts.require("Migrations");
const AssetTrading = artifacts.require("AssetTrading");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(AssetTrading);
};
