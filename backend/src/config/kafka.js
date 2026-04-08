import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'recruit-talent-backend',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

export const producer = kafka.producer();

/**
 * Connects the Kafka producer. Call once at app startup.
 */
export async function connectProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}
