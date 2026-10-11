import 'dotenv/config'
import http from 'http'
import express from 'express'


import initWSServer from './ws-server/index.js';
import mainRouter from './routes/main.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'


const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}))

app.use('/api', mainRouter);


async function main(){
    await initWSServer(httpServer)
    httpServer.listen(3000, () => {
        console.log("Server is running on PORT: 3000")
    })
}


main();