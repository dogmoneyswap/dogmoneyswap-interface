import { ChainId } from "@dogmoneyswap/sdk";
// import LPToken from "../types/LPToken";
import { ethers } from "ethers";
import { BigNumber } from '@ethersproject/bignumber'
import { getGasPrice } from '../functions/trade'
import { signERC2612Permit } from "eth-permit";
import { useActiveWeb3React } from "../hooks/useActiveWeb3React";
import { useCallback } from "react";
import { useSushiRollContract } from "../hooks/useContract";

const useSushiRoll = (version: "v1" | "v2" = "v2") => {
  const { chainId, library, account } = useActiveWeb3React();
  const sushiRoll = useSushiRollContract(/*version*/);
  const ttl = 60 * 20;

  let from = "";

  if (chainId === ChainId.SMARTBCH) {
    from = "BenSwap";
  } else if (chainId === ChainId.SMARTBCH_AMBER) {
    from = "BenSwap";
  }

  const migrate = useCallback(
    async (lpToken: any /*LPToken*/, amount: BigNumber) => {
      if (sushiRoll) {
        const deadline = Math.floor(new Date().getTime() / 1000) + ttl;
        const args = [
          lpToken.tokenA.address,
          lpToken.tokenB.address,
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero,
          deadline,
        ];

        const gasLimit = await sushiRoll.estimateGas.migrate(...args);
        const tx = sushiRoll.migrate(...args, {
          gasLimit: gasLimit.mul(120).div(100),
          gasPrice: getGasPrice(),
        });

        return tx;
      }
    },
    [sushiRoll, ttl, from]
  );

  const migrateWithPermit = useCallback(
    async (lpToken: any /*LPToken*/, amount: BigNumber) => {
      if (account && sushiRoll) {
        const deadline = Math.floor(new Date().getTime() / 1000) + ttl;
        const permit = await signERC2612Permit(
          library,
          lpToken.address,
          account,
          sushiRoll.address,
          amount.toString(),
          deadline
        );
        const args = [
          lpToken.tokenA.address,
          lpToken.tokenB.address,
          amount,
          ethers.constants.Zero,
          ethers.constants.Zero,
          deadline,
          permit.v,
          permit.r,
          permit.s,
        ];

        const gasLimit = await sushiRoll.estimateGas.migrateWithPermit(...args);
        const tx = await sushiRoll.migrateWithPermit(...args, {
          gasLimit: gasLimit.mul(120).div(100),
          gasPrice: getGasPrice(),
        });

        return tx;
      }
    },
    [account, library, sushiRoll, ttl, from]
  );

  return {
    migrate,
    migrateWithPermit,
  };
};

export default useSushiRoll;
