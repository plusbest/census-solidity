
// Oracle to verify tokens
pragma solidity ^0.5.0;

contract Oracle {

    // Assumed from projected U.S. households for 2020
    // to be 333,546,000. Total keys tracked to add more
    // visibility of census participation status to
    // the public during census submit timeframe.

    // In the event of maximum keys needing adjustment,
    // change will be tracked for transparency.

    address owner;

    uint public totalKeys;
    uint public maxKeys;

    struct Key {
        bool valid;
        bool claimed;
        uint id;
        bytes32 signedHash;
    }

    mapping(address => Key) keys;

    constructor() public {
        owner = msg.sender;
        totalKeys = 0;
        maxKeys = 0;
    }

    // Sets key limit
    function setKeyLimit(uint _limit) public {
        require(msg.sender == owner, "Only the contract creator can set this.");
        maxKeys = _limit;
    }

    // Address(public key) to signedhash mapping done off-chain to preserve
    // anonymity of signer. Address is derived from a web3 sign
    // function using a randomly generated address (private key),
    // which the user can use again off-chain to verify the hash output
    // use again off-chain to verify the hash output to match
    // to match the one mapped on-chain by this keyGen() function.

    function keyGen(address _address, bytes32 signedHash) public {
        // Ensures key limit established and
        // prevents creation when limit reached
        require(maxKeys > 0, "Cannot create key. No key limit set by owner.");
        require(totalKeys <= maxKeys, "Maximum keys reached.");

        Key storage newKey = keys[_address];
        newKey.signedHash = signedHash;
        newKey.valid = true;
        totalKeys++;
    }
    
    // Returns hash string of key
    function getKeyHash(address _address) public view returns(bytes32 _signedHash) {
        Key memory newKey = keys[_address];
        return newKey.signedHash;
    }

    // Return validity status of key
    function getKeyValidity(address _keyID) public view returns(bool) {
        Key memory targetKey = keys[_keyID];
        return targetKey.valid;
    }
}
