const options = {
    apis: ['database_api', 'network_broadcast_api'],
    debug: false,
    statusCallback: function(e) {status = e;}
};
var status;
var {Client} = require('steem-rpc');

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
        let tr = new TransactionBuilder();

        tr.add_type_operation("transfer", {
            from: op.from,
            to: op.to,
            amount: op.amount + " " + op.asset,
            memo: op.memo
        });

        tr.signatures.push(signature);

        return tr.broadcast();
    }
}

export default new api();
