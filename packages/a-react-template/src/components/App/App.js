import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { About, Home } from '../';

export default () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route path="/about" component={About} />
  </Switch>
);
