pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Census {

    // Initialize contract owner
    address public owner;

    // Global counter for Person struct ID
    uint public personCount;
    // Global counter for House count
    uint public houseCount;

    // House struct
    struct House {
        bool registered;
        uint id;
        uint maxResidents;
        uint extraResidents;
        string houseType; // House, Apartment, Mobile Home
        uint8 stateCode;
        uint[] residentList;
    }

    // Person struct
    // NOTE: Params race, liveReason, and relation stored as bytes32
    // because arrays of strings are not supported in web3 and return
    // blank/empty. Array of bytes are used then converted in web3.
    struct Person {
        bool registered;
        uint id; // peopleCount at time of transaction
        address home; // easy tracking on data pulls
        bool isMale;
        bool isHispanic;
        uint32 age;
        uint32 birthDate; // YYYYMMDD
        bytes32 race;
        bytes32 liveReason;
        bytes32 relation;
    }

    // stores index of 'Houses' struct by address
    mapping(address => House) public houses;

    mapping(uint256 => address) public houseById;

    // stores a 'Person' struct as index id
    mapping(uint => Person) public people;

    event houseAddedEvent (
    uint indexed _maxResidents,
    uint indexed _extraResidents,
    uint8 indexed _stateCode
    );

    constructor() public {
        // Contract owner
        owner = msg.sender;
        personCount = 0;
        houseCount = 0;
    }

    // Add user's House information
    function addHouse(uint _maxResidents,
                      uint _extraResidents,
                      uint8 _stateCode,
                      string memory _housetype) public {
        
        // Ensure house is not already registered for address
        require(houses[msg.sender].registered == false, "This address has already registered a house.");

        // Map new House ID
        houseById[houseCount] = msg.sender;

        // Initialize empty residentList array
        uint[] memory emptyList = new uint[](0);
        
        // Create new house struct
        House memory newhouse = House(true,
                                      houseCount,
                                      _maxResidents,
                                      _extraResidents,
                                      _housetype,
                                      _stateCode,
                                      emptyList);

        houses[msg.sender] = newhouse;

        // Increase global house count
        houseCount++;        

        emit houseAddedEvent(_maxResidents, _extraResidents, _stateCode);
    }

    // Add a new Person(resident) to user House
    function addPerson(bool _ismale,
                       bool _ishispanic,
                       uint32 _age,
                       uint32 _birthdate,
                       bytes32 _race,
                       bytes32 _liveReason,
                       bytes32 _relation) public {

        House storage currentHouse = houses[msg.sender];
        // Ensure house for address exists before adding
        require(currentHouse.registered == true, "There is no house registered for this address.");
        // Require house of address to have resident count within range
        require(currentHouse.residentList.length < currentHouse.maxResidents, "Max registered people for this House.");

        Person memory newPerson =  Person(true,
                                          personCount,
                                          msg.sender,
                                          _ismale,
                                          _ishispanic,
                                          _age,
                                          _birthdate,
                                          _race,
                                          _liveReason,
                                          _relation);
        // Map new person struct
        people[personCount] = newPerson;

        // Add person ID to house residentList
        houses[msg.sender].residentList.push(personCount);
        
        // Increase global person count (iD)
        personCount++;
    }

    // Return House struct params
    function getHouse(address _addr) public view returns (bool,
                                             uint,
                                             uint,
                                             uint,
                                             string memory,
                                             uint8,
                                             uint[] memory) {
        
        House storage thisHouse = houses[_addr];

        bool resiValid = thisHouse.registered;
        uint resiId = thisHouse.id;        
        uint resiNum = thisHouse.maxResidents;
        uint resiAdd = thisHouse.extraResidents;
        string storage houseType = thisHouse.houseType;
        uint8 stateCode = thisHouse.stateCode;
        uint[] memory resiList = thisHouse.residentList;

        return (resiValid, resiId, resiNum, resiAdd, houseType, stateCode, resiList);
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

    // Return additional Person details to avoid
    // stack overflow when using getPerson() getter
    function getPersonMore(uint index) public view returns (bytes32,
                                                            bytes32) {
        Person storage thisPerson = people[index];

        bytes32 liveReason = thisPerson.liveReason;
        bytes32 relation = thisPerson.relation;

        return (liveReason, relation);
    }

    // Return a list of Person struct params
    function getPeople(uint[] memory resiNums) public view returns (uint[] memory,
                                                                    bool[] memory,
                                                                    bool[] memory,
                                                                    uint[] memory,
                                                                    uint[] memory,
                                                                    bytes32[] memory){

        for (uint i = 0; i < resiNums.length; i++) {
            require(people[resiNums[i]].registered == true, "Invalid person ID requested.");
        }
      
        uint[] memory id = new uint[](resiNums.length);
        bool[] memory isMale = new bool[](resiNums.length);
        bool[] memory isHispanic = new bool[](resiNums.length);
        uint[] memory age = new uint[](resiNums.length);
        uint[] memory birthDate = new uint[](resiNums.length);
        bytes32[] memory race = new bytes32[](resiNums.length);

        for (uint i = 0; i < resiNums.length; i++) {

            id[i] = people[resiNums[i]].id;
            isMale[i] = people[resiNums[i]].isMale;
            isHispanic[i] = people[resiNums[i]].isHispanic;
            age[i] = people[resiNums[i]].age;
            birthDate[i] = people[resiNums[i]].birthDate;
            race[i] = people[resiNums[i]].race;
        }
        return (id, isMale, isHispanic, age, birthDate, race);
    }

    // Return additional People list details to avoid
    // stack overflow when using getPeople() getter
    function getPeopleMore(uint[] memory resiNums) public view returns (bytes32[] memory,
                                                                        bytes32[] memory){
        
        for (uint i = 0; i < resiNums.length; i++) {
            require(people[resiNums[i]].registered == true, "Invalid person ID requested.");
        }
      
        bytes32[] memory liveReason = new bytes32[](resiNums.length);
        bytes32[] memory relation = new bytes32[](resiNums.length);

        for (uint i = 0; i < resiNums.length; i++) {

            liveReason[i] = people[resiNums[i]].liveReason;
            relation[i] = people[resiNums[i]].relation;
        }
        return (liveReason, relation);
    }

    function getStateHouses(uint stateId) public view returns(address[] memory) {
        // Permit states within valid state code range
        require(stateId > 0 && stateId < 52, "Invalid state code.");

        uint validCount = 0;  // State match counter

        // Counts all addresses with matching state code
        for (uint i = 0; i < houseCount; i++) {
            address houseAddr = houseById[i];
            if (houses[houseAddr].stateCode == stateId) {
                validCount++;
            }
        }
        // Initialize with validCount as dynamic arrays are not
        // allowed using memory
        address[] memory addressList = new address[](validCount);        
        
        // Populate list of valid addresses
        for (uint i = 0; i < validCount; i++) {
            address houseAddr = houseById[i];
            if (houses[houseAddr].stateCode == stateId) {
                addressList[i] = houseById[i];
            }
        }
        return addressList;
    }
}