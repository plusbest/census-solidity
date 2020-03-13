pragma solidity ^0.5.0;

contract Census {

    // Initialize contract owner
    address public owner;
    // Global counter for Person struct ID
    uint public personCount;
    // Global counter for House count
    uint public houseCount;


    // Person struct
    struct Person {
        uint id;
        uint age;
    }
    
    // House struct
    struct House {
        uint houseNum;
        string houseType;
        uint[] houseResidents;
        // division
    }

    // stores a 'Person' struct as index id
    mapping(uint => Person) public people;
    
    // stores index of 'Houses' struct by address
    mapping(address => House) public houses;

    // array of Persons
    uint[] public residents;
    
    // Initialized at contract creation
    constructor() public {
        // Contract owner
        owner = msg.sender;
        personCount = 0;
        houseCount = 0;
    }

    function updateHouse(uint newnum, string memory newname) public {
        uint[] memory resis = residents;
        houses[msg.sender] = House(newnum, newname, resis);
        houseCount++;
    }

    function addPerson(uint _age) public {
        people[personCount] = Person(personCount, _age);
        
        // Add personId to list of residents in house
        residents.push(personCount);
        
        // Increase global personId
        personCount++;
    }

    // Return total residents
    function getResidentLength() public view returns (uint residentLen)
    {
        return residents.length;
    }
    
    // Return total residents
    function getHouseResidentLength() public view returns (uint residentLen)
    {
        return houses[msg.sender].houseResidents.length;
    }
}