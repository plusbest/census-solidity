var Census = artifacts.require("./Census.sol");
// var Oracle = artifacts.require("./Oracle.sol");

module.exports = function(deployer) {
  deployer.deploy(Census);
  // deployer.deploy(Oracle);
};
