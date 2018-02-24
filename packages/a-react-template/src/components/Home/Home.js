import React, { Fragment } from 'react';
import Helmet from 'react-helmet-async';
import './home.scss';

export default () => (
  <Fragment>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <h1 className="home">Home</h1>
  </Fragment>
);
