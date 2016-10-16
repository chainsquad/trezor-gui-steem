import React, { Component } from 'react';

export default class Home extends Component {

  render() {
    return (
        <form className="col-xs-6">

            <div className="form-group">
                <label>Use key with account:</label>
                <input className="form-control" type="text" />
            </div>

            <div className="form-group">
                <label>Password/private key:</label>
                <input className="form-control" type="password" />
            </div>

            <button type="submit" className="btn btn-default">Submit</button>

        </form>
   );
  }
}
