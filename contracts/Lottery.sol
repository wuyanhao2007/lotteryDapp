// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

error NotEnoughEth();
error LotteryNotOpen();
error TransferFailed();

contract Lottery is VRFConsumerBaseV2 {
    enum LotteryState { OPEN, CALCULATING }
    address public owner;
    address payable[] public players;
    LotteryState public lotteryState;
    address public recentWinner;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint64 private immutable subscriptionId;
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    event LotteryEnter(address indexed player);
    event RequestedRandomness(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        owner = msg.sender;
        lotteryState = LotteryState.OPEN;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    function enter() public payable {
        if (lotteryState != LotteryState.OPEN) revert LotteryNotOpen();
        if (msg.value < 0.01 ether) revert NotEnoughEth();
        players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function endLottery() external {
        require(msg.sender == owner, "Only owner can end lottery");
        if (lotteryState != LotteryState.OPEN) revert LotteryNotOpen();
        lotteryState = LotteryState.CALCULATING;
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            1
        );
        emit RequestedRandomness(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        uint256 index = randomWords[0] % players.length;
        address winnerAddr = players[index];
        recentWinner = winnerAddr;
        players = new address payable[](0);
        (bool success, ) = payable(winnerAddr).call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
        lotteryState = LotteryState.OPEN;
        emit WinnerPicked(winnerAddr);
    }

    function getPlayers() external view returns (address payable[] memory) {
        return players;
    }
}