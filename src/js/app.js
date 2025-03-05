var phaseEnum; // for changing phases of voting
App = {
  web3Provider: null,
  contracts: {},
  account:0x0,

  init: async function() {
    // Load pets.
   
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
        App.web3Provider = window.ethereum;
        web3 = new Web3(window.ethereum);
        console.log("web3 after initialization:", web3); // <--- Add this log
        console.log("web3.utils after initialization:", web3.utils); // <--- Add this log

        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });//this is externaly added
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            App.account = accounts[0]; // Ensure first account is used
            console.log("Connected MetaMask Account:", App.account);
        } catch (error) {
            console.error("User denied account access:", error);
            alert("please authorize metamask to use your account");
        }
    } else {
        console.log("Non-Ethereum browser detected. Install MetaMask!");
    }
    return App.initContract();
},


  initContract: function() {
    
    $.getJSON("Contest.json",function(contest){
      App.contracts.Contest=TruffleContract(contest);

      App.contracts.Contest.setProvider(web3.currentProvider);

  
      return App.render();
    });
  },

  render: function(){
    
    var contestInstance;
    var loader=$("#loader");
    var content=$("#content"); 
    loader.show();
    content.hide();
    $("#after").hide();

    web3.eth.getCoinbase(function(err,account){
      if(err===null){
        App.account=account;
        $("#accountAddress").html("Your account: "+account);
      }
    });
    $(document).on("click", ".cast-vote", function () {
      var candidateId = $(this).data("id");  // Get Candidate ID
      App.castVote(candidateId);  // Call Voting Function
  });
  
    

    // ------------- fetching candidates to front end from blockchain code-------------
    App.contracts.Contest.deployed().then(function(instance){
      contestInstance=instance;
      return contestInstance.contestantsCount();
    }).then(function(contestantsCount){
      // var contestantsResults=$("#contestantsResults");
      // contestantsResults.empty();

      // var contestantSelect=$("#contestantSelect");
      // contestantSelect.empty();

      // for(var i=1; i<=contestantsCount; i++){
      //   contestInstance.contestants(i).then(function(contestant){
      //     var id=contestant[0];
      //     var name=contestant[1];
      //     var voteCount=contestant[2];
      //     var fetchedParty=contestant[3];
      //     var fetchedAge = contestant[4];
      //     var fetchedQualification = contestant[5]

      //     var contestantTemplate="<tr><th>"+id+"</th><td>"+name+"</td><td>"+fetchedAge+"</td><td>"+fetchedParty+"</td><td>"+fetchedQualification+"</td><td>"+voteCount+"</td></tr>";
      //     contestantsResults.append(contestantTemplate)  ;

      //     var contestantOption="<option value='"+id+"'>"+name+"</option>";
      //     contestantSelect.append(contestantOption);

      var contestantsResults=$("#test");
      contestantsResults.empty();
      var contestantsResultsAdmin=$("#contestantsResultsAdmin");
      contestantsResultsAdmin.empty();

      var contestantSelect=$("#contestantSelect");
      contestantSelect.empty();

      for(var i=1; i<=contestantsCount; i++){
        contestInstance.contestants(i).then(function(contestant){
          var id=contestant[0];
          var name=contestant[1];
          var voteCount=contestant[2];
          var fetchedParty=contestant[3];
          var fetchedAge = contestant[4];
          var fetchedQualification = contestant[5]

          var contestantTemplate = `
          <div class="card candidate-card d-flex flex-row align-items-center p-3" style="width: 100%; margin: 10px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 10px;">
              <img class="candidate-img" src="../img/Sample_User_Icon.png" alt="Candidate Image" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 15px;">
              <div class="candidate-info" style="flex-grow: 1; text-align: left; color: white;">
                  <h1 style="margin: 0; font-weight: bold;">${name}</h1>
                  <p style="margin: 2px 0;"><b>Party:</b> ${fetchedParty}</p>
                  <p style="margin: 2px 0;"><b>Age:</b> ${fetchedAge} | <b>Qualification:</b> ${fetchedQualification}</p>
              </div>
              <button class="btn btn-success" onClick="App.castVote(${id})" style="padding: 10px 15px; font-size: 16px;">Vote</button>
          </div>`;
      
      
      
          contestantsResults.append(contestantTemplate)  ;

          var contestantOption="<option style='padding: auto;' value='"+id+"'>"+name+"</option>";
          contestantSelect.append(contestantOption);

          var contestantTemplateAdmin="<tr><th>"+id+"</th><td>"+name+"</td><td>"+fetchedAge+"</td><td>"+fetchedParty+"</td><td>"+fetchedQualification+"</td><td>"+voteCount+"</td></tr>";
          contestantsResultsAdmin.append(contestantTemplateAdmin)  ;
        }); 
      }
      loader.hide();
      content.show();
    }).catch(function(error){
      console.warn("Error fetching candidate:",error);
    });
    
    // ------------- fetching current phase code -------------
    App.contracts.Contest.deployed().then(function (instance){
      return instance.state();
    }).then(function(state){
      var fetchedState;
      var fetchedStateAdmin;
      phaseEnum = state.toString();
      if(state == 0){
        fetchedState = "Registration phase is on , go register yourself to vote !!";
        fetchedStateAdmin = "Registration";
      }else if(state == 1){
        fetchedState = "Voting is now live !!!";
        fetchedStateAdmin = "Voting";
      }else {
        fetchedState = "Voting is now over !!!";
        fetchedStateAdmin = "Election over";
      }
      
      var currentPhase = $("#currentPhase");//for user
      currentPhase.empty();
      var currentPhaseAdmin = $("#currentPhaseAdmin");//for admin
      currentPhaseAdmin.empty();
      var phaseTemplate = "<h1>"+fetchedState+"</h1>";
      var phaseTemplateAdmin = "<h3> Current Phase : "+fetchedStateAdmin+"</h3>";
      currentPhase.append(phaseTemplate);
      currentPhaseAdmin.append(phaseTemplateAdmin);
    }).catch(function(err){
      console.error(err);
    })

    // ------------- showing result -------------
    App.contracts.Contest.deployed().then(function (instance){
      return instance.state();
    }).then(function(state){
      var result = $('#Results');
      if(state == 2){
        $("#not").hide();
        contestInstance.contestantsCount().then(function(contestantsCount){
          for(var i=1; i<=contestantsCount; i++){
            contestInstance.contestants(i).then(function(contestant){
              var id=contestant[0];
              var name=contestant[1];
              var voteCount=contestant[2];
              var fetchedParty=contestant[3];
              var fetchedAge = contestant[4];
              var fetchedQualification = contestant[5];

              var resultTemplate="<tr><th>"+id+"</th><td>"+name+"</td><td>"+fetchedAge+"</td><td>"+fetchedParty+"</td><td>"+fetchedQualification+"</td><td>"+voteCount+"</td></tr>";
              result.append(resultTemplate)  ;
            });
          }
        })
         
      } else {
        //$("#renderTable").hide();
      }
    }).catch(function(err){
      console.error(err);
    })
  },

  
  

  // ------------- voting code -------------
  // chatgpt 
  /*
  castVote: async function(id) {
    try {
        if (!App.account) {
            throw new Error("❌ No valid MetaMask account detected.");
        }

        const instance = await App.contracts.Contest.deployed();
        if (!instance) {
            throw new Error("❌ Contract instance is undefined!");
        }

        console.log("🗳️ Casting vote for contestant ID:", id, "from account:", App.account);

        const result = await instance.vote(id, { from: App.account });
        console.log("✅ Vote cast successfully:", result);
    } catch (error) {
        console.error("❌ Error while casting vote:", error);
    }
}
,*/castVote: async function(id) {
    if (!App.account) {
        alert("Please connect to MetaMask first.");
        return;
    }

    const instance = await App.contracts.Contest.deployed();
    if (!instance) {
        console.error("Contract instance is undefined!");
        return;
    }

    try {
        await instance.vote(id, { from: App.account });
        showVoteMessage();  // Show success message
    } catch (error) {
        alert("alrealy voted");
        console.error("Error while casting vote:", error);
    }
}
,

  // ------------- adding candidate code -------------
  addCandidate: function(){
    $("#loader").hide();
    var name=$('#name').val();
    var age = $('#age').val();
    var party = $('#party').val();
    var qualification = $('#qualification').val();
    
    App.contracts.Contest.deployed().then(function(instance){
      return instance.addContestant(name, party, age, qualification, { from: App.account }); // Include sender
    }).then(function(result){
      console.log("Candidate added successfully:", result);
      $("#loader").show();
      $('#name').val('');
      $('#age').val('');
      $('#party').val('');
      $('#qualification').val('');
    }).catch(function(err){
      console.error("Error adding candidate:", err);
    });
  },

  // ------------- changing phase code -------------
  
  changeState: function(){
    phaseEnum ++;
    // console.log(phaseEnum);
    App.contracts.Contest.deployed().then(function(instance){
      return instance.changeState(phaseEnum, {from : App.account});
    }).then(function(result){
      console.log("phase changed successfully :", result);
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err){
      console.error("Error changin phase :",err);
    })
  },

  // ------------- registering voter code -------------
  registerVoter: async function(){
    var voterAddress = $('#accadd').val();
    console.log("Inside registerVoter, web3 object:", web3); // <---- Add this line

    

    console.log("Registering voter address:", voterAddress);

    App.contracts.Contest.deployed().then(function(instance){
        return instance.voterRegisteration(voterAddress,{from : App.account});
    }).then(function(result){
      console.log("Successful registration");
        $("#content").hide();
        $("#loader").show();
    }).catch(function(err){
        console.error("Error facing the proble : " ,err);
    })
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
