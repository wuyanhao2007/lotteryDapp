import {ethers} from "hardhat";
async function main() {
    const [deployer] = await ethers.getSigners()
    console.log("Deploying with:", deployer.address)

    const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFMock.deploy(ethers.utils.parseEther("0.25"), 1e9);
    await vrfMock.deployed();
    console.log("VRFMock:", vrfMock.address);

    const tx = await vrfMock.createSubscription();
    const receipt = await tx.wait();
    const subId = receipt.events![0].args.subId;
    console.log("subId:", subId.toString())

    await vrfMock.fundSubscription(subId, ethers.utils.parseEther("10"));

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(vrfMock.address, ethers.utils.id("keyHash"), subId)
    await lottery.deployed();
    console.log("Lottery deployed:", lottery.address);

    await vrfMock.addConsumer(subId, lottery.address);
    console.log("consumer added")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
