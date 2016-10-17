import React, { Component } from 'react';
import api from "./lib/api";
import trezorApi from "./lib/trezorApi";

export default class Setup extends Component {
    constructor() {
        super();

        this.state = {
            belongsTo: null,
            toAccount: null,
            amount: 0,
            asset: "SBD",
            memo: null
        };
    }

    lookupAccount(account) {
        api.getAccount(account).then(res => {
            if (res && res[0]) {
            console.log("account lookup:", res[0]);
                this.setState({
                        toAccount: res[0].name
                });
            }
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

    onSubmit(e) {
        e.preventDefault();
        let amount = Math.floor(this.state.amount * 1000);
        trezorApi.transfer({
            to: this.state.toAccount,
            from: this.state.belongsTo,
            amount,
            asset: this.state.asset,
            memo: this.state.memo
        });
    }

    render() {
        let {toAccount} = this.state;

        return (
            <div>
                <div className="col-xs-8 col-xs-offset-2">
                    <h1>Steem Transfer</h1>

                    <div>Your Trezor's Public Key: <strong>{trezorApi.getPubKeys()}</strong></div>
                    <br/>
                    {this.state.belongsTo ? <div>This key belongs to: <strong>{this.state.belongsTo}</strong></div> : null}
                    <br/>
                    <br/>
                </div>


                <form noValidate onSubmit={this.onSubmit.bind(this)} className="col-xs-8 col-xs-offset-2">

                    <div className={"form-group has-feedback" + (!!toAccount ? " has-success" : "")}>
                        <label>Transfer to:</label>
                        <input className="form-control" type="text" onBlur={(e) => {this.lookupAccount(e.target.value);}}/>
                        {!!toAccount  ? <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span> : null}
                    </div>

                    <div className="form-group">
                        <label>Amount:</label>
                        <div className="input-group">
                            <div className="input-group-addon">{this.state.asset}</div>
                            <input className="form-control" onChange={(e) => {this.setState({amount: e.target.value});}} type="number" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Memo: (optional)</label>

                        <input className="form-control" onChange={(e) => {this.setState({memo: e.target.value});}} type="number" />

                    </div>

                    <button type="submit" className="btn btn-default">Submit</button>

                </form>

            </div>
        );
    }
}
