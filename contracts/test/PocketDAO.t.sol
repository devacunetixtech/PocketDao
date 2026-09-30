// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PocketDAO} from "../src/PocketDAO.sol";
import {PocketDAOFactory} from "../src/PocketDAOFactory.sol";

contract PocketDAOTest is Test {
    PocketDAOFactory factory;
    PocketDAO dao;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address recipient = makeAddr("recipient");

    function setUp() public {
        factory = new PocketDAOFactory();
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;

        vm.prank(alice);
        address deployed = factory.createDAO("Builders Guild", members, 3 days);
        dao = PocketDAO(payable(deployed));
        vm.deal(alice, 10 ether);
    }

    function testFactoryCreatesDAOWithMembers() public view {
        assertEq(dao.name(), "Builders Guild");
        assertEq(dao.memberCount(), 3);
        assertTrue(dao.isMember(alice));
        assertTrue(dao.isMember(bob));
        assertTrue(dao.isMember(carol));
        assertEq(dao.approvalThreshold(), 2);
    }

    function testDepositVoteAndExecuteProposal() public {
        vm.prank(alice);
        dao.deposit{value: 5 ether}();

        vm.prank(bob);
        uint256 id = dao.createProposal(payable(recipient), 2 ether, "Community meetup");

        vm.prank(alice);
        dao.vote(id, true);
        vm.prank(bob);
        dao.vote(id, true);

        vm.warp(block.timestamp + 3 days);
        dao.execute(id);

        assertEq(recipient.balance, 2 ether);
        assertEq(dao.treasuryBalance(), 3 ether);
        assertTrue(dao.getProposal(id).executed);
    }

    function testCannotExecuteWithoutAbsoluteMajority() public {
        vm.prank(alice);
        dao.deposit{value: 3 ether}();
        vm.prank(alice);
        uint256 id = dao.createProposal(payable(recipient), 1 ether, "One vote is not enough");
        vm.prank(alice);
        dao.vote(id, true);
        vm.warp(block.timestamp + 3 days);

        vm.expectRevert(PocketDAO.ProposalRejected.selector);
        dao.execute(id);
    }

    function testMemberCannotVoteTwice() public {
        vm.prank(alice);
        uint256 id = dao.createProposal(payable(recipient), 1 ether, "Test vote");
        vm.startPrank(bob);
        dao.vote(id, true);
        vm.expectRevert(PocketDAO.AlreadyVoted.selector);
        dao.vote(id, false);
        vm.stopPrank();
    }

    function testOnlyCreatorCanAddMember() public {
        vm.prank(bob);
        vm.expectRevert(PocketDAO.CreatorOnly.selector);
        dao.addMember(makeAddr("dave"));
    }

    function testProposalThresholdIsSnapshotted() public {
        vm.prank(alice);
        uint256 id = dao.createProposal(payable(recipient), 1 ether, "Stable threshold");
        assertEq(dao.getProposal(id).requiredYesVotes, 2);

        vm.prank(alice);
        dao.addMember(makeAddr("dave"));
        assertEq(dao.approvalThreshold(), 3);
        assertEq(dao.getProposal(id).requiredYesVotes, 2);
    }
}
