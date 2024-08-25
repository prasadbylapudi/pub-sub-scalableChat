import { createClient } from 'redis';

const publishClient=createClient();
publishClient.connect();


const subscribeClient=createClient();
subscribeClient.connect();

export {publishClient,subscribeClient}



