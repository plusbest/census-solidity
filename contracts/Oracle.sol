
// Assumes the following:

// Total 'addresses' or valid 'residencies' is stored accurately
// by institution (e.g., government)

// Key(serial) distributor does not keep record of address
// key was sent to


// NOTES:

// validateKey() is 'public view' as spamming to find a valid key
// for sha3 address is not a feasbile attack with current technology

// Keyunction made public since key (if spammed)

// Total addresses = total keys to be minted

// Map serialized key to integer of array of length 'total addresses'

// function to validate key was not used

// returns true bool and marks key as used.

// DESIGN: Consider two global variables
    // keys used
    // keys max
    // map uint from array of keys[] to serial
    // increased keyused count

// Sum.deployed().then(function(instance) { sum = instance; });


// TODO: Consider events and emit
// Go over private and public

// Oracle to verify tokens
pragma solidity ^0.5.0;

contract Oracle {

    // Assumed from projected U.S. households for 2020
    // to be 333,546,000
    uint public totalKeys;
    
    // Nonce to provide added RNG
    // Kept separate from totalKeys to
    // prevent correlation with nonce
    uint private nonce = 0;

    struct Key {
        bool valid;
        bool claimed;
        uint id;
    }

    mapping(bytes32 => Key) keys;

    constructor() public {
        totalKeys = 0;
        // Generate keys here
    }

    // Generates random number using nonce
    function random() public returns(uint) {
        nonce += 1;
        return uint(keccak256(abi.encodePacked(nonce)));
    }

    // Generates key using random number as param
    function getHash() public returns (bytes32) {
        uint randomNumber = random();
        bytes32 hash = sha256(abi.encodePacked(randomNumber));
        return hash;
    }

    // Generate key and valid its mapped struct
    function createKey() public returns(bytes32 _newkey) {
        bytes32 hash = getHash(); // get key hash
        Key storage newKey = keys[hash]; // get storage mapped Key
        newKey.valid = true; // make key(struct) valid
        totalKeys++;  // Increase total count
        newKey.id == totalKeys;  // Add key ID to struct
        return hash;
    }

    // Key validity check
    function validateKey(bytes32 _key) public view returns(bool) {
        require(keys[_key].valid == true, "Invalid key.");
        require(keys[_key].claimed == false, "Key has already been claimed.");
        keys[_key].claimed == true;
        return true;
    }
}