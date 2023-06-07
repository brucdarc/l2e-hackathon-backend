import { Router, Request, Response } from 'express';
import database from "./database";
import {createClient} from "redis";

import {signClaim} from './masterWallet';

import {ethers, toNumber} from 'ethers';

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

routes.post('/claimable', async (req, res) => {
  const client = await connectClient();
  const address = req.body.address

  const playing = await client.hGet(address, 'playing');

  if(playing == 'true') {

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
  }

  const accumulatedTime = await client.hGet(address, "claimable_time")

  const claimable_tokens = toNumber(accumulatedTime) / 3600000;

  res.json({
    claimable_tokens: claimable_tokens,
  });
});

routes.post('/claim', async (req: Request, res: Response) => {
  const client = await connectClient();
  const address = req.body.address

  const accumulatedTime = await client.hGet(address, "claimable_time")

  const nonce = await client.get('nonce');

  await client.hSet(address,
    "claimable_time", 0
  )

  await client.incrBy(
    "nonce", 1
  );

  console.log("User ", address, " claimed ", accumulatedTime, " seconds of play time with nonce ", nonce);

  const sig = await signClaim(address, accumulatedTime, nonce);

  res.json({
    message: 'This message contains a signature from the server',
    claimed_time: accumulatedTime,
    nonce: nonce,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  })
})



export default routes;
