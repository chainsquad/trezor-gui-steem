const options = {
    apis: ['database_api', 'network_broadcast_api'],
    debug: false,
    statusCallback: function(e) {status = e;}
};
var status;
var {Client} = require('steem-rpc');
var Api = Client.get(options, true);

export default class api {

    static connect() {
        return Api.initPromise.then(res => {
            console.log(res);
        });
    }

    static login() {
        return new Promise((res, rej) => {
            setTimeout(res, 1000);
        });
    }

    static getAccount(name) {
        return Api.database_api().exec('get_accounts', [[name]]);
    }

    static getAccountReference(pubkey) {
        return Api.database_api().exec('get_key_references', [[pubkey]]);
    }

    static getDynObject() {
        return Api.database_api().exec('get_dynamic_global_properties', []);
    }





}
