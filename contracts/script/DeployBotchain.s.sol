// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PocketDAOFactory} from "../src/PocketDAOFactory.sol";

contract DeployBotchain is Script {
    function run() external returns (PocketDAOFactory factory) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        factory = new PocketDAOFactory();
        vm.stopBroadcast();
        console2.log("PocketDAOFactory deployed at", address(factory));
    }
}
