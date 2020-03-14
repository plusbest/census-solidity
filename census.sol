pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Census {
    
    // ORACLE: MASTER ADDRESS FILE
    // a token is created for every address on file
    // this token is used as a one-time verification
    // verifyToken function will verify token is valid
    // once verified, will grant address permission to
    // complete Census.
    // Number of tokens generated will coincide with total
    // verified address and token cannot be traced to address
    
    
    // Initialize contract owner
    address public owner;

    // Global counter for Person struct ID
    uint public personCount;
    // Global counter for House count
    uint public houseCount;


    // House struct
    struct House {
        uint residentsAmt;
        uint additionalAmt;
        string houseType; // House, Apartment, Mobile Home
        bool registered;
        uint residentCount; // Limit addition of people to house resident limit
    }

    // Person struct
    struct Person {
        uint id; // peopleCount
        address home; // msg.sender NECESSARY? (home can be assumed from address of transaction)
        bool isMale;
        bool isHispanic;
        uint age;
        uint birthDate; // MMDDYYYY
        string race;
    }
    

    // stores index of 'Houses' struct by address
    mapping(address => House) public houses;

    // stores a 'Person' struct as index id
    mapping(uint => Person) public people;


    // array of Persons
    Person[] public residents;
    House[] public allHouses;
    

    // Initialized at contract creation
    constructor() public {
        // Contract owner
        owner = msg.sender;
        personCount = 0;
        houseCount = 0;
    }


    function addHouse(uint _residentsamt, uint _additionalamt, string memory _housetype) public {
        
        // Ensure house is not already registered for address
        require(houses[msg.sender].registered == false, "This address has already registered a house.");

        // Create new house struct
        House memory newhouse = House(_residentsamt, _additionalamt, _housetype, true, 0);
        // uint[] memory resis = residents;
        houses[msg.sender] = newhouse;

        // Add house to global house list
        allHouses.push(newhouse);

        houseCount++;
    }


    function addPerson(bool _ismale, bool _ishispanic, uint _age, uint _birthdate, string memory _race) public {

        // Ensure house for address exists before adding
        require(houses[msg.sender].registered == true, "There is no house registered for this address.");
        
        // TODO: Require house of address to have person count within range

        Person memory newguy =  Person(personCount, msg.sender, _ismale, _ishispanic, _age, _birthdate, _race);
        people[personCount] = newguy;
        
        // Add personId to list of residents in house
        residents.push(newguy);
        
        // Increase global personId
        personCount++;
    }


    // Return total residents
    function getResidentLength() public view returns (uint residentLen) {
        return residents.length;
    }
    
    function getResident(uint _index) public view returns (Person memory ppls) {
        // require (msg.sender != 0x0000000000000000000000000000000000000000);
        return residents[_index];
    }

    function getHouse(uint _index) public view returns (House memory hizzy) {
        return allHouses[_index];
    }
    
    // Return total residents
    // function getHouseResidentLength() public view returns (uint residentLen) {
    //     return houses[msg.sender].houseResidents.length;
    // }

    // function getPerson(uint _index) view public returns (Person memory pp) {
    //     return people[_index];
    // }
}