// src/server.ts
import express from 'express';
import routes from './routes';
import cors from 'cors';

const app = express();
const port = 8080;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
