import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: this.props.hasError };
  }

  componentWillReceiveProps({ location }) {
    if (location !== this.props.location) {
      // Reset the UI on navigation
      this.setState({ hasError: false });
    }
  }

  componentDidCatch() {
    // Display fallback UI
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

ErrorBoundary.defaultProps = {
  hasError: !!(typeof window !== 'undefined' &&
    window.INITIAL_STATE &&
    window.INITIAL_STATE.hasError),
};

ErrorBoundary.propTypes = {
  hasError: PropTypes.bool,
  children: PropTypes.element.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default withRouter(ErrorBoundary);
