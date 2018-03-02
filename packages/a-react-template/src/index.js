import React from 'react';
import { hydrate } from 'react-dom';
import Loadable from 'react-loadable';
import { App } from './containers';
import './main.scss';

window.main = async () => {
  await Loadable.preloadReady();
  hydrate(
    <App />,
    document.getElementById('root'),
  );
};
