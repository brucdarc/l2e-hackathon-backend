import { Router, Request, Response } from 'express';
import database from "./database";
import {createClient} from "redis";

import {signClaim} from './masterWallet';

import {ethers, toNumber} from 'ethers';

const connectClient = async () => {
  if (!client) {

    client = createClient({
      password: '7M3iyscYKXOZbz3L8MzT5f8i4hIjslQU',
      socket: {
        host: 'redis-14629.c92.us-east-1-3.ec2.cloud.redislabs.com',
        port: 14629
      }
    });

    // @ts-ignore
    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();
  }

  return client;
}

var client : any;

// @ts-ignore
const accumulateUserTokens = async (client, address : string) => {
  const playing = await client.hGet(address, 'playing');

  if(playing == 'true') {
    const playStartTime = await client.hGet(address, "timestamp")

    let TotalPlayTime = Date.now() - Number(playStartTime);

    //Only Allow 10 minutes of earning if there are no interactions
    //Essentially only allows first 10 minutes of a song to count towards token earnings
    //Work around for a simplier setup than the client constantly checking in
    //@TODO make this a heartbeat type of system where the frontend sends heartbeat messages
    if (TotalPlayTime > 600000) TotalPlayTime = 600000;

    //Time values are stored in unix timestamp format, but to the millisecond level
    //So they have 3 extra decimal places compared to regular unix timestamps
    await client.hIncrBy(address,
      "claimable_time", TotalPlayTime
    )
  }
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

  await accumulateUserTokens(client, address);

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

  await accumulateUserTokens(client, address);

  await client.hSet(address,
    "playing", "false"
  )

  res.json({message: 'playing successfully stopped'})

  console.log('pause ', address)
})

routes.post('/claimable', async (req, res) => {
  const client = await connectClient();
  const address = req.body.address

  await accumulateUserTokens(client, address);

  const accumulatedTime = await client.hGet(address, "claimable_time")

  const claimable_tokens = toNumber(accumulatedTime) / 3600000;

  res.json({
    claimable_tokens: claimable_tokens,
  });
});

routes.post('/claim', async (req: Request, res: Response) => {
  const client = await connectClient();
  const address = req.body.address

  await accumulateUserTokens(client, address);

  await client.hSet(address,
    "playing", "false"
  )

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
