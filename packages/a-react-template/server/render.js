import React from 'react';
import { renderToNodeStream, renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom';
import Loadable from 'react-loadable';
import App from '../src/components/App';

export default function serverRenderer({ clientStats, options = {} }) {
  const {
    log,
    Template,
    through,
    templateOptions,
  } = options;
  const template = new Template(templateOptions);
  return async (req, res) => {
    const context = {};
    const helmetContext = {};
    const chunkNames = [];
    await Loadable.preloadAll();
    const Root = props => (
      <Loadable.Capture
        report={moduleName => chunkNames.push(moduleName)}
      >
        <StaticRouter
          location={req.url}
          context={context}
        >
          <HelmetProvider context={helmetContext}>
            <App {...props} />
          </HelmetProvider>
        </StaticRouter>
      </Loadable.Capture>
    );
    res.status(200);
    res.write(template.before);
    renderToNodeStream(Root())
      .on('error', (err) => {
        // Log the error on the console for debugging
        /* eslint-disable no-console */
        log.error(`
          \n🙀  Woops something went wrong...
        `);
        console.log(err.stack);
        // Render a 500 component
        // So the app can still be interactive
        res.status(500);
        template.html = renderToString(Root({ hasError: true }));
        template.setChunks(clientStats, chunkNames);
        template.props({ helmet: helmetContext.helmet, initialState: { hasError: true } });
        res.end(template.rest);
      })
      .pipe(through(function write(data) {
        if (context.url) {
          res.writeHead(302, { Location: context.url });
          res.end();
          this.queue(null);
        } else {
          // At this point the app is parsed
          // We can now get our dynamic data such as
          // chunks, metas, etc...
          template.helmet = helmetContext.helmet;
          this.queue(template.metas);
          template.setChunks(clientStats, chunkNames);
          template.html = data;
          this.queue(template.content);
        }
      }, function end() {
        // Render the rest of the page
        this.queue(template.after);
        this.queue(null);
      }))
      .pipe(res);
  };
}
