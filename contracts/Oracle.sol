
// Oracle to verify tokens
pragma solidity ^0.5.0;

contract Oracle {

    // Projected U.S. households for 2020
    // to be 333,546,000. Total keys tracked to add more
    // visibility of census participation status to
    // the public during census submit timeframe.

    address owner;

    uint public totalKeys;
    uint public maxKeys;

    struct Key {
        bool valid;
        bool claimed;
        uint id;
        bytes32 signedHash;
    }

    // Mapped address is an address derived from a private key
    // and is NOT an address directly derivable to the address
    // of the key's owner.
    mapping(address => Key) keys;

    constructor() public {
        owner = msg.sender;
        totalKeys = 0;
        maxKeys = 333546000; // Initialized for DEMO/DEBUG.
    }

    // Set (new) key limit
    function setKeyLimit(uint _limit) public {
        // Restrict usage to owner
        require(msg.sender == owner, "Only the contract creator can set this.");
        // Only allow limit increase
        require(_limit > maxKeys, "You can only increase maxKeys limit.");
        // Assign new limit
        maxKeys = _limit;
    }

    // Generates a new key
    // NOTE: Function intended to be owner-only. Left public for project
    // demonstration purposes as keys are meant to be generated and then
    // distributed to Census users.
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

    // Return key validity status
    function keyVerify(address _keyID) public view returns(bool _keyValidity) {
        Key memory targetKey = keys[_keyID];
        return targetKey.valid;
    }
    
    // Returns key's hash-string
    // NOTE: Trivial. For debug purposes only.
    function getKeyHash(address _address) public view returns(bytes32 _signedHash) {
        Key memory newKey = keys[_address];
        return newKey.signedHash;
    }
}
