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
        bool registered;
        uint maxResidents;
        uint extraResidents;
        string houseType; // House, Apartment, Mobile Home
        uint[] residentList;
    }

    // Person struct
    struct Person {
        bool registered;
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

    event houseAddedEvent (
    uint indexed _maxResidents,
    uint indexed _extraResidents
    );

    // Initialized at contract creation
    constructor() public {
        // Contract owner
        owner = msg.sender;
        personCount = 0;
        houseCount = 0;
    }

    // function verifyTokenOracle(bytes32 _key) private returns (bool) {
        
    // }

    function addHouse(uint _maxResidents, uint _extraResidents, string memory _housetype) public {
        
        // Ensure house is not already registered for address
        require(houses[msg.sender].registered == false, "This address has already registered a house.");

        // Initialize empty residentList array
        uint[] memory emptyList = new uint[](0);
        
        // Create new house struct
        House memory newhouse = House(true, _maxResidents, _extraResidents, _housetype, emptyList);

        houses[msg.sender] = newhouse;

        // Increase global house count
        houseCount++;

        emit houseAddedEvent(_maxResidents, _extraResidents);
    }


    function addPerson(bool _ismale, bool _ishispanic, uint _age, uint _birthdate, string memory _race) public {

        House storage currentHouse = houses[msg.sender];

        // Ensure house for address exists before adding
        require(currentHouse.registered == true, "There is no house registered for this address.");
        
        // Require house of address to have resident count within range
        require(currentHouse.residentList.length < currentHouse.maxResidents, "Max registered people for this House.");

        Person memory newPerson =  Person(true, personCount, msg.sender, _ismale, _ishispanic, _age, _birthdate, _race);
        people[personCount] = newPerson;

        // Add person ID to house residentList
        houses[msg.sender].residentList.push(personCount);
        
        // Increase global person count (iD)
        personCount++;
    }
    
    function getResident(uint _index) public view returns (Person memory ppls) {
        return people[_index];
    }

    function getHouse() public view returns (bool a, uint b, uint c, string memory d, uint[] memory e) {
        
        House storage thisHouse = houses[msg.sender];

        bool resiValid = thisHouse.registered;
        uint resiNum = thisHouse.maxResidents;
        uint resiAdd = thisHouse.maxResidents;
        string storage houseType = thisHouse.houseType;
        uint[] memory resiList = thisHouse.residentList;

        return (resiValid, resiNum, resiAdd, houseType, resiList);
    }

    function getHouseCount() public view returns(uint x) {
        return (houseCount);
    }

    function getArr() public view returns(House memory h) {
        return houses[msg.sender];
    }

    // // DEBUG TEST STUFF
    // function returnBool(uint number) public view returns (bool) {
    //     if (number > 9000) {
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // }

    // function returnOver9000(uint number) public view returns (bool) {
    //     if (returnBool(number) == true) {
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // }
}