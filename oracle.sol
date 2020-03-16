
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

    uint public totalKeys;
    
    // Nonce to provide added RNG
    uint private nonce = 0;

    struct Key {
    	bool valid;
    	uint id;
    }

    mapping(address => Key) keys;

    // Generates random number using nonce
    function random() public returns(uint) {
        nonce += 1;
        return uint(keccak256(abi.encodePacked(nonce)));
    }

    // Generates address using random number as param
    function getSha256(uint _randomNumber) public pure returns (bytes32) {
        bytes32 hash = sha256(abi.encodePacked(_randomNumber));

    return hash;
    }
}