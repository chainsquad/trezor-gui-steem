import React from 'react';
import api from './lib/api';
import trezorApi from "./lib/trezorApi";
import TrezorConnect from "./TrezorConnect";

export default class Layout extends React.Component {
    constructor() {
        super();

        this.state = {
            wsConnected: false,
            trezorConnected: false,
            trezorUnlocked: false
        }
    }

    componentWillMount() {
        // Connect the WS rpc
        api.connect().then(() => {
            console.log("now connected");
            this.setState({
                wsConnected: true
            });
        });

        // Connect to the Trezor
        let trezorConnectionCallback = (status) => {
            console.log('trezor connection status:', status);

            this.setState({
                trezorConnected: !!(status & 0x01),
                trezorPin: !!(status & 0x02),
                trezorUnlocked: !!(status & 0x04)
            });
        }
        trezorApi.connect(trezorConnectionCallback)
    }

    render() {
        let {children} = this.props;
        let {wsConnected, trezorConnected, trezorUnlocked, trezorPin} = this.state;
        console.log("layout status:", this.state);
        return (
            <div className="container-fluid">
                {!trezorConnected || !trezorUnlocked ? <TrezorConnect needsPin={trezorPin} unlocked={trezorUnlocked} connected={trezorConnected} /> : null}
                {!wsConnected ? <div>Connecting to wss://steem.node.ws</div> : children}
            </div>
        )
    }
}
