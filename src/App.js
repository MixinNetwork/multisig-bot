import "./App.css";

import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Auth from "./auth/view.js";
import Home from "./home/view.js";
import Guide from "./guide/view.js";
import Asset from "./asset/view.js";
import Transfer from "./transfer/view.js";

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home.Index} />
        <Route exact path="/auth" component={Auth.Index} />
        <Route exact path="/assets/:id" component={Asset.Index} />
        <Route exact path="/assets/:id/transfer" component={Transfer.Index} />
        <Route exact path="/assets/:id/recipient" component={Transfer.Index} />
        <Route exact path="/guide" component={Guide.Index} />
      </Switch>
    </Router>
  );
}
