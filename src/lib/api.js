const options = {
    apis: ['database_api', 'network_broadcast_api'],
    debug: false,
    statusCallback: function(e) {status = e;}
};
var status;
var {Client} = require('steem-rpc');
var {ops} = require('steemjs-lib');

let instance;

class api {
    constructor() {
        if (instance) {
            return instance;
        }

        this.Api = Client.get(options, true);
        instance = this;
    }

    connect() {
        return this.Api.initPromise.then(res => {
            this.db_api = this.Api.database_api();
        });
    }

    login() {
        return new Promise((res, rej) => {
            setTimeout(res, 1000);
        });
    }

    getAccount(name) {
        return this.db_api.exec('get_accounts', [[name]]);
    }

    getAccountReference(pubkey) {
        return this.db_api.exec('get_key_references', [[pubkey]]);
    }

    getDynObject() {
        return this.db_api.exec('get_dynamic_global_properties', []);
    }

    transfer(op, signature) {
        let operations = [[
            "transfer",
            ops.transfer.toObject({
                from: op.from,
                to: op.to,
                amount: ( op.amount / 1000 ).toFixed(3) + " " + op.asset,
                memo: ""
            })
        ]];

        let tr_object = ops.signed_transaction.toObject({
            operations,
            signatures: [signature],
            expiration: new Date(op.expiration * 1000).toISOString().replace(".000Z", ""),
            ref_block_num: op.ref_block_num,
            ref_block_prefix: op.ref_block_prefix
        });

        console.log(JSON.stringify(tr_object));
        return this.Api.network_broadcast_api()
        .exec( "broadcast_transaction_with_callback", [null, tr_object]).then(res => {
            console.log("res:", res);
        }).catch(err => {
            console.error("broadcast error:", err);
        })
    }
}

export default new api();
