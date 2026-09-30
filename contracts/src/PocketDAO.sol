// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PocketDAO
/// @notice A deliberately small shared BOT treasury with fixed-period majority voting.
contract PocketDAO {
    struct Proposal {
        address payable recipient;
        uint256 amount;
        uint64 deadline;
        uint32 yesVotes;
        uint32 noVotes;
        uint256 requiredYesVotes;
        bool executed;
        string description;
    }

    string public name;
    address public immutable creator;
    uint64 public immutable votingPeriod;
    uint256 public memberCount;
    uint256 public proposalCount;

    mapping(address => bool) public isMember;
    address[] private memberList;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 private locked = 1;

    event Deposited(address indexed from, uint256 amount);
    event MemberAdded(address indexed member);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed recipient,
        uint256 amount,
        uint256 deadline,
        string description
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);

    error CreatorOnly();
    error MemberOnly();
    error InvalidMember();
    error AlreadyMember();
    error InvalidVotingPeriod();
    error InvalidProposal();
    error InvalidRecipient();
    error InvalidAmount();
    error VotingClosed();
    error VotingStillOpen();
    error AlreadyVoted();
    error AlreadyExecuted();
    error ProposalRejected();
    error InsufficientTreasury();
    error TransferFailed();
    error ReentrantCall();

    modifier onlyCreator() {
        if (msg.sender != creator) revert CreatorOnly();
        _;
    }

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert MemberOnly();
        _;
    }

    modifier nonReentrant() {
        if (locked != 1) revert ReentrantCall();
        locked = 2;
        _;
        locked = 1;
    }

    constructor(
        string memory daoName,
        address daoCreator,
        address[] memory initialMembers,
        uint64 period
    ) payable {
        if (daoCreator == address(0)) revert InvalidMember();
        if (period < 1 hours || period > 30 days) revert InvalidVotingPeriod();

        name = daoName;
        creator = daoCreator;
        votingPeriod = period;
        _addMember(daoCreator);

        for (uint256 i; i < initialMembers.length; ++i) {
            if (!isMember[initialMembers[i]]) _addMember(initialMembers[i]);
        }

        if (msg.value > 0) emit Deposited(msg.sender, msg.value);
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        if (msg.value == 0) revert InvalidAmount();
        emit Deposited(msg.sender, msg.value);
    }

    function addMember(address account) external onlyCreator {
        _addMember(account);
    }

    function createProposal(
        address payable recipient,
        uint256 amount,
        string calldata description
    ) external onlyMember returns (uint256 proposalId) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        proposalId = proposalCount++;
        uint64 deadline = uint64(block.timestamp) + votingPeriod;
        proposals[proposalId] = Proposal({
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            yesVotes: 0,
            noVotes: 0,
            requiredYesVotes: approvalThreshold(),
            executed: false,
            description: description
        });

        emit ProposalCreated(proposalId, msg.sender, recipient, amount, deadline, description);
    }

    function vote(uint256 proposalId, bool support) external onlyMember {
        Proposal storage proposal = _proposal(proposalId);
        if (block.timestamp >= proposal.deadline) revert VotingClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;
        if (support) proposal.yesVotes += 1;
        else proposal.noVotes += 1;

        emit VoteCast(proposalId, msg.sender, support);
    }

    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = _proposal(proposalId);
        if (block.timestamp < proposal.deadline) revert VotingStillOpen();
        if (proposal.executed) revert AlreadyExecuted();
        if (proposal.yesVotes < proposal.requiredYesVotes) revert ProposalRejected();
        if (address(this).balance < proposal.amount) revert InsufficientTreasury();

        proposal.executed = true;
        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        if (!success) revert TransferFailed();

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        Proposal memory proposal = proposals[proposalId];
        if (proposal.recipient == address(0)) revert InvalidProposal();
        return proposal;
    }

    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function approvalThreshold() public view returns (uint256) {
        return (memberCount / 2) + 1;
    }

    function proposalPassed(uint256 proposalId) external view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        if (proposal.recipient == address(0)) revert InvalidProposal();
        return proposal.yesVotes >= proposal.requiredYesVotes;
    }

    function _proposal(uint256 proposalId) private view returns (Proposal storage proposal) {
        proposal = proposals[proposalId];
        if (proposal.recipient == address(0)) revert InvalidProposal();
    }

    function _addMember(address account) private {
        if (account == address(0)) revert InvalidMember();
        if (isMember[account]) revert AlreadyMember();
        isMember[account] = true;
        memberList.push(account);
        memberCount += 1;
        emit MemberAdded(account);
    }
}
