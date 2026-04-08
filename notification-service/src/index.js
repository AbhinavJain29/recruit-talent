import 'dotenv/config';
import { startNotificationConsumer } from './consumers/notificationConsumer.js';

startNotificationConsumer().catch((err) => {
  console.error('Notification service failed to start', err);
  process.exit(1);
});

console.log('Notification service started');
