// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PocketDAO} from "./PocketDAO.sol";

/// @title PocketDAOFactory
/// @notice Deploys discoverable PocketDAO treasuries for connected wallets.
contract PocketDAOFactory {
    address[] private allDAOs;
    mapping(address => address[]) private daosByCreator;

    event DAOCreated(address indexed dao, address indexed creator, string name, uint64 votingPeriod);

    function createDAO(
        string calldata name,
        address[] calldata initialMembers,
        uint64 votingPeriod
    ) external payable returns (address dao) {
        PocketDAO pocketDAO = new PocketDAO{value: msg.value}(
            name,
            msg.sender,
            initialMembers,
            votingPeriod
        );
        dao = address(pocketDAO);
        allDAOs.push(dao);
        daosByCreator[msg.sender].push(dao);
        emit DAOCreated(dao, msg.sender, name, votingPeriod);
    }

    function getAllDAOs() external view returns (address[] memory) {
        return allDAOs;
    }

    function getDAOsByCreator(address account) external view returns (address[] memory) {
        return daosByCreator[account];
    }

    function daoCount() external view returns (uint256) {
        return allDAOs.length;
    }
}
