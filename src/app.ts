import express from 'express';

import routes from './routes';

import cors from 'cors';

import Database from "./database";

class App {
  public server;

  constructor() {
    this.server = express();
    this.server.use(cors());
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json());
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App();
