import amqp from 'amqplib';

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    console.log('Connected to RabbitMQ');
    
    // Create default queues
    await channel.assertQueue('notifications', { durable: true });
    await channel.assertQueue('emails', { durable: true });
    
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error.message);
    // Don't exit process for RabbitMQ connection failure
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

export const publishMessage = async (queue, message) => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not available');
      return false;
    }
    
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    
    console.log(`Message sent to queue ${queue}:`, message);
    return true;
  } catch (error) {
    console.error('Error publishing message:', error.message);
    return false;
  }
};

export const consumeMessages = async (queue, callback) => {
  try {
    if (!channel) {
      console.error('RabbitMQ channel not available');
      return;
    }
    
    await channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        channel.ack(msg);
      }
    });
    
    console.log(`Started consuming messages from queue: ${queue}`);
  } catch (error) {
    console.error('Error consuming messages:', error.message);
  }
};