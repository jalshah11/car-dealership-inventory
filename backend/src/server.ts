// The actual process entry point. This file's ONLY job is to start
// listening on a port. All app configuration lives in app.ts.

import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚗 Car Dealership API listening on port ${env.port} [${env.nodeEnv}]`);
});
