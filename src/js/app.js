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
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Census.json", function(Census) {
      App.contracts.Census = TruffleContract(Census);
      App.contracts.Census.setProvider(App.web3Provider);
      App.listenForEvents();

      return App.render();
    });
  },

  listenForEvents: function() {
    App.contracts.Census.deployed().then(function(instance) {
      instance.houseAddedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
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

    App.contracts.Census.deployed().then(function(instance) {

      CensusInstance = instance;

      return CensusInstance.getHouse.call();

    }).then(function(myHouse) {

      console.log(myHouse);

      $("#maxResidents").html("Max residents " + myHouse[1].c[0]);
      $("#extraResidents").html("Additional residents:" + myHouse[2].c[0]); 
      $("#houseType").html("House type:" + myHouse[3]);
      $("#resiListArray").html("IDs:" + myHouse[4]);

      return CensusInstance.getHouse.call();

    }).then(function(residentsList) {

      console.log(residentsList);
      // TODO: MAKE THIS SHOW ON WEBPAGE
      // var residentArray = residentsList[2];
      // for (i = 0; i < residentArray.length; i++) {
      //   console.log("array #:" + i);
      // }

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