App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  houseRegistered: false,

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

      // web3OracleProvider = new Web3.providers.HttpProvider('http://localhost:8000');
      // web3Oracle = new Web3(web3OracleProvider);
    }
    return App.initContract();
  },


  // TODO: Add separate providers to each contract init
  initContract: function() {
    $.getJSON("Oracle.json", function(Oracle) {
      console.log(Oracle);
      App.contracts.Oracle = TruffleContract(Oracle);
      App.contracts.Oracle.setProvider(App.web3Provider);
      // App.listenForEvents();

      // return App.render();
    // Second contract called within same initContract
    // as calling it again will only return latest instance
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

    // Creates separate instance for Oracle contract
    App.contracts.Oracle.deployed().then(function(instanceOracle) {
      OracleInstance = instanceOracle;
      return OracleInstance.getHash.call();

    // TESTing function call and return
    }).then(function(hashkey) {
      alert(hashkey);
    });

    App.contracts.Census.deployed().then(function(instance) {
      CensusInstance = instance;
      return CensusInstance.getHouse.call();

    // Add user House information to page
    }).then(function(myHouse) {

      console.log(myHouse);
      
      $("#maxResidents").html("Max residents " + myHouse[1].c[0]);
      $("#extraResidents").html("Additional residents:" + myHouse[2].c[0]); 
      $("#houseType").html("House type:" + myHouse[3]);
      $("#resiListArray").html("IDs:" + myHouse[4]);

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
            console.log("bool detected");
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

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Census.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  addHouse: function() {
    var maxResidents = $('#maxResi').val();
    var extraResidents = $('#extraResi').val();
    var houseType = $('#houseSelect option:selected').val();
    App.contracts.Census.deployed().then(function(instance) {
      return instance.addHouse(maxResidents, extraResidents, houseType, { from: App.account });
    }).then(function(result) {
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
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