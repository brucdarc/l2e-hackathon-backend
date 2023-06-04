import { createClient } from 'redis';
import express from "express";


class Database {
  public client;

  constructor() {
    this.client = createClient();

    this.client.on('error', err => console.log('Redis Client Error', err));
  }

  async connect(){
    await this.client.connect();
  }
}

export default new Database();
