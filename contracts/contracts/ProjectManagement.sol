// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract ProjectManagement {
    struct Task {
        uint256 taskId;
        string taskName;
        address[] assignedTo;
        bool completed;
        bool approvalRequested;
        uint8 difficultyLevel;
    }

    struct ProjectNFT {
        uint256 nftId;
        string nftName;
        uint256 totalFragmentsAwarded;
    }

    struct ProjectMember {
        bool exists;
        string memberName;
        uint256 fragmentsEarned;
    }

    uint256 public taskCount;
    address public projectOwner;
    uint256 public memberCount;
    address[] public memberAddresses;
    mapping(uint256 => Task) public tasks;
    mapping(address => ProjectMember) public projectMembers;
    ProjectNFT public projectNFT;

    event TaskCreated(uint256 indexed taskId, string taskName, address[] indexed assignedTo, uint8 difficultyLevel);
    event TaskCompleted(uint256 indexed taskId, string taskName);
    event TaskApprovalRequested(uint256 indexed taskId);
    event TaskApproved(uint256 indexed taskId);
    event TaskDeleted(uint256 indexed taskId);
    event MemberAdded(address indexed member);
    event RewardClaimed(address indexed recipient, uint256 fragments);

    constructor() {
        projectOwner = msg.sender;
        projectNFT.nftId = 1;
        projectNFT.nftName = "Project NFT";
        addProjectMember(projectOwner, "Owner");
    }

    modifier onlyProjectOwner() {
        require(msg.sender == projectOwner, "Only the project owner can perform this action");
        _;
    }

    modifier onlyProjectMember() {
        require(projectMembers[msg.sender].exists, "Only project members can perform this action");
        _;
    }

    function addProjectMember(address _member, string memory _memberName) public onlyProjectOwner {
        require(!projectMembers[_member].exists, "Member already exists");
        projectMembers[_member] = ProjectMember(true, _memberName, 0);
        memberAddresses.push(_member);
        memberCount += 1;
        emit MemberAdded(_member);
    }

    function createTask(string memory _taskName, address[] memory _assignedTo, uint8 _difficultyLevel) public onlyProjectOwner {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _taskName, _assignedTo, false, false, _difficultyLevel);
        emit TaskCreated(taskCount, _taskName, _assignedTo, _difficultyLevel);
    }

    function requestTaskCompletion(uint256 _taskId) public onlyProjectMember {
        Task storage task = tasks[_taskId];
        require(task.taskId != 0, "Task does not exist");
        require(isAssignedToTask(task.assignedTo, msg.sender), "You are not assigned to this task");
        require(!task.completed, "Task is already completed");
        require(!task.approvalRequested, "Approval for task completion has already been requested");

        task.approvalRequested = true;
        emit TaskApprovalRequested(_taskId);
    }

    function approveTaskCompletion(uint256 _taskId) public onlyProjectOwner {
        Task storage task = tasks[_taskId];
        require(task.taskId != 0, "Task does not exist");
        require(task.approvalRequested, "Task completion has not been requested");
        require(!task.completed, "Task is already completed");

        task.completed = true;
        task.approvalRequested = false;
        emit TaskCompleted(_taskId, task.taskName);

        uint256 rewardFragments = calculateRewardFragments(task.difficultyLevel);
        distributeRewards(task.assignedTo, rewardFragments);
        projectNFT.totalFragmentsAwarded += rewardFragments;
    }

    function deleteTask(uint256 _taskId) public onlyProjectOwner {
        Task storage task = tasks[_taskId];
        require(task.taskId != 0, "Task does not exist");

        delete tasks[_taskId];
        emit TaskDeleted(_taskId);
    }

    function calculateRewardFragments(uint8 _difficultyLevel) internal pure returns (uint256) {
        require(_difficultyLevel >= 1 && _difficultyLevel <= 5, "Invalid difficulty level");
        return (_difficultyLevel-1)**2;
    }

    function distributeRewards(address[] memory _recipients, uint256 _rewardFragments) internal {
        uint256 rewardAmount = _rewardFragments / _recipients.length;
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            projectMembers[recipient].fragmentsEarned += rewardAmount;
            emit RewardClaimed(recipient, rewardAmount);
        }
    }

    function isAssignedToTask(address[] memory _assignedTo, address _address) internal pure returns (bool) {
        for (uint256 i = 0; i < _assignedTo.length; i++) {
            if (_assignedTo[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function getTotalFragments() public view returns (uint256) {
        return projectNFT.totalFragmentsAwarded;
    }

    function getOwnedFragments(address _user) public view returns (uint256) {
        return projectMembers[_user].fragmentsEarned;
    }    
    
    function getCompletedTasks() public view returns (uint256[] memory) {
        uint256[] memory completedTaskIds = new uint256[](taskCount);
        uint256 completedCount = 0;

        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].completed) {
                completedTaskIds[completedCount] = tasks[i].taskId;
                completedCount++;
            }
        }

        // Resize the array to remove unused elements
        assembly {
            mstore(completedTaskIds, completedCount)
        }

        return completedTaskIds;
    }

    function getPendingTasks() public view returns (uint256[] memory) {
        uint256[] memory pendingTaskIds = new uint256[](taskCount);
        uint256 pendingCount = 0;

        for (uint256 i = 1; i <= taskCount; i++) {
            if (!tasks[i].completed) {
                pendingTaskIds[pendingCount] = tasks[i].taskId;
                pendingCount++;
            }
        }

        // Resize the array to remove unused elements
        assembly {
            mstore(pendingTaskIds, pendingCount)
        }

        return pendingTaskIds;
    }
}
