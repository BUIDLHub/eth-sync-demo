import EthSync from 'eth-sync';
import Snapshot from 'eth-sync-snapshot';
import * as yup from 'yup';

const schema = yup.object().shape({
  abi: yup.array().required("Missing ABI"),
  address: yup.string().required("Missing contract address"),
  rangeStart: yup.number().required("Missing block range start"),
  rangeEnd: yup.number().required("Missing block range end"),
  refreshRate: yup.number().required("Missing callback refresh rate")
});


const KITTY_CORE = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
const KITTY_SNAP_ID = "9NlPQmsBUKbb9uKfcoy2";

export default class AppSyncRunner {
  constructor(props) {
    schema.validateSync(props);
    this.abi = props.abi;
    this.address = props.address;
    this.web3Factory = props.web3Factory;
    this.fromBlock = props.rangeStart-0;
    this.toBlock = props.rangeEnd-0;
    this.includeTxn = props.includeTxn;
    this.includeTime = props.includeTimestamp;
    this.refreshRate = props.refreshRate-0;
    this.useSnapshots = props.useSnapshots;
    this.batch = [];
    this.history = {};

    [
      'start',
      'stop'
    ].forEach(fn=>this[fn]=this[fn].bind(this));
  }

  start(cb) {
    this.running = true;
    this.history = {};
    this.meta = {
      rpcCalls: 0
    };
    let snapper = undefined;
    if(this.useSnapshots && this.address === KITTY_CORE) {
      snapper = new Snapshot({
        snapshotId: KITTY_SNAP_ID
      });
    }
    console.log("Starting run with batch size", this.batch.length);

    let puller = new EthSync({
      web3Factory: this.web3Factory,
      abi: this.abi,
      address: this.address,
      snapshotProvider: snapper
    });
    return new Promise(async (done,err)=>{
      try {
        let web3 = this.web3Factory();
        this.startBlock = await web3.eth.getBlock(this.fromBlock);
        this.endBlock = await web3.eth.getBlock(this.toBlock);

        let handler = async (e,txns, meta)=>{


          if(meta && meta.toBlock !== this.meta.toBlock) {
            this.meta.rpcCalls += meta.rpcCalls;
            this.meta.fromBlock = meta.fromBlock;
            this.meta.toBlock = meta.toBlock;
          }

          for(let i=0;i<txns.length;++i) {
            if(!this.running) {
              break;
            }
            let txn = txns[i];
            /*
            if(this.history[txn.transactionHash.toLowerCase()]) {
              cb(new Error("Duplicate txn detected"));
              continue;
            }

            this.history[txn.transactionHash] = true;
            */

            if(this.includeTxn && (typeof txn.gasUsed === 'undefined')) {
              this.meta.rpcCalls++;
              let rec = await web3.eth.getTransactionReceipt(txn.transactionHash);
              if(rec) {
                txn.receipt = rec;
              }
            }
            this.batch.push(txn);
            if(this.batch.length >= this.refreshRate) {
              await cb(null, this.batch, this.meta);
              this.batch = [];
              this.meta.rpcCalls = 0;
            }
          }//end TXN loop

          if(!this.running && this.batch.length > 0) {
            await cb(null, this.batch, this.meta);
            this.batch = [];
            this.meta.rpcCalls = 0;
          }
        }//end handler

        let cursor = await puller.start({
          fromBlock: this.fromBlock,
          toBlock: this.toBlock
        }, handler);
        let c = cursor;
        while(this.running && c) {
          c = await cursor.nextBatch(handler);
        }
        if(this.batch.length > 0) {
          await cb(null, this.batch, this.meta);
          this.batch = [];
          this.meta.rpcCalls = 0;
        }
        //console.log(JSON.stringify(Object.keys(this.history), null, 2));

        done();
      } catch (e) {
        this.running = false;
        if(this.batch.length > 0) {
          await cb(null, this.batch, this.meta);
          this.batch = [];
        }
        err(e);
      }
    });
  }

  stop() {
    this.running = false;
  }
}
