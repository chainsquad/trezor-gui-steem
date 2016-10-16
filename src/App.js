import React, { Component } from 'react';
import { render } from 'react-dom'
import Layout from './Layout';
import Home from './Home';
import Setup from './Setup';
import { Router, Route, hashHistory, IndexRoute } from 'react-router'
import api from './lib/api';
import trezorApi from "./lib/trezorApi";

// If you use React Router, make this component
// render <Router> with your routes. Currently,
// only synchronous routes are hot reloaded, and
// you will see a warning from <Router> on every reload.
// You can ignore this warning. For details, see:
// https://github.com/reactjs/react-router/issues/2182

export default class App extends Component {

    componentDidMount() {
        api.connect();
        trezorApi.connect();
    }


    render() {
        return (
            <Router history={hashHistory}>

                <Route path="/" component={Layout}>
                    <IndexRoute component={Setup} />
                    <Route path="/setup" component={Setup} />
                </Route>
            </Router>
        );
    }
}
