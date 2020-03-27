
// Oracle to verify tokens
pragma solidity ^0.5.0;

contract Oracle {

    // Assumed from projected U.S. households for 2020
    // to be 333,546,000
    uint public totalKeys;

    struct Key {
        bool valid;
        bool claimed;
        uint id;
        bytes32 signedHash;
    }

    mapping(address => Key) keys;

    constructor() public {
        totalKeys = 0;
        // Generate keys here
    }

    // Key validity check
    function validateKey(address _key) public view returns(bool) {
        require(keys[_key].valid == true, "Invalid key.");
        require(keys[_key].claimed == false, "Key has already been claimed.");
        keys[_key].claimed == true;
        return true;
    }
    
    function keyGen(address _address, bytes32 signedHash) public {
        Key storage newKey = keys[_address];
        newKey.signedHash = signedHash;
        newKey.valid = true;
    }
    
    function getKeyHash(address _address) public view returns(bytes32 _signedHash) {
        Key memory newKey = keys[_address];
        return newKey.signedHash;
    }
    function getKeyValidity(address _keyID) public view returns(bool) {
        Key memory targetKey = keys[_keyID];
        return targetKey.valid;
    }
}
