import express from 'express';
import routes from './lib/routes.js';
const app = express();
app.use(routes);
export default app;
