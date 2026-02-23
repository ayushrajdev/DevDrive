import app from './app.js';
import { connectDb, disConnectDb } from './config/db.config.js';

process.on('SIGINT', async () => {
    await disConnectDb();
    console.log('database disconnected');
    process.exit(0);
});

connectDb()
    .then(() => {
        app.listen(4000, () => {
            console.log(`Server Started on port 4000`);
        });
    })
    .catch((error) => {
        console.log('could not connect to database');
        console.log(error.message);
        process.exit(0);
    });
