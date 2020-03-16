
// Assumes total 'addresses' or valid 'residencies' 
// is stored accurately by institution (e.g., government)

// Total addresses = total keys to be minted

// Map serialized key to integer of array of length 'total addresses'

// function to validate key was not used

// returns true bool and marks key as used.

// DESIGN: Consider two global variables
	// keys used
	// keys max
	// map uint from array of keys[] to serial
	// increased keyused count



// Oracle to verify tokens
pragma solidity ^0.5.0;

contract Random {

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
    function createKey() private {

    	bytes32 hash = getHash(); // get key hash
    	keys[hash].valid == true; // Initialize key struct
    	totalKeys++;  // Increase total count
    	keys[hash].id == totalKeys;  // Add key ID to struct

    }

    function validateKey(bytes32 _key) private view returns(bool) {
    	require(keys[_key].valid == true, "Invalid key.");
    	require(keys[_key].claimed == false, "Key has already been claimed.");

   		keys[_key].claimed == true;

   		return true;
   		// TODO: Should this be an EMIT event?
    }
}