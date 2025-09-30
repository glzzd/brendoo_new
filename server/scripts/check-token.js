import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const checkToken = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB-ya qoşuldu');

    // Get a user to create a test token
    const user = await User.findOne({});
    if (!user) {
      console.log('Heç bir istifadəçi tapılmadı');
      return;
    }

    console.log('Test istifadəçisi:', user.email);
    console.log('User ID:', user._id);

    // Create a test token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    console.log('\nYaradılan token:', token);

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\nDecoded token:', decoded);

    // Test the token with our middleware logic
    const foundUser = await User.findById(decoded.userId);
    console.log('\nToken ilə tapılan istifadəçi:', foundUser ? foundUser.email : 'Tapılmadı');
    console.log('İstifadəçi aktiv:', foundUser ? foundUser.isActive : 'N/A');

    // Close connection
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı bağlandı');

  } catch (error) {
    console.error('Xəta:', error);
    process.exit(1);
  }
};

checkToken();