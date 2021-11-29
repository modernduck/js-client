import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { IInternalEvent } from "@walletconnect/types";
import Api, { ApiConfig } from "arweave/node/lib/api";
import { JWKInterface } from "arweave/node/lib/wallet";
import WalletConnectUtils from "./walletConnectUtils";
import { withdrawBalance } from "./withdrawal";
import Uploader from "./upload";
import Fund from "./fund";
import { AxiosResponse } from "axios";
import BigNumber from "bignumber.js";
// import Arweave from "arweave";
import { maticCreateTx, maticCreateTxParams, maticGetFee } from "./currencies/matic";
import { DataItemCreateOptions } from "arbundles";
import BundlrTransaction from "./transaction";

let currencies;

export let arweave;
export const keys: { [key: string]: { key: string, address: string } } = {};

export default class BundlrWallet {
    public api: Api;
    public utils: WalletConnectUtils;
    public uploader: Uploader;
    public funder: Fund;
    public address: string;
    public currency:string;
    public connector:WalletConnect;

    /**
     * Constructs a new Bundlr instance, as well as supporting subclasses
     * @param url - URL to the bundler
     * @param wallet - JWK in JSON
     */
    constructor(url: string, connector:WalletConnect) {
        // hacky for the moment...
        // specifically about ordering - some stuff here seems silly but leave it for now it works
        //TODO !!! need to change this to proper function
        this.currency = connector.chainId === 137?"matic":"unknown";
        this.connector = connector;
        const parsed = new URL(url);
        this.api = new Api({ ...parsed, host: parsed.hostname }); //borrow their nice Axios API :p
        // if (currency === "arweave") {
        //     //arweave = new Arweave(this.api.getConfig());
        //     arweave = Arweave.init({ host: "arweave.net", protocol: "https", port: 443 });
        // }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        currencies = (require("./currencies/index")).currencies; //delay so that keys object can be properly constructed
        if (!currencies[this.currency]) {
            throw new Error(`Unknown/Unsuported currency ${this.currency}`);
        }
        this.utils = new WalletConnectUtils(this.api);
        this.address = this.connector.accounts[0];
        
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async withdrawBalance(amount) {
        //return await withdrawBalance(this.utils, this.api, amount);
    }

    /**
     * Gets the balance for the loaded wallet
     * @returns balance (in winston)
     */
    async getLoadedBalance(): Promise<number> {
        return this.utils.getBalance(this.address)
    }
    /**
     * Gets the balance for the specified address
     * @param address address to query for
     * @returns the balance (in winston)
     */
    async getBalance(address: string): Promise<number> {
        return this.utils.getBalance(address)
    }
    /**
     * Sends send a sign message to walletConnect 
     * @param amount amount to send in winston
     * @returns Arweave transaction
     */
    async fund(amount: number, multiplier?: number): Promise<any> {
        const to = await this.utils.getBundlerAddress();
        const baseFee = await maticGetFee(new BigNumber(amount), to)
        const fee = (baseFee.multipliedBy(multiplier)).toFixed(0).toString();
        const params = await maticCreateTxParams(amount,to, fee.toString() )
        return this.connector.sendTransaction({
            ...params,
            from:this.address,
            gasLimit:params.gasLimit.toString(),
            gasPrice:params.gasPrice.toString()
        })
    }

    
    /**
     * Upload a file at the specified path to the bundler
     * @param path path to the file to upload
     * @returns bundler response
     */
    async uploadFile(path: string): Promise<AxiosResponse<any>> {
        return this.uploader.uploadFile(path);
    };
    /**
     * Create a new BundlrTransactions (flex currency arbundles dataItem)
     * @param data 
     * @param opts - dataItemCreateOptions
     * @returns - a new BundlrTransaction instance
     */
    /*createTransaction(data: string | Uint8Array, opts?: DataItemCreateOptions): BundlrTransaction {
        return new BundlrTransaction(data, this, opts);
    }*/
}
