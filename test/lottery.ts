import {expect} from "chai"
import {ethers} from "hardhat"
import { Contract } from "ethers"

describe("Lottery", function() {
    let lottery: Contract
    let owner: any
    let player1: any
    let player2: any

    this.beforeEach(async function() {
        const Lottery = await ethers.getContractFactory("Lottery")
        lottery = await Lottery.deploy()
        await lottery.deployed()
        const accounts = await ethers.getSigners()
        owner = accounts[0]
        player1 = accounts[1]
        player2 = accounts[2]
    })

    describe("constructor", function() {
        it("owner should be sender", async function() {
            expect(await lottery.owner()).to.equal(owner.address)
        })
    })

    describe("enter", function(){
        it("should allow player to enter", async function(){
        await lottery.connect(player1).enter({
            value: ethers.utils.parseEther("0.02")
        })
        const players = await lottery.getPlayers()
        expect(players[0]).to.equal(player1.address)
    })

        it("should fail if not enough ETH", async function () {
            await expect(lottery.connect(player1).enter({
                value: ethers.utils.parseEther("0.0001")
            })).to.be.reverted
        })
    })

    describe("pickWinner", function(){
        it("should only allow owner", async function () {
            await lottery.connect(player1).enter({
            value: ethers.utils.parseEther("0.02")
            })
            await expect(lottery.connect(player1).pickWinner()).to.be.reverted
        })
        it("should send money to winner", async function () {
            await lottery.connect(player1).enter({
            value: ethers.utils.parseEther("0.02")
            })
            await lottery.connect(player2).enter({
                value: ethers.utils.parseEther("0.02")
            })
            const startPlayer1Balance = await ethers.provider.getBalance(player1.address)
            const startPlayer2Balance = await ethers.provider.getBalance(player2.address)
            await lottery.pickWinner()
            const endPlayer1Balance = await ethers.provider.getBalance(player1.address)
            const endPlayer2Balance = await ethers.provider.getBalance(player2.address)
            expect(endPlayer1Balance.gt(startPlayer1Balance) 
                || endPlayer2Balance.gt(startPlayer2Balance)).to.be.true

        })
        it("should reset players", async function(){

            await lottery.connect(player1).enter({

            value: ethers.utils.parseEther("0.02")

            })

            await lottery.pickWinner()

            const players = await lottery.getPlayers()

            expect(players.length).to.equal(0)
            })
    }) 
})