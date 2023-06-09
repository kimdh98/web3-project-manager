App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: '127.0.0.1:7545',
  owner:null,
  currentAccount:null,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('ProjectManagement.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var projectArtifact = data;
      App.contracts.project = TruffleContract(projectArtifact);
      // Set the provider for our contract
      App.contracts.project.setProvider(App.web3Provider);
      
      App.getUser();
      App.getProjectMembers();
      App.getCompletedTasks();
      App.getPendingTasks();
  
      return App.bindEvents();
    });
  },

  bindEvents: function() {
    $(document).on('click', '#add-task', function(){ 
        var params = {
            "name": $('#name').val(),
            "members": $('#members').val(),
            "difficulty": $('#difficulty').val()
        }; 
        App.handleAddTask(params); 
    });
    $(document).on('click', '#verify-completion', function(){ var id = $('#verify-id').val(); App.handleVerifyComplete(id); });
    $(document).on('click', '#request-completion', function(){ var id = $('#request-id').val(); App.handleRequestComplete(id); });
    $(document).on('click', '#register', function(){ 
        var params = {
            "addr": $('#enter_address').val(),
            "name": $('#enter_name').val()
        };
        App.handleRegister(params); 
    });
    $(document).on('click', '#transfer', function(){ var ad = $('#transfer_address').val(); App.handleOwnershipTransfer(ad); });
    ethereum.on("accountsChanged", App.getUser);
  },


  getProjectMembers: function() {
    App.contracts.project.deployed().then(async function(instance) {
      const count = await instance.memberCount();
      const total_tokens = await instance.getTotalFragments();
      let members = []
      for (i=0; i<count; i++) {
        let addr = await instance.memberAddresses(i);
        let member = await instance.projectMembers(addr);
        let owned_tokens = await instance.getOwnedFragments(addr);
        members.push({"addr": addr, "name": member[1], "tokens": owned_tokens, "percent": (owned_tokens/total_tokens).toFixed(2)});
      }
      return members
    }).then(function(result) {
        var memberList = $('#project-members');
        var memberOpts = $('#members');
        memberList.empty();
        memberOpts.empty();
        console.log(result);
        for (const member of result) {
            console.log(member)
            memberList.append($(`<li>${member.name}\t||\t${member.addr}\t||\t${member.tokens} tokens owned\t(${member.percent*100}%)</li>`));
            memberOpts.append($(`<option value=${member.addr}>${member.name}</option>`))
        }
    })
  },

  getPendingTasks: function() {
    App.contracts.project.deployed().then(async function(instance) {
      const ids = await instance.getPendingTasks();
      let tasks = []
      console.log(ids);
      for (id of ids) {
        console.log(id.c[0]);
        let task = await instance.tasks(id.c[0]);
        tasks.push(task);
      }
      return tasks
    }).then(function(result) {
        var taskList = $('#ongoing-tasks')
        taskList.empty();
        console.log(result);
        for (const task of result) {
            console.log(App.owner, App.currentAccount);
            if (App.owner == App.currentAccount)
                taskList.append($(`<li>id:${task[0]}\t||\tname:${task[1]}\t||\tdifficulty:${task[4]}\t||\tcompleteRequested:${task[3]}</li>`));
            else
                taskList.append($(`<li>id:${task[0]}\t||\tname:${task[1]}\t||\tdifficulty:${task[4]}</li>`));
        }
    })
  },

  getCompletedTasks: function() {
    App.contracts.project.deployed().then(async function(instance) {
      const ids = await instance.getCompletedTasks();
      let tasks = []
      for (id of ids) {
        console.log(id.c[0]);
        let task = await instance.tasks(id.c[0]);
        console.log(task);
        tasks.push(task);
      }
      return tasks
    }).then(function(result) {
        var taskList = $('#completed-tasks')
        taskList.empty();
        console.log(result);
        for (const task of result) {
            console.log(task)
            taskList.append($(`<li>id:${task[0]}\t||\tname:${task[1]}\t||\tdifficulty:${task[4]}</li>`));
        }
    })
  },

  getUser : async function(){
    App.contracts.project.deployed().then(function(instance) {
      return instance;
    }).then(async function(result) {
      App.owner = await result.projectOwner();
      web3.eth.defaultAccount = web3.eth.coinbase;
      App.currentAccount = web3.eth.coinbase;
      console.log(App.owner, App.currentAccount);
      if(App.owner == App.currentAccount){
        jQuery('#current_account').text(App.currentAccount+" (owner)");
        $('#owner-member-control').show();
        $('#owner-task-control').show();
      } else {
        jQuery('#current_account').text(App.currentAccount);
        $('#owner-member-control').hide();
        $('#owner-task-control').hide();
      }
    })
  },

  handleAddTask: function (event) {
    App.contracts.project.deployed().then(function(instance) {
        console.log(event);
      return instance.createTask(event.name, event.members, event.difficulty);
    }).then(function(result, err){
        App.getPendingTasks();  
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(event.name + " Task added successfully")
            else
            alert(event.name + " registration not done successfully due to revert")
        } else {
            alert(event.name + " registration failed")
        } 
    });
  },

  handleRegister: function(event){
    var projectInstance;
    App.contracts.project.deployed().then(function(instance) {
        projectInstance = instance;
      return projectInstance.addProjectMember(event.addr, event.name);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(event.name + " registration done successfully")
            else
            alert(event.name + " registration not done successfully due to revert")
        } else {
            alert(event.name + " registration failed")
        }
        App.getProjectMembers();
    });
  },

  handleRequestComplete: function(id) {
    App.contracts.project.deployed().then(function(instance) {
      return instance.requestTaskCompletion(id);
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1)
            alert(id + " task requested to be completed")
            else
            alert(id + " registration not done successfully due to revert")
        } else {
            alert(id + " registration failed")
        }   
        App.getPendingTasks();
    });
  },
  
  handleVerifyComplete: function(id) {
    App.contracts.project.deployed().then(function(instance) {
        return instance.approveTaskCompletion(id);
      }).then(function(result, err){
          if(result){
              if(parseInt(result.receipt.status) == 1)
              alert(id + " task marked as completed")
              else
              alert(id + " registration not done successfully due to revert")
          } else {
              alert(id + " registration failed")
          }   
          App.getCompletedTasks();
          App.getPendingTasks();
          App.getProjectMembers();
      });
  },
  
  handleOwnershipTransfer: function(ad) {
    App.contracts.project.deployed().then(function(instance) {
        return instance.handoverOwnership(ad);
      }).then(function(result, err){
          if(result){
              if(parseInt(result.receipt.status) == 1)
              alert("Successfully transferred ownership to" + ad)
              else
              alert("Transfer not done successfully due to revert")
          } else {
              alert("Transfer failed")
          }   
          App.getUser();
          App.getCompletedTasks();
          App.getPendingTasks();
          App.getProjectMembers();
      });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
