import React from 'react';
import { mount } from 'enzyme';
import { HelmetProvider } from 'react-helmet-async';
import Home from './Home';

test('Home should render', () => {
  const page = mount(<HelmetProvider><Home /></HelmetProvider>);
  expect(page.html()).toEqual('<h1 class="home">Home</h1>');
});
