if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /* eslint-disable no-console */
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('SW registered');
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
