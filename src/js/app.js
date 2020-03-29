App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

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
    loader.show();
    content.hide();

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // TODO:
    // Use PW as private key
    // Address is public
    // Sign transaction with web3.eth.personal.sign()
    // Return has is what is to be verified.

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
      console.log(myHouse);

      $("#maxResidents").html("Max residents " + myHouse[1].c[0]);
      $("#extraResidents").html("Additional residents:" + myHouse[2].c[0]); 
      $("#houseType").html("House type:" + myHouse[3]);
      $("#resiListArray").html("resident IDs : " + myHouse[4]);

      return CensusInstance.getPeople.call(myHouse[4]);
    }).then(function(peopleList) {
      console.log(peopleList);

      let tbody = document.querySelector('#resiTableBody');

      // TODO: Generate Boostrap Table with this
      // Table row blah blah

      var paramNum = 6;

      // Iterate through house residents
      for (i = 0; i < peopleList[0].length; i++) {
        document.querySelector('#residentTable');
        const tr = document.createElement('tr');

        // Creates table data for each parameter of resident
        for (j = 0; j < paramNum; j++) {
          const td = document.createElement('td');

          // Catches age and birthdate object type
          // as other params are arrays at index 0
          if (typeof(peopleList[j][i]) === "object") {
            td.innerHTML = `${peopleList[j][i].c[0]}`
          }
          // Catch race param for bytes32 to string conversion
          // as web3 nested arrays return blank strings
          else if (j == 5) {
            var str = peopleList[j][i];
            var conversion = web3.toAscii(str);
            td.innerHTML = `${conversion}`;
          }
          else {
            td.innerHTML = `${peopleList[j][0]}`
          }
          tr.append(td);
        }
        tbody.append(tr);
      };

    // TODO: Clean this up to work for addHouse and addPerson forms
    }).then(function(hasVoted) {
      if (hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  // Generates a new private key for user verification
  // when starting Census survey
  generateKey: function () {

    var generatedPassword = document.querySelector('#generatedPassword');
    var generatedHash = document.querySelector('#generatedHash');

    // Creates a new random account string serving as a private key
    web3.personal.newAccount('sprinkle_of_entropy', function(err, accountString){ //web3.eth.accounts[0]
            console.log("error: " + err);
            console.log("newaccount: " + accountString);
            generatedPassword.innerHTML = `private key: ${accountString}`;

      // Signs and returns hashed signature whilst using
      // previously generated account as signed input
      web3.personal.sign(accountString, App.account, "foobarPassword", function(err, outputHash){
              console.log("error: " + err);
              console.log("output hash: " + outputHash);
              var trimmedHash = outputHash.substring(0, 66);

              generatedHash.innerHTML = `hash: ${trimmedHash}`; // trimmed for bytes32



         App.contracts.Oracle.deployed().then(function(instance) {
          tempInstance = instance;
          return tempInstance.keyGen(accountString, trimmedHash);
         }).then(function(oldhash) {
          console.log("accountstring: " + accountString);
          return tempInstance.getKeyHash(accountString);
         }).then(function(returnHash) {
          if (trimmedHash == returnHash) {
            alert("We have a match!");
            App.registered = true;
          }
          console.log("original hash:" + trimmedHash);
          console.log("returned hash:" + returnHash);
         });

         
      });

    });
    // web3.toAscii(str); <-- turns bytes32 from contract into string
    // TODO:
      // DOM events to hide elements etc.
      // Proceed to Census forms.

    web3.eth.getAccounts(function(err, res){
            console.log("er: " + err);
            console.log("currentaccount: " + res);
    });

  },

  getKeyValidity: function() {
    var keyAddress = $('#keyAddress').val();
    App.contracts.Oracle.deployed().then(function(instance) {
      return instance.getKeyValidity(keyAddress).then(function(boolResult) {
        if (boolResult === true) {
          alert("Valid key");
        }
        else {
          alert("Invalid key.");
        }
      });
    });
  },

  getKeyHash: function() {
    var keyAddress = $('#keyAddress').val();
    App.contracts.Oracle.deployed().then(function(instance) {
      return instance.getKeyHash(keyAddress).then(function(hashresult) {
        console.log(hashresult);
      });
    });
  },

  addHouse: function() {
    var maxResidents = $('#maxResi').val();
    var extraResidents = $('#extraResi').val();
    var houseType = $('#houseSelect option:selected').val();
    var keyAddress = $('#keyAddress').val();

    // Sign address string with password to generate hash
    web3.personal.sign(keyAddress, App.account, "foobarPassword", function(err, outputHash){

      // Trim hash to match bytes32
      var trimmedHash = outputHash.substring(0, 66);

      // Create Oracle instance
      App.contracts.Oracle.deployed().then(function(instance) {
        tempInstance = instance;
        // Return hash of 
        return tempInstance.getKeyHash(keyAddress);

      // Compares returned hash with signed hash
      }).then(function(returnHash) {
        console.log("TRIMMED HASH:" + trimmedHash);
        console.log("RETURNED HASH:" + returnHash);
        if (trimmedHash == returnHash) {
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
          alert("hash MATCHES");
        }
        else {
          alert("Hash mismatch");
        }
      });
    });
  },

  addPerson: function() {
    var isMale = $('#maleTrue').is(':checked');
    var isHispanic = $('#hispanicTrue').is(':checked');
    var personAge = $('#personAge').val();
    var personBirthDate = $('#personBirthDate').val();
    var personRace = $('#personRace').val();
    App.contracts.Census.deployed().then(function(instance) {
      return instance.addPerson(isMale, isHispanic, personAge, personBirthDate, personRace, { from: App.account });
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