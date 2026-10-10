import http from 'http'
import express from 'express'


import initWSServer from './ws-server/index.js';
import mainRouter from './routes/main.routes.js';
import cookieParser from 'cookie-parser';


const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(cookieParser())

app.use('/api', mainRouter);


async function main(){
    await initWSServer(httpServer)
    httpServer.listen(3000, () => {
        console.log("Server is running on PORT: 3000")
    })
}


main();