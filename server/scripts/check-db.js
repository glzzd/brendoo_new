import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://69.62.114.202:27017/brendoo')
  .then(async () => {
    console.log('MongoDB-ya qoşuldu');
    console.log('Database URI:', process.env.MONGODB_URI || 'mongodb://69.62.114.202:27017/brendoo');
    const users = await User.find({});
    console.log('Bütün istifadəçilər sayı:', users.length);
    users.forEach((user, index) => {
      console.log(`İstifadəçi ${index + 1}:`);
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('FirstName:', user.firstName);
      console.log('LastName:', user.lastName);
      console.log('Active:', user.isActive);
      console.log('---');
    });
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Xəta:', err.message);
    process.exit(1);
  });