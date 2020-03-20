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
        uint32 age;
        uint32 birthDate; // MMDDYYYY
        bytes32 race;
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


    function addPerson(bool _ismale, bool _ishispanic, uint32 _age, uint32 _birthdate, bytes32 _race) public {

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

    // Return House struct params
    function getHouse() public view returns (bool, uint, uint, string memory, uint[] memory) {
        
        House storage thisHouse = houses[msg.sender];

        bool resiValid = thisHouse.registered;
        uint resiNum = thisHouse.maxResidents;
        uint resiAdd = thisHouse.maxResidents;
        string storage houseType = thisHouse.houseType;
        uint[] memory resiList = thisHouse.residentList;

        return (resiValid, resiNum, resiAdd, houseType, resiList);
    }

    // Return Person struct params
    function getPerson(uint index) public view returns (bool,
                                                         address,
                                                         bool,
                                                         bool,
                                                         uint32,
                                                         uint32,
                                                         bytes32) {
        Person storage thisPerson = people[index];

        bool registered = thisPerson.registered;
        address home = thisPerson.home;
        bool isMale = thisPerson.isMale;
        bool isHispanic = thisPerson.isHispanic;
        uint32 age = thisPerson.age;
        uint32 birthDate = thisPerson.birthDate;
        bytes32 race = thisPerson.race;

        return (registered, home, isMale, isHispanic, age, birthDate, race);
    }

        // TEST FUNCTION
      function getPeople(uint[] memory resiNums) public view returns (bool[] memory, bool[] memory, bool[] memory, uint[] memory, uint[] memory, bytes32[] memory){

          for (uint i = 0; i < resiNums.length; i++) {
            require(people[resiNums[i]].registered == true, "Invalid person ID requested.");
          }
          
          bool[] memory registered = new bool[](resiNums.length);
          bool[] memory isMale = new bool[](resiNums.length);
          bool[] memory isHispanic = new bool[](resiNums.length);
          uint[] memory age = new uint[](resiNums.length);
          uint[] memory birthDate = new uint[](resiNums.length);
          bytes32[] memory race = new bytes32[](resiNums.length);

          for (uint i = 0; i < resiNums.length; i++) {
            
            registered[i] = people[resiNums[i]].registered;
            isMale[i] = people[resiNums[i]].isMale;
            isHispanic[i] = people[resiNums[i]].isHispanic;
            age[i] = people[resiNums[i]].age;
            birthDate[i] = people[resiNums[i]].birthDate;
            race[i] = people[resiNums[i]].race;
          }

          return (registered, isMale, isHispanic, age, birthDate, race);

    }
}