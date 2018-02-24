import React from 'react';
import { mount } from 'enzyme';
import { HelmetProvider } from 'react-helmet-async';
import About from './About';

test('About should render', () => {
  const page = mount(<HelmetProvider><About /></HelmetProvider>);
  expect(page.html()).toEqual('<h1 class="about">About</h1>');
});
