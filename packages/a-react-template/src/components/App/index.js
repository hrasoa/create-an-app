import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Helmet from 'react-helmet-async';
import Content from './App';
import ErrorBoundary from '../../containers/ErrorBoundary';

const App = ({ hasError }) => (
  <Fragment>
    <Helmet>
      <title>Hello World</title>
      <meta name="description" content="Hello World" />
    </Helmet>
    <ul>
      <li>
        <Link href to="/">Home</Link>
      </li>
      <li>
        <Link href to="/about">About</Link>
      </li>
    </ul>
    <hr />
    <ErrorBoundary hasError={hasError}>
      <Content />
    </ErrorBoundary>
  </Fragment>
);

App.defaultProps = {
  hasError: !!(typeof window !== 'undefined' &&
    window.INITIAL_STATE &&
    window.INITIAL_STATE.hasError),
};

App.propTypes = {
  hasError: PropTypes.bool,
};

export default App;
