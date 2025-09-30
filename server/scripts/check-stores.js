import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Store from '../models/Store.js';

// Load environment variables
dotenv.config();

const checkStores = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB-ya qoşuldu');
    console.log('Database URI:', process.env.MONGODB_URI);

    // Get all stores
    const stores = await Store.find({});
    console.log(`\nBütün mağazalar sayı: ${stores.length}`);

    stores.forEach((store, index) => {
      console.log(`\nMağaza ${index + 1}:`);
      console.log('ID:', store._id);
      console.log('Name:', store.name);
      console.log('Website:', store.website);
      console.log('Description:', store.description);
      console.log('Active:', store.isActive);
      console.log('Created By:', store.createdBy);
      console.log('Endpoints Count:', store.endpoints ? store.endpoints.length : 0);
      if (store.endpoints && store.endpoints.length > 0) {
        console.log('Endpoints:');
        store.endpoints.forEach((endpoint, i) => {
          console.log(`  ${i + 1}. ${endpoint.method} ${endpoint.name} - ${endpoint.url}`);
        });
      }
      console.log('---');
    });

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı bağlandı');

  } catch (error) {
    console.error('Xəta:', error);
    process.exit(1);
  }
};

checkStores();