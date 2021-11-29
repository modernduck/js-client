import Api from "arweave/node/lib/api";
import { AxiosResponse } from "axios";
import BigNumber from "bignumber.js";
export default class WalletConnectUtils {
    public api: Api;
    constructor(api: Api) {
        this.api = api;
    };

    /**
     * Throws an error if the provided axios reponse has a status code != 200
     * @param res an axios response
     * @returns nothing if the status code is 200
     */
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public static checkAndThrow(res: AxiosResponse, context?: string) {
        if (res?.status && res.status != 200) {
            throw new Error(`HTTP Error: ${context}: ${res.status} ${JSON.stringify(res.data)}`);

        }
        return;
    }

    /**
     * Gets the nonce used for withdrawl request validation from the bundler
     * @returns nonce for the current user
     */
    public async getNonce(address:string): Promise<number> {
        const res = await this.api.get(`/account/withdrawals/matic?address=${address}`);
        WalletConnectUtils.checkAndThrow(res, "Getting withdrawal nonce");
        return (res).data;
    }

    /**
     * Gets the balance on the current bundler for the specified user
     * @param address the user's address to query
     * @returns the balance in winston
     */
    public async getBalance(address: string): Promise<number> {
        const res = await this.api.get(`/account/balance/matic?address=${address}`);
        WalletConnectUtils.checkAndThrow(res, "Getting balance");
        return res.data.balance;
    }

    /**
     * Queries the bundler to get it's address for a specific currency
     * @returns the bundler's address
     */
    public async getBundlerAddress(currency = "matic"): Promise<string> {

        const res = await this.api.get("/info")
        WalletConnectUtils.checkAndThrow(res, "Getting Bundler address");
        const address = res.data.addresses[currency]
        if (!address) {
            throw new Error(`Specified bundler does not support currency ${currency}`);
        }
        return address;
    }

    public async getStorageCost(currency: string, bytes: number): Promise<BigNumber> {
        const res = await this.api.get(`/price/${currency}/${bytes}`)
        WalletConnectUtils.checkAndThrow(res, "Getting storage cost");
        return new BigNumber((res).data);
    }
}
