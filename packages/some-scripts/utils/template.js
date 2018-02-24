const { oneLineTrim } = require('common-tags');
const flushChunks = require('./flushChunks');

module.exports = class Template {
  /**
   *
   * @param {Object} props Properties
   */
  constructor(props = {}) {
    this.props(props);
    this.trim = oneLineTrim;
    this.initialState = {};
  }

  /**
   * Set a group of properties
   * @param {Object} props Properties
   */
  props(props = {}) {
    Object.keys(props).forEach((propName) => { this[propName] = props[propName]; });
  }

  /**
   * Should be called after renderToNodeStream or renderToString
   * @param {Object} clientStats Webpack json stats
   * @param {Array} chunkNames Chunks by name
   */
  setChunks(clientStats = {}, chunkNames = []) {
    const { scripts } = flushChunks(clientStats, {
      chunkNames,
      before: ['vendors', 'main'],
      after: [],
    });
    const js = scripts.map(file => clientStats.publicPath + file);
    this.props({ js });
  }

  /**
   *
   * @param {Object} state
   */
  set initialState(state = {}) {
    this.state = JSON.stringify(state);
  }

  /**
   *
   * @param {Array} js
   */
  set js(js = []) {
    this.scripts = js;
    this.preloadJsRaw = js.map(href =>
      `<link rel="preload" as="script" href="${href}"/>`).join('');
    this.scriptsRaw = js.map(src =>
      `<script src="${src}"></script>`).join('');
  }

  get before() {
    return this.trim`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          ${this.manifest ? `
          <meta name="theme-color" content="${this.manifest.theme_color}"/>
          <link rel="manifest" href="/manifest.json"/>` : ''}
          ${this.fontLoaderRaw ? `<script>${this.fontLoaderRaw}</script>` : ''}`;
  }

  get metas() {
    if (!this.helmet) return '';
    return this.trim`
          ${this.helmet.title.toString()}
          ${this.helmet.meta.toString()}
          ${this.helmet.link.toString()}`;
  }

  get content() {
    return this.trim`
          ${this.preloadJsRaw}
        </head>
        <body ${this.helmet ? this.helmet.bodyAttributes.toString() : ''}>
          <div id="root">${String.raw`${this.html}`}</div>`;
  }

  get after() {
    return this.trim`
          <script>INITIAL_STATE = ${this.state};</script>
          ${this.scriptsRaw}
          <script>window.main();</script>
        </body>
      </html>`;
  }

  get rest() {
    return this.metas + this.content + this.after;
  }
};
