var trezor = require('./trezor_original.js');
var hardeningConstant = 0x80000000;
import {PublicKey} from "steemjs-lib";
import api from "./api";

let DISCONNECTED = 0x00;
let CONNECTED = 0x01;
let NEEDS_PIN = 0x02;
let UNLOCKED = 0x04;

let instance;
class TrezorApi {

    constructor() {
        if (!instance) {
            instance = this;
        }
        this.pubkey = "039f3530fe86bdf592f63fb3ae80aeaac88e9c5ef5bce36bf49a596961206fd542";
        this.list = null;
        this.status = 0x00;

        window.addEventListener("message", (message, a) => {
            console.log("message:", message, a)
        })
        return instance;
    }

    connect(cb) {
        this.list = new trezor.DeviceList({debug: false});

        // This gets called on general error of the devicelist (no transport, etc)
        this.list.on('error', function (error) {
            console.error('List error:', error);
        });

        this.list.on('connect', (device) => {
            device.clearSession = true;
            this.status += CONNECTED;
            if (device.features.pin_cached) {
                this.status += UNLOCKED;
            }
            this.device = device;
            console.log("Connected device:", device, "status:", this.status);
            // console.log('Connected a device:', device);
            // console.log('Devices:', this.list.asArray());

            device.on('disconnect', () => {
                console.log('Disconnected an opened device');
                this.status = DISCONNECTED;
                if (cb) {
                    cb(this.status);
                }
            });

            device.on('button', buttonCallback);
            device.on('passphrase', passphraseCallback);
            device.on('pin', (type, callback) => {
                console.log("pin");
                this.status += NEEDS_PIN;
                this.pinCallback = callback;
                // We should ask the user for PIN and send back number positions encoded as string '1234'.
                // Where 1 is the bottom left position, 7 is the top left position, etc.
                // 7 8 9
                // 4 5 6
                // 1 2 3
            });

            device.on('error', (err) => {
                console.log("device error:", err);
            });

            device.on('receive', (e, b) => {
                console.log("receive", e, b);
            });

            let handleReceive = (type, code) => {
                switch (code.message) {
                    case "Invalid PIN":
                        console.log("invalid pin");
                        break;
                }
            }

            // You generally want to filter out devices connected in bootloader mode:
            if (device.isBootloader()) {
               throw new Error('Device is in bootloader mode, re-connected it');
            }

            device.waitForSessionAndRun((session) => {
                // return session.getSteemPubkey([], false);
                return session.getAddress([
                    (44 | hardeningConstant) >>> 0,
                    (0 | hardeningConstant) >>> 0,
                    (0 | hardeningConstant) >>> 0,
                    0,
                    0
                ], 'bitcoin', false);
            })
            .then((result) => {
                if (!(this.status & UNLOCKED)) this.status += UNLOCKED;

                if (cb) {
                    cb(this.status);
                }
                console.log("session result:", result);
                if (result && result.message) {
        		    // "039f3530fe86bdf592f63fb3ae80aeaac88e9c5ef5bce36bf49a596961206fd542"
            		this.pubkey = result.message.pubkey;
                }
            });

            if (cb) {
                cb(this.status);
            }

        });


        if (window) {
            window.onbeforeunload = () => {
                this.list.onbeforeunload();
            }
        }
    }

    getPubKeys() {
        // TODO: get root seed pubkey instead of asking for evey pubkey
        return PublicKey.fromHex(this.pubkey).toString();
    }

    sendPin(pin) {
        console.log("sendPin:", pin, "pinCallback", this.pinCallback);

        if (this.pinCallback) {
            this.pinCallback(null, pin);
        }
        this.pinCallback = null;
        // this.device.
    }

    transfer(op) {
        return new Promise((res, rej) => {
            api.getDynObject().then(obj => {
                // console.log("dyn obj", obj, "operation:", op);
                let head_block_time_string = timeStringToDate( obj.time );
                var head_block_sec = Math.ceil(head_block_time_string.getTime() / 1000);
                var now_sec = Math.ceil(Date.now() / 1000);
                // If the user's clock is very far behind, use the head block time.
                let base_expire = (now_sec - head_block_sec > 30) ? head_block_sec : Math.max(now_sec, head_block_sec);

                let expiration = base_expire + 30; // head block + 30 secs
                // console.log("head block", head_block_time_string, "now_sec", now_sec, "delta", now_sec - head_block_sec);

                let finalOp = {
                    ...op,
                    ref_block_prefix: new Buffer(obj.head_block_id, 'hex').readUInt32LE(4),
                    ref_block_num: obj.head_block_number & 0xFFFF,
                    expiration
                };

                // console.log("final op:", finalOp);

                // TEMP
                api.transfer(finalOp, "azdazd").then(res => {

                });

                // /TEMP
                if (!this.device) {
                    throw new Error("You need to be connected to your Trezor");
                }

                this.device.waitForSessionAndRun(function (session) {
                    session.clearSession();
                    return session.steemTransfer(
                        finalOp.from,
                        finalOp.to,
                        finalOp.amount,
                        finalOp.asset,
                        finalOp.memo,
                        finalOp.ref_block_num,
                        finalOp.ref_block_prefix,
                        finalOp.expiration
                    );
                })
                .then((result) => {
                    console.log("transfer result:", result);
                    if (result && result.message) {
                        api.transfer(finalOp, result.message.signature).then(res => {
                            console.log("transfer result:", res);
                        }).catch(err => {
                            console.error("transfer error:", err);
                        })
                    }
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



// you should do this to release devices on reload
