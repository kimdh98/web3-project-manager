const ProjectManagement = artifacts.require("ProjectManagement");
const truffleAssert = require("truffle-assertions");

contract("ProjectManagement", (accounts) => {
  let projectManagementInstance;

  before(async () => {
    projectManagementInstance = await ProjectManagement.deployed();
  });

  it("should create a task and assign it to multiple members", async () => {
    const taskName = "Example Task";
    const assignedTo = [accounts[1], accounts[2], accounts[3]];
    const difficultyLevel = 3;

    const result = await projectManagementInstance.createTask(taskName, assignedTo, difficultyLevel);

    // Assert task creation event
    truffleAssert.eventEmitted(result, "TaskCreated", (ev) => {
      return ev.taskName === taskName && ev.assignedTo.length === assignedTo.length && ev.difficultyLevel === difficultyLevel;
    });

    // Assert task details
    const task = await projectManagementInstance.tasks(1);
    assert.equal(task.taskName, taskName);
    assert.deepEqual(task.assignedTo, assignedTo);
    assert.equal(task.difficultyLevel, difficultyLevel);
  });

  it("should request task completion and approve it", async () => {
    await projectManagementInstance.requestTaskCompletion(1, { from: accounts[1] });

    // Assert task approval requested event
    const result1 = await projectManagementInstance.approveTaskCompletion(1);
    truffleAssert.eventEmitted(result1, "TaskApprovalRequested");

    // Assert task completion and reward claimed events
    const result2 = await projectManagementInstance.approveTaskCompletion(1);
    truffleAssert.eventEmitted(result2, "TaskCompleted");
    truffleAssert.eventEmitted(result2, "RewardClaimed");

    // Assert task completed and reward fragments updated
    const task = await projectManagementInstance.tasks(1);
    assert.equal(task.completed, true);

    const totalFragments = await projectManagementInstance.getTotalFragments();
    assert.equal(totalFragments, 4);

    const ownedFragments = await projectManagementInstance.getOwnedFragments(accounts[1]);
    assert.equal(ownedFragments, 4);
  });

  it("should delete a task", async () => {
    const result = await projectManagementInstance.deleteTask(1);

    // Assert task deleted event
    truffleAssert.eventEmitted(result, "TaskDeleted");

    // Assert task does not exist
    const task = await projectManagementInstance.tasks(1);
    assert.equal(task.taskId, 0);
  });
});
