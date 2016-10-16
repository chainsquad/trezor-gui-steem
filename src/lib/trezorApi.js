var trezor = require('./trezor.js');
var hardeningConstant = 0x80000000;
import {PublicKey} from "steemjs-lib";
import api from "./api";

let instance;
class TrezorApi {

    constructor() {
        if (!instance) {
            instance = this;
        }
        this.pubkey = "039f3530fe86bdf592f63fb3ae80aeaac88e9c5ef5bce36bf49a596961206fd542";
        this.list = null;
        return instance;
    }

    connect() {
        return new Promise((res, rej) => {

            res();
            this.list = new trezor.DeviceList({debug: false});

            this.list.on('connect', (device) => {
                this.device = device;
                console.log("device:", device);
                console.log('Connected a device:', device);
                console.log('Devices:', this.list.asArray());

                device.on('disconnect', function () {
                    console.log('Disconnected an opened device');
                });

                device.on('button', buttonCallback);
                device.on('passphrase', passphraseCallback);
                device.on('pin', pinCallback);

                device.on('error', (err) => {
                    rej(err);
                })

                // You generally want to filter out devices connected in bootloader mode:
                if (device.isBootloader()) {
                   throw new Error('Device is in bootloader mode, re-connected it');
                }

                device.waitForSessionAndRun(function (session) {
                    return session.getSteemPubkey([], false);
                })
                .then((result) => {
        		    // "039f3530fe86bdf592f63fb3ae80aeaac88e9c5ef5bce36bf49a596961206fd542"
            		this.pubkey = result.message.pubkey;
                })
            });
        })

        if (window) {
            window.onbeforeunload = function() {
                this.list.onbeforeunload();
            }
        }
    }

    getPubKeys() {
        // TODO: get root seed pubkey instead of asking for evey pubkey
        return PublicKey.fromHex(this.pubkey).toString();
    }

    transfer(op) {
        return new Promise((res, rej) => {
            api.getDynObject().then(obj => {
                console.log("dyn obj", obj, "operation:", op);
                let head_block_time_string = timeStringToDate( obj.time );
                var head_block_sec = Math.ceil(head_block_time_string.getTime() / 1000);
                var now_sec = Math.ceil(Date.now() / 1000);

                // If the user's clock is very far behind, use the head block time.
                let base_expire = (now_sec - head_block_sec > 30) ? head_block_sec : Math.max(now_sec, head_block_sec);

                let expiration = base_expire + 60; // head block + 1 minute

                let finalOp = {
                    ...op,
                    ref_block_prefix: new Buffer(obj.head_block_id, 'hex').readUInt32LE(4),
                    ref_block_number: obj.head_block_number & 0xFFFF,
                    expiration
                };

                console.log("final op:", finalOp, this);

                if (!this.device) {
                    throw new Error("You need to be connected to your Trezor");
                }

                this.device.waitForSessionAndRun(function (session) {
                    return session.steemTransfer(
                        finalOp.from,
                        finalOp.to,
                        finalOp.amount,
                        finalOp.asset,
                        finalOp.memo,
                        finalOp.ref_block_number,
                        finalOp.ref_block_prefix,
                        finalOp.expiration
                    );
                })
                .then((result) => {
                    console.log("transfer result:", result);

                    api.transfer(op, result).then(res => {
                        console.log("transfer result:", res);
                    }).catch(err => {
                        console.error("transfer error:", err);
                    })
                    // this.pubkey = result.message.pubkey;
                }).catch(err => {
                    console.log("err:", err);
                });
            })
        })

    }
}

export default new TrezorApi();


function timeStringToDate(time_string) {
    if( ! time_string) return new Date("1970-01-01T00:00:00.000Z")
    if( ! /Z$/.test(time_string)) //does not end in Z
        // https://github.com/cryptonomex/graphene/issues/368
        time_string = time_string + "Z"
    return new Date(time_string)
}

/*
// DeviceList encapsulates transports, sessions, device enumeration and other
// low-level things, and provides easy-to-use event interface.


list.on('connect', function (device) {
    console.log('Connected a device:', device);
    console.log('Devices:', list.asArray());

    // What to do on user interactions:






    // low level API
    device.waitForSessionAndRun(function (session) {
        console.log("I will call now.");

        return session.typedCall("GetEntropy", "Entropy", {size: 10}).then(entropy => {
            console.log("I have called now.");
            console.log("Random hex-string is " + entropy.message.entropy);
        });
    }).then(function() {

        // high level API
        // Ask the device to show first address of first account on display and return it
        device.waitForSessionAndRun(function (session) {
            return session.getAddress([
                (44 | hardeningConstant) >>> 0,
                (0 | hardeningConstant) >>> 0,
                (0 | hardeningConstant) >>> 0,
                0,
                0
            ], 'bitcoin', true)
        })
        .then(function (result) {
            console.log('Address:', result.message.address);
        })
    })
    .catch(function (error) {
        // Errors can happen easily, i.e. when device is disconnected or request rejected
        // Note: if there is general error handler, that listens on device.on('error'),
        // both this and the general error handler gets called
        console.error('Call rejected:', error);
    });
});

// Note that this is a bit duplicate to device.on('disconnect')
list.on('disconnect', function (device) {
    console.log('Disconnected a device:', device);
    console.log('Devices:', list.asArray());
});

// This gets called on general error of the devicelist (no transport, etc)
list.on('error', function (error) {
    console.error('List error:', error);
});

// On connecting unacquired device
list.on('connectUnacquired', function (device) {
    askUserForceAcquire(function() {
        device.steal().then(function() {
            console.log("steal done. now wait for another connect");
        });
    });
});

// an example function, that asks user for acquiring and
// calls callback if use agrees
// (in here, we will call agree always, since it's just an example)
function askUserForceAcquire(callback) {
    return setTimeout(callback, 1000);
}

/**
 * @param {string}
 */
function buttonCallback(code) {
    console.log('User is now asked for an action on device', code);
    // We can (but don't necessarily have to) show something to the user, such
    // as 'look at your device'.
    // Codes are in the format ButtonRequest_[type] where [type] is one of the
    // types, defined here:
    // https://github.com/trezor/trezor-common/blob/master/protob/types.proto#L78-L89
}

/**
 * @param {Function<Error, string>} callback
 */
function passphraseCallback(callback) {
    // We can respond with empty passphrase if we want, or ask the user.
    callback(null, '');
}

/**
 * @param {string} type
 * @param {Function<Error, string>} callback
 */
function pinCallback(type, callback) {
    // We should ask the user for PIN and send back number positions encoded as string '1234'.
    // Where 1 is the bottom left position, 7 is the top left position, etc.
    // 7 8 9
    // 4 5 6
    // 1 2 3
    throw new Error('Nothing defined');
}

// you should do this to release devices on reload
