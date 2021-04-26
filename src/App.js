import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Home from './home/view.js';

import './App.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={ Home.Index } />
      </Switch>
    </Router>
  );
}
