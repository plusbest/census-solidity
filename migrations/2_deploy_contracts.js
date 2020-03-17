var Election = artifacts.require("./Census.sol");

module.exports = function(deployer) {
  deployer.deploy(Election);
};
