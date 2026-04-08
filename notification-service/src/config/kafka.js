import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'recruit-talent-notification-service',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

export const consumer = kafka.consumer({ groupId: 'notification-group' });
