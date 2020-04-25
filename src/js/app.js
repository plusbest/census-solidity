App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasHouse: false,  // Tag for DOM hide and show
  hasPeople: false, // Tag for DOM hide and show
  residentIds: [],

  init: function() {
    return App.initWeb3();
  },

  // Initialize web3 and web3 provider
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  // Initialize Oracle contract
  initContract: function() {
    $.getJSON("Oracle.json", function(Oracle) {
      App.contracts.Oracle = TruffleContract(Oracle);
      App.contracts.Oracle.setProvider(App.web3Provider);

    // Initialize Census contract
    }).then (function() {
      $.getJSON("Census.json", function(Census) {
        App.contracts.Census = TruffleContract(Census);
        App.contracts.Census.setProvider(App.web3Provider);
        App.listenForEvents();
        return App.render();
      })
    });
  },

  // Refresh page on House added event
  listenForEvents: function() {
    App.contracts.Census.deployed().then(function(instance) {
      instance.houseAddedEvent({}, {
        fromBlock: 'latest',
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
        return App.render();
      });
    });
  },

  render: function() {
    var CensusInstance;
    var loader = $("#loader");
    var content = $("#content");
    var peopleDataFull = [];
    var keyGenSection = $("#keyGenSection");
    var keyVerifySection = $("#keyVerifySection");
    var addHouseSection = $("#addHouseSection");
    var addPersonSection = $("#addPersonSection");
    var houseInfoSection = $("#houseInfoSection");
    var addPersonForm = $("#addPersonForm");
    var residentTableSection = $("#residentTableSection");

    loader.hide();
    content.show();

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Initialize Oracle instance
    App.contracts.Oracle.deployed().then(function(instanceOracle) {
      OracleInstance = instanceOracle;
      return App.contracts.Census.deployed();

    // Initialize Census instance
    }).then(function(instance) {
      CensusInstance = instance;
      return CensusInstance.getHouse.call(App.account);

    // Add user House information to page
    }).then(function(myHouse) {
      // Update global variable for DOM actions
      if (myHouse[0] === true) {
        App.hasHouse = true;
      }
      // Appends House object information to overview
      $("#houseId").html("House ID: " + "<b>" + myHouse[1].c[0] + "</b>");
      $("#maxResidents").html("Max residents: " + "<b>" + myHouse[2].c[0] + "</b>");
      $("#extraResidents").html("Additional residents: " + "<b>" + myHouse[3].c[0] + "</b>"); 
      $("#houseType").html("House type: " + "<b>" + myHouse[4] + "</b>");
      $("#houseStateCode").html("State code: " + "<b>" + myHouse[5] + "</b>");      

      // Store list of House resident ID numbers
      App.residentIds = myHouse[6];

      // Obtains object info for all resident IDs
      return CensusInstance.getPeople.call(App.residentIds);

      // Appends Person info to combined list
      // then obtains additional Person info
    }).then(function(peopleList) {    
      peopleDataFull.push(peopleList);
      return CensusInstance.getPeopleMore.call(App.residentIds)

      // Appends additional Person info to combined list
      // then returns completed info
    }).then(function(peopleListMore) {
      for (i = 0; i < peopleListMore.length; i++) {
        peopleDataFull[0].push(peopleListMore[i]);
      };
      return peopleDataFull;

      // Places all Person data onto resident table info
      // overview in browser
    }).then(function(peopleDataFull) {

      var peopleList = peopleDataFull[0];

      if (peopleList[0].length > 0) {
        // Update global variable for DOM actions
        App.hasPeople = true;
      }
      let tbody = document.querySelector('#resiTableBody');
      var paramNum = peopleList.length;

      // Iterate through House residents
      for (i = 0; i < peopleList[0].length; i++) {
        const tr = document.createElement('tr');

        // Creates table data for each parameter of resident
        for (j = 0; j < paramNum; j++) {
          const td = document.createElement('td');

          // Handles pulling correct object data element
          if (typeof(peopleList[j][i]) === "object") {
            td.innerHTML = `${peopleList[j][i].c[0]}`;
          }
          // Handles converting string type
          else if (typeof(peopleList[j][i]) === "string") {
            var string = web3.toAscii(peopleList[j][i]);
            td.innerHTML = string;
          }
          else {
            td.innerHTML = `${peopleList[j][i]}`;
          }
          tr.append(td);
        }
        tbody.append(tr);
      };

    // Hide or show front-end forms respectively
    }).then(function() {
      if (App.hasHouse === true) {
        keyGenSection.hide();
        keyVerifySection.hide();
        addHouseSection.hide();
        houseInfoSection.show();        
        addPersonSection.show();
      }
      if (App.hasPeople === true) {
        residentTableSection.show();
      }
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  generateKey: function () {
    var generatedPassword = document.querySelector('#generatedPassword');
    var generatedHash = document.querySelector('#generatedHash');

    // Creates a new random account string serving as a private key
    web3.personal.newAccount('dash_of_entropy', function(err, privateKey){ //web3.eth.accounts[0]

      // Signs with private key and returns hashed signature
      web3.personal.sign(privateKey, App.account, "fooPassword", function(err, firstHash){

        // Format for ETH address consistency
        var refactoredHash = firstHash.substring(0, 42);

        // Signs with secondary key string
        web3.personal.sign(refactoredHash, App.account, "barPassword", function(err, secondHash) {

          // Format for solidity arg bytes32
          var finalHash = secondHash.substring(0, 66);

          // Create Oracle instance
          App.contracts.Oracle.deployed().then(function(instance) {
          tempInstance = instance;

            // Register key onto chain
            return tempInstance.keyGen(refactoredHash, finalHash);

            }).then(function() {
            // Add key info to DOM only when transaction signing
            // has fully completed
            generatedPassword.innerHTML = `${privateKey}`;
            generatedHash.innerHTML = `signed hash: ${finalHash}`;
          });
        });
      });
    });
  },

  keyVerify: function() {
    var privateKey = $('#verifyKey').val();
    var publicKey;

    // Hashes private key then refactors to 'public key'
    web3.personal.sign(privateKey, App.account, "fooPassword", function(err, hash) {
      var publicKey = hash.substring(0, 42);

      // Check key validity
      App.contracts.Oracle.deployed().then(function(instance) {
        return instance.keyVerify(publicKey).then(function(boolResult) {
          if (boolResult === true) {
            alert("Valid key :).");
            App.isVerified = true;
          }
          else {
            alert("Invalid key :(.");
          }
        });
      });
    });
  },

  getKeyHash: function() {
    var privateKey = $('#privateKey').val();
    App.contracts.Oracle.deployed().then(function(instance) {
      return instance.getKeyHash(privateKey).then(function(hashresult) {
      });
    });
  },

  addHouse: function() {
    var maxResidents = $('#maxResi').val();
    var extraResidents = $('#extraResi').val();
    var houseStateCode = $('#stateSelect option:selected').val();    
    var houseType = $('#houseSelect option:selected').val();
    var privateKey = $('#privateKey').val();

    // Sign address string with password to generate hash
    web3.personal.sign(privateKey, App.account, "fooPassword", function(err, firstHash){
      // Format for eth address consistency
      var refactoredHash = firstHash.substring(0, 42);

    web3.personal.sign(refactoredHash, App.account, "barPassword", function(err, secondHash) {
      // Format for solidity arg bytes32
      var finalHash = secondHash.substring(0, 66);

        // Create Oracle instance
        App.contracts.Oracle.deployed().then(function(instance) {
          tempInstance = instance;
          // Return hash of 
          return tempInstance.getKeyHash(refactoredHash);

        // Compares returned hash with signed hash
        }).then(function(returnHash) {

          if (finalHash == returnHash) {
            // Create Census instance
            App.contracts.Census.deployed().then(function(instance) {
              // Add house
              return instance.addHouse(maxResidents,
                                       extraResidents,
                                       houseStateCode,
                                       houseType, { from: App.account });
            }).then(function(result) {
              // $("#content").hide();
              // $("#loader").show();
            }).catch(function(err) {
              console.error(err);
            });
            alert("Valid key: Confirm transaction to complete registration.");
          }
          else {
            alert("Invalid key: Cannot proceed with registration.");
          }
        });
      });
    });
  },

  addPerson: function() {
    // Obtain form elements
    var isMale = $('#maleTrue').is(':checked');
    var isHispanic = $('#hispanicTrue').is(':checked');
    var personAge = $('#uage').val();
    var personBirthDate = (( $('#byear').val()) + $('#bmonth').val()) + ($('#bday').val());
    var personRace = $('#personRace').val();
    var personLiveReason = $('#personLiveReason').val();
    var personRelation = $('#personRelation').val();

    // Add person contract call
    App.contracts.Census.deployed().then(function(instance) {
      return instance.addPerson(isMale,
                                isHispanic,
                                personAge,
                                personBirthDate,
                                personRace,
                                personLiveReason,
                                personRelation, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getStateHouses: function() {
    var testStateCode = $('#testState option:selected').val();  
    App.contracts.Census.deployed().then(function(instance) {
      return instance.getStateHouses(testStateCode).then(function(result) {
        console.log(result);
        alert(result);
      });
    });
  },

  getHouseByAddr: function() {
    var testHouseAddr = $('#testHouseAddr').val();  
    // var privateKey = $('#privateKey').val();
    App.contracts.Census.deployed().then(function(instance) {
      return instance.getHouse(testHouseAddr).then(function(result) {
      if (result[0] === true) {
      }
      var returnObj = {
        'House ID': result[1].c[0],
        'Max residents': result[2].c[0],
        'Additional residents': result[3].c[0],
        'House type': result[4],
        'State code': result[5],
      }
      // Make it pretty
      alert(JSON.stringify(returnObj));
      console.log(JSON.stringify(returnObj));        
      });
    });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});