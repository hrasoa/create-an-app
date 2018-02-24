import React, { Fragment } from 'react';
import Helmet from 'react-helmet-async';
import './about.scss';

export default () => (
  <Fragment>
    <Helmet>
      <title>About</title>
    </Helmet>
    <h1 className="about">About</h1>
  </Fragment>
);
