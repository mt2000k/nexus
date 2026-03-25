import dns from 'dns';
import mongoose from 'mongoose';
mongoose.set('debug', true);


dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuschat';

export async function connectDB() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
       console.error('💡 TIP: This looks like a DNS issue with the SRV record. Make sure your network allows SRV lookups or use a direct connection string.');
    }
    process.exit(1);
  }
}
