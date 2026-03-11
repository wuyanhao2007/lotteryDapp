import { ethers } from "hardhat";
import { expect } from "chai";

describe("Lottery Contract", function () {
  let lottery: any, vrfMock: any, owner: any, addr1: any, addr2: any;

  beforeEach(async () => {
    
    const Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfMock = await Mock.deploy(
      ethers.utils.parseEther("0.25"),
      1e9
    );
    await vrfMock.deployed();
    const tx = await vrfMock.createSubscription();
    const subId = (await tx.wait()).events![0].args.subId;
    await vrfMock.fundSubscription(subId, ethers.utils.parseEther("10"));

    [owner, addr1, addr2] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(
      vrfMock.address,
      ethers.utils.id("someKey"),
      subId
    );
    await lottery.deployed();
    await vrfMock.addConsumer(subId, lottery.address);
  });

  it("should allow a player to enter", async () => {
    await expect(lottery.connect(addr1).enter({ value: ethers.utils.parseEther("0.02") }))
      .to.emit(lottery, "LotteryEnter")
      .withArgs(addr1.address);
    const players = await lottery.getPlayers();
    expect(players[0]).to.equal(addr1.address);
  });

  it("should request randomness and change state", async () => {
    await lottery.connect(addr1).enter({ value: ethers.utils.parseEther("0.02") });
    const tx = await lottery.endLottery();
    await expect(tx).to.emit(lottery, "RequestedRandomness");
    expect(await lottery.lotteryState()).to.equal(1); 
  });

  it("should pick a winner, transfer funds, and reset", async () => {

    await lottery.connect(addr1).enter({
    value: ethers.utils.parseEther("1")
    })

    await lottery.connect(addr2).enter({
    value: ethers.utils.parseEther("1")
    })

    const tx = await lottery.endLottery()
    const receipt = await tx.wait()

    const requestId = receipt.events[1].args.requestId

    await vrfMock.fulfillRandomWords(requestId, lottery.address)

    const winner = await lottery.recentWinner()

    expect([addr1.address, addr2.address]).to.include(winner)

    const winnerBalanceAfter = await ethers.provider.getBalance(winner)

    expect(winnerBalanceAfter).to.be.gt(ethers.utils.parseEther("10000"))

    expect(await lottery.lotteryState()).to.equal(0)

    expect(await lottery.getPlayers()).to.be.empty

    })
});
