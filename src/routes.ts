import { Router, Request, Response } from 'express';
import database from "./database";
import {createClient} from "redis";

import { ethers } from 'ethers';

const connectClient = async () => {
  const client = createClient();

  client.on('error', err => console.log('Redis Client Error', err));

  await client.connect();

  return client;
}

const routes = Router();

routes.get('/', (req, res) => {
  return res.json({ message: 'Hello World' });
});

// define a route handler for the default home page
routes.get( "/old", (req: Request, res: Response) => {
  res.send("Hello world!");
});

routes.get('/balls', (req: Request, res: Response) => {
  //console.log(req)
  res.send("Beanus Penus");
});

routes.get('/beans', (req: Request, res: Response) => {
  //console.log(req)
  res.send("Beanus Penuses");
});

routes.post( '/upload', async (req: Request, res: Response) => {

  const client = createClient();

  client.on('error', err => console.log('Redis Client Error', err));

  await client.connect();

  const data = req.body

  res.json({message: ('You did it bitch : ' + data.message)})

  await client.hSet('thingy', req.body)
})

routes.post('/play', async (req: Request, res: Response) => {
  const client = await connectClient();

  const address = req.body.address

  await client.hSet(address,
    "playing", "true"
  )

  await client.hSet(address,
    "timestamp", Date.now()
  )

  res.json({message: 'playing successfully initiated'})

  console.log('play ', address)

})

routes.post('/pause', async (req: Request, res: Response) => {
  const client = await connectClient();

  const address = req.body.address

  await client.hSet(address,
    "playing", "false"
  )

  const playStartTime = await client.hGet(address, "timestamp")

  const TotalPlayTime = Date.now() - Number(playStartTime);

  //Time values are stored in unix timestamp format, but to the millisecond level
  //So they have 3 extra decimal places compared to regular unix timestamps
  await client.hIncrBy(address,
    "claimable_time", TotalPlayTime
  )

  res.json({message: 'playing successfully stopped'})

  console.log('pause ', address)
})

routes.post('/claim', async (req: Request, res: Response) => {
  const client = await connectClient();
  const address = req.body.address

  const accumulatedTime = await client.hGet(address, "claimable_time")

  await client.hSet(address,
    "claimable_time", 0
  )

  console.log("User ", address, " claimed ", accumulatedTime, " seconds of play time")

  //@TODO Sign message containing claimable time and users address to be sent by user on chain to claim

  res.json({
    message: 'This message would contain a signature from the server if that were implemented',
    claimed_time: accumulatedTime
  })
})



export default routes;
