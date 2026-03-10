import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv"

dotenv.config()

const PRC_URL = process.env.RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: PRC_URL,
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
    }
  }
};

export default config;
