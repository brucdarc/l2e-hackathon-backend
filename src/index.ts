import express, { Express, Request, Response } from 'express';
const app = express();
const port = 8080; // default port to listen

// define a route handler for the default home page
app.get( "/", ( req: Request, res : Response ) => {
    res.send( "Hello world!" );
} );

app.get('/balls', (req: Request, res: Response) => {
    console.log(req)
    res.send("Beanus Penus");
});

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );





