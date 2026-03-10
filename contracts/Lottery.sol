// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {

    address public owner;
    address[] public players;

    constructor() {
        owner = msg.sender;
    }

    function enter() public payable {
        require(msg.value >= 0.01 ether, "Not enough ETH");

        players.push(msg.sender);
    }

    function pickWinner() public {

        require(msg.sender == owner, "Only owner");
        require(players.length > 0, "No players");

        uint random = uint(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players.length
                )
            )
        );

        uint index = random % players.length;

        address winner = players[index];

        (bool success, ) = payable(winner).call{value: address(this).balance}("");
        require(success, "Transfer failed");

        players = new address[](0);
    }

    function getPlayers() public view returns(address[] memory){
        return players;
    }
}