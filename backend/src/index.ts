import http from 'http'
import express from 'express'


import initWSServer from './ws-server/index.js';
import mainRouter from './routes/main.routes.js';


const app = express();
const httpServer = http.createServer(app);


app.use('/api', mainRouter);


function main(){
    initWSServer(httpServer)
    httpServer.listen(3000, () => {
        console.log("Server is running on PORT: 3000")
    })
}


main();