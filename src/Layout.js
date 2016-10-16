import React from 'react';
import api from './lib/api';
import trezorApi from "./lib/trezorApi";

export default class Layout extends React.Component {
    constructor() {
        super();

        this.state = {
            wsConnected: false,
            trezorConnected: false
        }
    }

    componentWillMount() {
        api.connect().then(() => {
            console.log("now connected");
            this.setState({
                wsConnected: true
            });
        })
        trezorApi.connect().then(res => {
            this.setState({
                trezorConnected: true
            });
            console.log('connected');
            let pubKey = trezorApi.getPubKeys();
            console.log("got pubKey", pubKey);
        }).catch(err => {
            console.log("trezor api error:", err);
        })
    }

    render() {
        let {children} = this.props;
        let {wsConnected, trezorConnected} = this.state;

        return (
            <div className="container-fluid">
                {!wsConnected ? <div>Connecting to wss://steem.node.ws</div> : children}
            </div>
        )
    }
}
