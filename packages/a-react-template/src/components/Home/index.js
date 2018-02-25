import Loadable from 'react-loadable';

export default Loadable({
  // We use the webpack magic comment to rename our chunk
  // and add the modules key option so we can retrieve
  // the right chunk inside our server side render script
  // Without this, our chunk file would be named "Home.js"
  // It is preferable to have lowercase file names
  loader: () => import(/* webpackChunkName: "home" */ './Home'),
  loading: () => null,
  modules: ['home'],
});
