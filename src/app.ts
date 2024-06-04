import express from 'express';
import { PrismaClient } from "@prisma/client"
import routes from './routes/routes';

export const prisma = new PrismaClient()

const app = express();

app.use(express.json())

app.use('/api', routes);
// app.use('/api', passport.authenticate('jwt', { session: false }), secureRoute);

app.listen(process.env.PORT, () => {
    console.log('Server started at ' + process.env.PORT)
});
