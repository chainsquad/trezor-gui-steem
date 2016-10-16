import React, { Component } from 'react';
import api from "./lib/api";
import trezorApi from "./lib/trezorApi";

export default class Setup extends Component {
    constructor() {
        super();

        this.state = {
            belongsTo: null
        };
    }

    lookupAccount(account) {
        api.getAccount(account).then(res => {
            console.log("account lookup:", res[0]);
        });
    }

    checkPubkey() {
        api.getAccountReference(trezorApi.getPubKeys()).then(res => {
            console.log("account:", res);
            this.setState({
                belongsTo: res[0][0]
            });
        })
    }

    componentDidMount() {
        this.checkPubkey();
    }

    render() {
        return (
            <div>
                <div className="col-xs-8 col-xs-offset-2">
                    <h1>Steem Trezor Setup</h1>

                    <p>In order to start using your Trezor you first need to update the account authority settings of your account.</p>
                    <p>Please enter the name of the account you want to use and the password of that account, and we will update the account as required.</p>

                    <br/>

                    <div>Your pubkey: <strong>{trezorApi.getPubKeys()}</strong></div>
                    <br/>
                    {this.state.belongsTo ? <div>This key belongs to: <strong>{this.state.belongsTo}</strong></div> : null}
                    <br/>
                    <br/>
                </div>


                <form className="col-xs-8 col-xs-offset-2">

                    <div className="form-group">
                        <label>Use key with account:</label>
                        <input className="form-control" type="text" onBlur={(e) => {this.lookupAccount(e.target.value);}}/>
                    </div>

                    <div className="form-group">
                        <label>Password/private key:</label>
                        <input className="form-control" type="password" />
                    </div>

                    <button type="submit" className="btn btn-default">Submit</button>

                </form>

            </div>
        );
    }
}
