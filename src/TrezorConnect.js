import React, { Component } from 'react';
import trezorApi from "./lib/trezorApi";

export default class TrezorConnect extends Component {

    constructor() {
        super();

        this.state = {
            pin: ""
        }
    }

    _enterPin(value) {
        this.setState({
            pin: this.state.pin += value
        });
    }

    _deleteEntry() {
        this.setState({
            pin: this.state.pin.substr(0, this.state.pin.length - 1)
        })
    }

    _renderPinButton(value) {
        return (
            <div key={value  } className="col-xs-4">
                <button onClick={this._enterPin.bind(this, value)} className="btn btn-block btn-lg">●</button>
            </div>
        );
    }

    _submitPin() {
        trezorApi.sendPin(this.state.pin);
    }

    render() {
      let {connected, unlocked, needsPin} = this.props;

      return (
        <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: "#5383ad",
            zIndex: 99,
            color: "white"
        }}>
            <div style={{
                textAlign: "center",
                height: "100%",
                paddingTop: "12rem"
            }}>

                <h2 style={{margin: 0}}>
                    {!connected ?
                        <span>Please connect your Trezor..</span> :
                        <span>Please unlock your Trezor using the PIN code</span>}
                </h2>

                <div style={{paddingTop: "10rem"}}>
                    {!connected ?
                        <img
                            src="http://media.coindesk.com/uploads/2014/10/trezor-confirm1.jpg"
                            height="250px"
                            style={{borderRadius: "10px"}}
                        /> :
                        <div className="container pin-container">
                            <p>Enter PIN code:</p>
                            <div className="container form-group">
                            {["7", "8", "9"].map(num => {
                                return this._renderPinButton(num);
                            })}
                            </div>
                            <div className="container form-group">
                                {["4", "5", "6"].map(num => {
                                    return this._renderPinButton(num);
                                })}
                            </div>
                            <div className="container form-group">
                                {["1", "2", "3"].map(num => {
                                    return this._renderPinButton(num);
                                })}
                            </div>

                            <div className="pin-current">
                                <span>{this.state.pin}</span>
                                <button className="erase-button" onClick={this._deleteEntry.bind(this)}>Erase</button>
                            </div>
                            <div className="pin-submit">
                                <button onClick={this._submitPin.bind(this)}>Submit</button>
                            </div>

                        </div>}
                </div>

            </div>
        </div>
    );
  }
}
