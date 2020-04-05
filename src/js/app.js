App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasHouse: false,
  hasPeople: false,
  residentIds: [],

  init: function() {
    return App.initWeb3();
  },

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

  initContract: function() {
    $.getJSON("Oracle.json", function(Oracle) {
      console.log(Oracle);
      App.contracts.Oracle = TruffleContract(Oracle);
      App.contracts.Oracle.setProvider(App.web3Provider);
      // App.listenForEvents();

      // return App.render();
    }).then (function() {
      $.getJSON("Census.json", function(Census) {
        console.log(Census);
        App.contracts.Census = TruffleContract(Census);
        App.contracts.Census.setProvider(App.web3Provider);
        App.listenForEvents();

        return App.render();
      })
    });
  },

  listenForEvents: function() {
    App.contracts.Census.deployed().then(function(instance) {
      instance.houseAddedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
      });
    });
  },

  render: function() {
    var CensusInstance;
    var loader = $("#loader");
    var content = $("#content");
    var peopleDataFull = [];
    var addHouseSection = $("#addHouseSection");
    var addPersonSection = $("#addPersonSection");
    var houseInfoSection = $("#houseInfoSection");
    var addPersonForm = $("#addPersonForm");
    var residentSection = $("#residentSection");

    loader.show();
    content.hide();

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
      return CensusInstance.getHouse.call();

    // Add user House information to page
    }).then(function(myHouse) {
      // Update global variable for DOM
      if (myHouse[0] === true) {
        App.hasHouse = true;
      }
      console.log(myHouse);

      $("#maxResidents").html("Max residents " + myHouse[1].c[0]);
      $("#extraResidents").html("Additional residents:" + myHouse[2].c[0]); 
      $("#houseType").html("House type:" + myHouse[3]);
      $("#resiListArray").html("resident IDs : " + myHouse[4]);

      App.residentIds = myHouse[4];
      return CensusInstance.getPeople.call(App.residentIds);

      // TODO: get info from getPeopleMore()
    }).then(function(peopleList) {

      peopleDataFull.push(peopleList);

      return CensusInstance.getPeopleMore.call(App.residentIds)
    // Gets additional Resident info and appends
    }).then(function(peopleListMore) {

      for (i = 0; i < peopleListMore.length; i++) {
        peopleDataFull[0].push(peopleListMore[i]);
      };


      return peopleDataFull;
    }).then(function(peopleDataFull) {

      var peopleList = peopleDataFull[0];
      console.log(peopleList);

      if (peopleList.length > 0) {
        App.hasPeople = true;
      }

      let tbody = document.querySelector('#resiTableBody');

      // Modified. Make sure doesn't break
      var paramNum = peopleList.length;

      // Iterate through house residents
      for (i = 0; i < peopleList[0].length; i++) {
        const tr = document.createElement('tr');

        // Creates table data for each parameter of resident
        for (j = 0; j < paramNum; j++) {
          const td = document.createElement('td');

          if (typeof(peopleList[j][i]) === "object") {

            td.innerHTML = `${peopleList[j][i].c[0]}`;
          }
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

    }).then(function() {
      if (App.hasHouse === true) {
        addHouseSection.hide();
        addPersonSection.show();
        houseInfoSection.show();
      }
      if (App.hasPeople === false) {
        residentSection.hide();
      }
      loader.hide();
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
            console.log("error: " + err);
            console.log("private key: " + privateKey);

      // Signs and returns hashed signature whilst using
      // previously generated account as signed input
      web3.personal.sign(privateKey, App.account, "fooPassword", function(err, firstHash){
              console.log("error: " + err);
              console.log("first hash: " + firstHash);

              // Format for eth address consistency
              var refactoredHash = firstHash.substring(0, 42);
              console.log("refactored hash: " + refactoredHash);

        web3.personal.sign(refactoredHash, App.account, "barPassword", function(err, secondHash) {
              console.log("error: " + err);
              console.log("second hash: " + secondHash);
              // Format for solidity arg bytes32
              var finalHash = secondHash.substring(0, 66);
              console.log("final hash: " + finalHash);

              // Create Oracle instance
              App.contracts.Oracle.deployed().then(function(instance) {
              tempInstance = instance;

              // Generate key on-chain
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
    // web3.toAscii(str); <-- turns bytes32 from contract into string
  },

  getKeyValidity: function() {
    var privateKey = $('#privateKey').val();
    var publicKey;

    // Hash private key then refactors to public key
    web3.personal.sign(privateKey, App.account, "fooPassword", function(err, hash) {
      var publicKey = hash.substring(0, 42);

      // Check key validity via contract
      App.contracts.Oracle.deployed().then(function(instance) {
        return instance.getKeyValidity(publicKey).then(function(boolResult) {
          if (boolResult === true) {
            alert("Valid key");
          }
          else {
            alert("Invalid key.");
            }
          });
        });
    });
  },

  getKeyHash: function() {
    var privateKey = $('#privateKey').val();
    App.contracts.Oracle.deployed().then(function(instance) {
      return instance.getKeyHash(privateKey).then(function(hashresult) {
        console.log(hashresult);
      });
    });
  },

  addHouse: function() {
    var maxResidents = $('#maxResi').val();
    var extraResidents = $('#extraResi').val();
    var houseType = $('#houseSelect option:selected').val();
    var privateKey = $('#privateKey').val();

    // Sign address string with password to generate hash
    web3.personal.sign(privateKey, App.account, "fooPassword", function(err, firstHash){
      // Format for eth address consistency
      var refactoredHash = firstHash.substring(0, 42);
      console.log(refactoredHash);

    web3.personal.sign(refactoredHash, App.account, "barPassword", function(err, secondHash) {
      // Format for solidity arg bytes32
      var finalHash = secondHash.substring(0, 66);
      console.log(finalHash);

        // Create Oracle instance
        App.contracts.Oracle.deployed().then(function(instance) {
          tempInstance = instance;
          // Return hash of 
          return tempInstance.getKeyHash(refactoredHash);

        // Compares returned hash with signed hash
        }).then(function(returnHash) {
          console.log("OG HASH:" + finalHash);
          console.log("RET HASH:" + returnHash);
          if (finalHash == returnHash) {
            // Create Census instance
            App.contracts.Census.deployed().then(function(instance) {
              // Add house
              return instance.addHouse(maxResidents, extraResidents, houseType, { from: App.account });
            }).then(function(result) {
              $("#content").hide();
              $("#loader").show();
            }).catch(function(err) {
              console.error(err);
            });
            alert("hash match: TRUE");
          }
          else {
            alert("hash match: FALSE");
          }
        });
      });
    });
  },

  addPerson: function() {

    var isMale = $('#maleTrue').is(':checked');
    var isHispanic = $('#hispanicTrue').is(':checked');
    var personAge = $('#personAge').val();
    var personBirthDate = (( $('#byear').val()) + $('#bmonth').val()) + ($('#bday').val());
    var personRace = $('#personRace').val();
    var personLiveReason = $('#personLiveReason').val();
    var personRelation = $('#personRelation').val();

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

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});