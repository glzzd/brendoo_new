import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brendoo_2')
    console.log('MongoDB bağlantısı başarılı')

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' })
    
    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut, siliniyor...')
      await User.deleteOne({ email: 'admin@example.com' })
    }

    // Create admin user (password will be hashed by the model middleware)
    const adminUser = new User({
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123' // Raw password - will be hashed by model middleware
    })

    await adminUser.save()
    console.log('Admin kullanıcısı başarıyla oluşturuldu:')
    console.log('Kullanıcı adı: admin')
    console.log('E-posta: admin@example.com')
    console.log('Şifre: admin123')

  } catch (error) {
    console.error('Seed işlemi sırasında hata:', error)
  } finally {
    // Close the connection
    await mongoose.connection.close()
    console.log('Veritabanı bağlantısı kapatıldı')
    process.exit(0)
  }
}

// Run the seed function
seedDatabase()