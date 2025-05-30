const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    // Input validation
    if (!uri) {
      console.error('MongoDB connection string is not provided');
      console.error('Please provide a MongoDB connection string using the input field');
      return null;
    }
    
    // Remove any potential whitespace
    const trimmedUri = uri.trim();
    console.log('Validating connection string format...');
    
    // Simple format validation - must start with mongodb:// or mongodb+srv://
    if (!trimmedUri.startsWith('mongodb://') && !trimmedUri.startsWith('mongodb+srv://')) {
      console.error('Invalid MongoDB URI format:', 
        trimmedUri.substring(0, Math.min(10, trimmedUri.length)) + '...');
      throw new Error('Invalid MongoDB URI format. URI must start with "mongodb://" or "mongodb+srv://"');
    }
    
    console.log('MongoDB URI format valid, connecting...');
    
    // Ensure all existing connections are closed
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Closed existing mongoose default connection');
      }
      
      // Close any other outstanding connections
      await mongoose.disconnect();
    } catch (closeError) {
      console.log('No existing connections to close or error closing:', closeError.message);
    }
    
    // Enhanced MongoDB connection options for better Atlas compatibility
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,        // 30 seconds
      socketTimeoutMS: 45000,         // 45 seconds
      serverSelectionTimeoutMS: 30000, // 30 seconds
      heartbeatFrequencyMS: 10000,    // 10 seconds
      retryWrites: true,
      w: 'majority',
      keepAlive: true,
      minPoolSize: 0,  // Don't maintain idle connections for too long
      authSource: 'admin' // Explicitly set auth source to admin for Atlas
    };
    
    // Ensure the connection string has authSource if not already present
    let enhancedUri = trimmedUri;
    if (!enhancedUri.includes('authSource=')) {
      enhancedUri += enhancedUri.includes('?') ? '&authSource=admin' : '?authSource=admin';
      console.log('Added authSource=admin to connection string for better compatibility');
    }
    
    // Parse the connection string to get database name
    let databaseName = '';
    try {
      const uriWithoutParams = enhancedUri.split('?')[0];
      const parts = uriWithoutParams.split('/');
      
      // The database name is the last part after the last slash, before the query params
      if (parts.length > 3) {
        databaseName = parts[parts.length - 1];
        if (!databaseName) {
          // If no database specified, use "admin" as default
          databaseName = 'admin';
          console.log('No database specified in URI, will use "admin" as default');
        }
      } else {
        // If no database in URI, use "admin" as default
        databaseName = 'admin';
        console.log('No database path in URI, will use "admin" as default');
      }
      
      console.log(`Database name from URI: ${databaseName}`);
    } catch (parseError) {
      console.error('Error parsing URI for database name:', parseError);
      databaseName = 'admin'; // Default to admin if parsing fails
    }
    
    console.log('Creating MongoDB connection...');
    
    // Use createConnection with the enhanced URI
    const connection = await mongoose.createConnection(enhancedUri, connectionOptions);
    
    // Explicitly attach the database instance for easier access
    try {
      // Get direct access to the native MongoDB driver's db object
      connection.db = connection.getClient().db(databaseName);
      console.log('Successfully attached database instance to connection');
    } catch (dbError) {
      console.error('Error attaching db instance to connection:', dbError);
      // Continue even if this fails - we'll handle it in the routes
    }
    
    // Verify the connection is active
    console.log(`Successfully connected to MongoDB database: ${connection.name}`);
    
    // Adding event listeners for better connection handling
    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    connection.on('disconnected', () => {
      console.log('MongoDB connection disconnected');
    });
    
    // For specific Atlas-related errors:
    connection.on('reconnectFailed', () => {
      console.error('MongoDB reconnection failed after multiple attempts');
    });
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error details:', error);
    
    // Handle specific MongoDB Atlas errors
    if (error.name === 'MongoServerSelectionError') {
      throw new Error('Could not connect to MongoDB Atlas. Please verify your connection string and ensure the cluster is reachable.');
    } else if (error.message && error.message.includes('authentication failed')) {
      throw new Error('MongoDB authentication failed. Please check your username and password.');
    } else if (error.name === 'MongoParseError') {
      throw new Error('Invalid MongoDB connection string format: ' + error.message);
    } else {
      throw new Error(`Connection to MongoDB failed: ${error.message}`);
    }
  }
};

module.exports = connectDB;
