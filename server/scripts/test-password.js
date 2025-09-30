import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brendoo');
    console.log('MongoDB-ya qoşuldu');
    
    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      console.log('Admin istifadəçisi tapılmadı!');
      return;
    }
    
    console.log('Admin istifadəçisi tapıldı:');
    console.log('Email:', adminUser.email);
    console.log('Stored password hash:', adminUser.password);
    
    // Test password comparison
    const testPassword = 'admin123';
    console.log('\nŞifrə testi:');
    console.log('Test şifrəsi:', testPassword);
    
    // Manual bcrypt comparison
    const manualComparison = await bcrypt.compare(testPassword, adminUser.password);
    console.log('Manual bcrypt.compare nəticəsi:', manualComparison);
    
    // Using model method
    const modelComparison = await adminUser.comparePassword(testPassword);
    console.log('Model comparePassword nəticəsi:', modelComparison);
    
    // Test with wrong password
    const wrongPassword = 'wrongpassword';
    const wrongComparison = await adminUser.comparePassword(wrongPassword);
    console.log('Yanlış şifrə testi:', wrongComparison);
    
    // Test creating a new hash for 'admin123'
    const newHash = await bcrypt.hash('admin123', 12);
    console.log('\nYeni hash yaradılması:');
    console.log('Yeni hash:', newHash);
    const newHashComparison = await bcrypt.compare('admin123', newHash);
    console.log('Yeni hash ilə müqayisə:', newHashComparison);
    
  } catch (error) {
    console.error('Xəta:', error);
  } finally {
    mongoose.connection.close();
  }
};

testPassword();