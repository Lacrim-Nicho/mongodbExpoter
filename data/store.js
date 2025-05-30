const mongoose = require('mongoose');
const connectDB = require('./db');

// Aggiungi questa funzione helper in cima al file dopo gli import
// Helper per estrarre in modo sicuro il nome semplice della collezione da uno potenzialmente namespaced
function getSimpleCollectionName(collectionName) {
  if (!collectionName) return 'unknown';
  return collectionName.includes('.') ? collectionName.split('.').pop() : collectionName;
}

// Funzioni di accesso ai dati
const getAllItems = async (clusterUrl) => {
  if (!clusterUrl) {
    throw new Error('MongoDB cluster URL is required');
  }
  
  let connection = null;
  
  try {
    connection = await connectDB(clusterUrl);
    if (!connection) {
      throw new Error('Could not establish MongoDB connection');
    }
    
    // Ottieni il nome del database dall'URI
    let dbName = 'admin'; // Default
    try {
      const baseUri = clusterUrl.split('?')[0];
      const parts = baseUri.split('/');
      if (parts.length > 3 && parts[3]) {
        dbName = parts[3];
      }
      console.log(`Target database name from URI: ${dbName}`);
    } catch (parseError) {
      console.error('Error parsing database name:', parseError);
    }
    
    // Assicurati che abbiamo una proprietà db sulla connessione
    if (!connection.db) {
      console.log('Adding db property to connection for getAllItems');
      if (connection.getClient) {
        const client = connection.getClient();
        connection.db = client.db(dbName);
      } else if (connection.client) {
        connection.db = connection.client.db(dbName);
      }
    }
    
    // Prova ad ottenere l'accesso alla collezione
    try {
      // Definisci uno schema e un modello per gli item - usa un nome modello univoco per evitare conflitti
      const schema = new mongoose.Schema({
        name: String,
        price: Number,
        description: String,
        createdAt: { type: Date, default: Date.now }
      });

      // Use a randomly generated suffix to avoid model name conflicts
      const modelName = `Item_${Math.random().toString(36).substring(2, 7)}`;
      const ItemModel = connection.model(modelName, schema);
      
      return await ItemModel.find();
    } catch (modelError) {
      console.error('Error using mongoose model:', modelError);
      
      // Approccio alternativo usando il driver nativo di MongoDB
      try {
        console.log('Trying direct collection access');
        const db = connection.client.db(dbName);
        let collection;
        try {
          collection = db.collection('items');
          const count = await collection.countDocuments();
          console.log(`Found 'items' collection with ${count} documents`);
        } catch (e) {
          console.log("Couldn't find 'items' collection, trying 'item'");
          try {
            collection = db.collection('item');
            const count = await collection.countDocuments();
            console.log(`Found 'item' collection with ${count} documents`);
          } catch (e2) {
            console.log("Couldn't find 'item' collection either, defaulting to 'items'");
            collection = db.collection('items');
          }
        }
        return await collection.find({}).toArray();
      } catch (directError) {
        console.error('Direct collection access failed:', directError);
        return { error: directError.message, items: [] };
      }
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('Connessione chiusa dopo getAllItems');
    }
  }
};

const getItemById = async (id, clusterUrl) => {
  if (!clusterUrl) {
    throw new Error('MongoDB cluster URL is required');
  }
  
  let connection = null;
  
  try {
    connection = await connectDB(clusterUrl);
    if (!connection) {
      throw new Error('Could not establish MongoDB connection');
    }
    
    // Ottieni il nome del database dall'URI
    let dbName = 'admin'; // Default
    try {
      const baseUri = clusterUrl.split('?')[0];
      const parts = baseUri.split('/');
      if (parts.length > 3 && parts[3]) {
        dbName = parts[3];
      }
      console.log(`Target database name from URI: ${dbName}`);
    } catch (parseError) {
      console.error('Error parsing database name:', parseError);
    }
    
    // Assicurati che abbiamo una proprietà db sulla connessione
    if (!connection.db) {
      console.log('Adding db property to connection for getItemById');
      if (connection.getClient) {
        const client = connection.getClient();
        connection.db = client.db(dbName);
      } else if (connection.client) {
        connection.db = connection.client.db(dbName);
      }
    }
    
    try {
      // Definisci uno schema e un modello per gli item - usa un nome modello univoco per evitare conflitti
      const schema = new mongoose.Schema({
        name: String,
        price: Number,
        description: String,
        createdAt: { type: Date, default: Date.now }
      });

      // Use a randomly generated suffix to avoid model name conflicts
      const modelName = `Item_${Math.random().toString(36).substring(2, 7)}`;
      const ItemModel = connection.model(modelName, schema);
      
      return await ItemModel.findById(id);
    } catch (modelError) {
      console.error('Error using mongoose model for findById:', modelError);
      
      // Approccio alternativo usando il driver nativo di MongoDB
      try {
        console.log('Trying direct collection access for getItemById');
        const db = connection.client.db(dbName);
        
        // Try both 'items' and 'item' collection names
        let collection;
        try {
          collection = db.collection('items');
          const count = await collection.countDocuments();
          console.log(`Found 'items' collection with ${count} documents`);
        } catch (e) {
          console.log("Couldn't find 'items' collection, trying 'item'");
          try {
            collection = db.collection('item');
            const count = await collection.countDocuments();
            console.log(`Found 'item' collection with ${count} documents`);
          } catch (e2) {
            console.log("Couldn't find 'item' collection either, defaulting to 'items'");
            collection = db.collection('items');
          }
        }
        
        // Converti l'id stringa in ObjectId se necessario
        let objectId;
        try {
          const { ObjectId } = require('mongodb');
          objectId = new ObjectId(id);
        } catch (idError) {
          objectId = id; // Use as-is if conversion fails
        }
        
        return await collection.findOne({ _id: objectId });
      } catch (directError) {
        console.error('Direct collection access failed for getItemById:', directError);
        return null;
      }
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('Connessione chiusa dopo getItemById');
    }
  }
};

// Esporta tutti gli item come JSON da MongoDB Atlas
const exportItemsAsJson = async (clusterUrl) => {
  if (!clusterUrl) {
    throw new Error('MongoDB Atlas cluster URL is required');
  }
  
  let connection = null;
  let authRetried = false;
  
  try {
    console.log('Starting MongoDB Atlas export process');
    
    // Prima, assicurati che l'URI sia decodificato correttamente se era codificato
    let decodedUri;
    try {
      decodedUri = decodeURIComponent(clusterUrl);
      console.log('URI successfully decoded');
    } catch (decodeError) {
      console.error('Error decoding URI:', decodeError);
      decodedUri = clusterUrl; // Use as-is if can't be decoded
    }
    
    // Analizza e modifica la stringa di connessione per una migliore compatibilità
    let modifiedUri = decodedUri;
    
    // Assicurati che la stringa di connessione abbia un database specificato
    if (modifiedUri.includes('mongodb+srv://') || modifiedUri.includes('mongodb://')) {
      // Extract parts before query parameters
      const [baseUrl, queryParams] = modifiedUri.split('?');
      
      // Check if there's a database name after the host
      if (baseUrl.split('/').length === 4) {
        // No database specified, add 'admin' as default
        const newBaseUrl = `${baseUrl}/admin`;
        modifiedUri = queryParams ? `${newBaseUrl}?${queryParams}` : newBaseUrl;
        console.log('Added default database "admin" to connection string');
      }
      
      // Assicurati che authSource sia specificato
      if (!modifiedUri.includes('authSource=')) {
        const separator = modifiedUri.includes('?') ? '&' : '?';
        modifiedUri = `${modifiedUri}${separator}authSource=admin`;
        console.log('Added authSource=admin to connection string');
      }
      
      // Aggiungi retryWrites e w=majority se non presenti
      if (!modifiedUri.includes('retryWrites=')) {
        const separator = modifiedUri.includes('?') ? '&' : '?';
        modifiedUri = `${modifiedUri}${separator}retryWrites=true&w=majority`;
        console.log('Added retryWrites and w=majority to connection string');
      }
    }
    
    // Opzioni di connessione migliorate per una migliore compatibilità
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      authSource: 'admin',
      retryWrites: true,
      w: 'majority'
    };
    
    // Valida il formato dell'URI
    if (!modifiedUri.startsWith('mongodb://') && !modifiedUri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
    }
    
    console.log('Connection string analysis:');
    // Analizza ma nascondi le credenziali nei log
    const uriParts = modifiedUri.split('@');
    const credentials = uriParts[0].split('://')[1];
    const [username] = credentials.split(':');
    console.log(`- Protocol: ${modifiedUri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb'}`);
    console.log(`- Username: ${username}`);
    console.log(`- Host: ${uriParts[1].split('/')[0]}`);
    console.log(`- Has authSource: ${modifiedUri.includes('authSource=')}`);
    
    console.log('Attempting to connect to MongoDB Atlas for export...');
    
    // Parse out the database name from the URI for later use
    let dbName = 'admin'; // Default
    try {
      const baseUri = modifiedUri.split('?')[0];
      const parts = baseUri.split('/');
      if (parts.length > 3 && parts[3]) {
        dbName = parts[3];
      }
      console.log(`Target database name from URI: ${dbName}`);
    } catch (parseError) {
      console.error('Error parsing database name:', parseError);
    }
    
    try {
      // Direct connection attempt with mongoose for more control
      console.log('Attempting connection with enhanced parameters...');
      connection = await mongoose.createConnection(modifiedUri, connectionOptions);
      console.log('Connection successful using mongoose.createConnection');
      
      // Assicurati che abbiamo una proprietà db sulla connessione
      if (!connection.db) {
        console.log('Adding db property to connection');
        // Get client and db from the connection
        if (connection.getClient) {
          const client = connection.getClient();
          if (client) {
            connection.db = client.db(dbName);
            console.log(`Attached db (${dbName}) to connection`);
          }
        }
        
        // If still no db property, create one
        if (!connection.db && connection.client) {
          connection.db = connection.client.db(dbName);
          console.log(`Created db property using client.db(${dbName})`);
        }
      }
      
    } catch (initialConnectError) {
      console.error('Initial connection error:', initialConnectError.message);
      
      // If first attempt fails, try with explicit auth parameters
      if (!authRetried) {
        authRetried = true;
        console.log('Retrying with explicit authentication parameters...');
        
        // Extract username/password from the connection string
        try {
          const uriParts = modifiedUri.split('@');
          const credentials = uriParts[0].split('://')[1];
          const [username, password] = credentials.split(':');
          
          // Build host part (everything after @)
          const hostPart = uriParts[1];
          
          // Create a new connection string with explicit authMechanism
          // Try with both SCRAM-SHA-1 and SCRAM-SHA-256 auth mechanisms
          const protocol = modifiedUri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
          const altUri = `${protocol}${username}:${password}@${hostPart}`;
          console.log('Trying alternative connection string format');
          
          // Try connection with alternative string and SCRAM-SHA-256 (newer auth)
          const altOptions = {
            ...connectionOptions,
            authMechanism: 'SCRAM-SHA-256', // Try newer auth mechanism first
            authSource: 'admin'
          };
          
          try {
            connection = await mongoose.createConnection(altUri, altOptions);
            console.log('Connection successful with SCRAM-SHA-256 auth');
          } catch (sha256Error) {
            console.log('SCRAM-SHA-256 auth failed, trying SCRAM-SHA-1...');
            // If SCRAM-SHA-256 fails, try SCRAM-SHA-1 (older auth)
            const sha1Options = {
              ...connectionOptions,
              authMechanism: 'SCRAM-SHA-1', // Try older auth mechanism
              authSource: 'admin'
            };
            
            connection = await mongoose.createConnection(altUri, sha1Options);
            console.log('Connection successful with SCRAM-SHA-1 auth');
          }
        } catch (retryError) {
          console.error('Retry connection failed:', retryError.message);
          throw new Error(`Connection failed after retry. Original error: ${initialConnectError.message}, Retry error: ${retryError.message}`);
        }
      } else {
        throw initialConnectError;
      }
    }
    
    if (!connection) {
      throw new Error('Failed to connect to MongoDB Atlas for export - connection object is null');
    }
    
    // Use our already defined dbName if we have one, or get it from the connection
    if (!dbName || dbName === 'admin') {
      dbName = connection.name || 'unknown';
    }
    console.log(`Successfully connected to MongoDB Atlas database "${dbName}" for export`);
    
    // Create an export data structure to return even if we can't access collections
    const exportData = {
      exportDate: new Date().toISOString(),
      database: dbName,
      connectionSuccessful: true,
      connectionDetails: {
        host: connection.host,
        port: connection.port,
        username: username,
        database: dbName,
        authSource: modifiedUri.includes('authSource=') ? 
          modifiedUri.split('authSource=')[1].split('&')[0] : 'admin'
      },
      collections: {}
    };
    
    // Try to get basic database stats even if we can't list collections
    try {
      const stats = await connection.db.stats();
      exportData.databaseStats = {
        collections: stats.collections,
        views: stats.views,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      };
      console.log(`Database stats retrieved: ${stats.collections} collections, ${stats.objects} objects`);
    } catch (statsError) {
      console.log('Could not retrieve database stats:', statsError.message);
      exportData.databaseStats = { error: 'Could not retrieve stats' };
    }
    
    // Try to list collections with fallback methods if permission issues occur
    let collectionNames = [];
    let accessError = null;
    
    try {
      // First attempt - standard collection listing
      console.log('Attempting to list collections - method 1...');
      const collections = await connection.db.listCollections().toArray();
      collectionNames = collections.map(c => c.name);
      console.log(`Found ${collectionNames.length} collections in database "${dbName}"`);
      
      // Clean up collection names to avoid namespace issues
      collectionNames = collectionNames.map(name => {
        const simpleName = getSimpleCollectionName(name);
        if (name !== simpleName) {
          console.log(`Simplified collection name from ${name} to ${simpleName}`);
        }
        return simpleName;
      });
      
    } catch (listError) {
      console.error('Error listing collections with method 1:', listError.message);
      accessError = listError;
      
      // Second attempt - try to access known collection names directly
      try {
        console.log('Attempting alternative collection access - method 2...');
        // Common collection names in MongoDB - try these directly
        const commonCollections = ['users', 'products', 'items', 'orders', 'categories', 'customers', 'test'];
        
        for (const collName of commonCollections) {
          try {
            // Make sure we properly define any collection name
            const simpleCollName = getSimpleCollectionName(collName);
            
            const count = await connection.db.collection(simpleCollName).countDocuments();
            console.log(`Collection ${simpleCollName} exists with ${count} documents`);
            collectionNames.push(simpleCollName);
          } catch (e) {
            // Skip collections we can't access
          }
        }
        
        if (collectionNames.length > 0) {
          console.log(`Found ${collectionNames.length} collections using direct access`);
          accessError = null; // We succeeded with method 2
        }
      } catch (directError) {
        console.error('Direct collection access failed:', directError.message);
      }
      
      // Third attempt - try to use the admin database to list collections
      if (collectionNames.length === 0) {
        try {
          console.log('Attempting admin database access - method 3...');
          // Try to get a list of databases
          const adminDb = connection.client.db('admin');
          const dbs = await adminDb.admin().listDatabases();
          
          console.log(`Found ${dbs.databases.length} databases on server`);
          exportData.availableDatabases = dbs.databases.map(db => db.name);
          
          // Try to access each database
          for (const dbInfo of dbs.databases) {
            if (dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
              try {
                const testDb = connection.client.db(dbInfo.name);
                const dbCollections = await testDb.listCollections().toArray();
                
                if (dbCollections.length > 0) {
                  console.log(`Found ${dbCollections.length} collections in database "${dbInfo.name}"`);
                  collectionNames = dbCollections.map(c => c.name);
                  // Switch our connection to this database
                  connection = mongoose.createConnection(
                    modifiedUri.replace(/\/[^/?]+(\?|$)/, `/${dbInfo.name}$1`),
                    connectionOptions
                  );
                  break;
                }
              } catch (e) {
                console.log(`Could not access database ${dbInfo.name}:`, e.message);
              }
            }
          }
        } catch (adminError) {
          console.error('Admin database access failed:', adminError.message);
        }
      }
    }
    
    // If we couldn't access any collections, return information about permissions
    if (collectionNames.length === 0) {
      console.log('No accessible collections found');
      if (accessError) {
        exportData.permissionError = true;
        exportData.error = 'You may not have sufficient permissions to read from this database';
        exportData.errorDetails = accessError.message;
        exportData.helpMessage = `
To fix permission issues in MongoDB Atlas:

1. Check your connection string format:
   - Make sure it follows: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   - Try adding '?authSource=admin' at the end of your connection string
   - Ensure special characters in password are URL-encoded

2. Verify MongoDB Atlas permissions:
   - Go to MongoDB Atlas dashboard
   - Navigate to Database Access
   - Find your user (${username}) and click Edit
   - Set privileges to either "Atlas Admin" or "readWriteAnyDatabase"
   - Click "Update User"

3. Verify Network Access:
   - Ensure your current IP address is in the whitelist in the Network Access section
   - Or temporarily enable "Allow access from anywhere" for testing

4. Check database exists:
   - Make sure the database in your connection string exists in your cluster
   - If unsure, try connecting to 'admin' database by adding '/admin' before the ?
`;
        return exportData;
      }
    }
    
    // If we found collections, try to export their data
    if (collectionNames.length === 0) {
      console.log('No collections found in the database');
      exportData.message = 'No collections found in the database';
      return exportData;
    }
    
    // Process each collection up to a reasonable limit
    const MAX_DOCUMENTS = 1000; // Limit to avoid very large downloads
    let totalDocuments = 0;
    
    for (const collectionName of collectionNames) {
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        console.log(`Skipping system collection: ${collectionName}`);
        continue;
      }
      
      console.log(`Processing collection: ${collectionName}`);
      
      try {
        // Fix the namespace issue - extract just the collection name without db prefix
        const simpleCollectionName = getSimpleCollectionName(collectionName);
        
        console.log(`Using simplified collection name: ${simpleCollectionName}`);
        
        const collection = connection.db.collection(simpleCollectionName);
        
        try {
          // First check if the collection exists and is accessible
          const count = await collection.countDocuments();
          console.log(`Collection ${simpleCollectionName} has ${count} documents`);
          
          // Get the documents with a timeout
          const documents = await collection.find({})
            .limit(MAX_DOCUMENTS)
            .maxTimeMS(30000) // 30 second timeout for query
            .toArray();
          
          console.log(`Retrieved ${documents.length} documents from ${simpleCollectionName}`);
          totalDocuments += documents.length;
          
          // Only include non-empty collections
          if (documents.length > 0) {
            exportData.collections[simpleCollectionName] = {
              count: documents.length,
              hasMore: documents.length === MAX_DOCUMENTS, // Indicate if data was limited
              documents: documents
            };
          } else {
            console.log(`Collection ${simpleCollectionName} is empty, skipping`);
          }
        } catch (queryError) {
          console.error(`Error querying collection ${simpleCollectionName}:`, queryError.message);
          // Add information about the error to the export data
          exportData.collections[simpleCollectionName] = {
            error: queryError.message,
            count: 0,
            documents: []
          };
        }
      } catch (collectionError) {
        // The simpleCollectionName variable might not be defined here if the error happened earlier
        // Make sure we define it properly in this scope as well
        const simpleCollectionName = getSimpleCollectionName(collectionName);
        
        console.error(`Error accessing collection ${simpleCollectionName}:`, collectionError.message);
        
        // Try an alternative approach to access the collection
        try {
          console.log(`Trying alternative approach to access collection ${simpleCollectionName}...`);
          
          // Ensure we have a client and db
          if (connection.client) {
            const db = connection.client.db(dbName);
            if (db) {
              const altCollection = db.collection(simpleCollectionName);
              const count = await altCollection.countDocuments();
              console.log(`Alternative approach: Collection ${simpleCollectionName} has ${count} documents`);
              
              const documents = await altCollection.find({})
                .limit(MAX_DOCUMENTS)
                .maxTimeMS(30000)
                .toArray();
                
              console.log(`Retrieved ${documents.length} documents from ${simpleCollectionName} using alternative approach`);
              totalDocuments += documents.length;
              
              exportData.collections[simpleCollectionName] = {
                count: documents.length,
                hasMore: documents.length === MAX_DOCUMENTS,
                documents: documents
              };
            } else {
              throw new Error('Database object is null');
            }
          } else {
            throw new Error('MongoDB client is not available');
          }
        } catch (altError) {
          console.error(`Alternative approach failed for ${simpleCollectionName}:`, altError.message);
          // Add information about the error to the export data
          exportData.collections[simpleCollectionName] = {
            error: `Failed to access collection: ${collectionError.message}. Alternative attempt error: ${altError.message}`,
            count: 0,
            documents: []
          };
        }
      }
    }
    
    exportData.totalDocuments = totalDocuments;
    return exportData;
  } catch (error) {
    console.error('Error exporting data from MongoDB Atlas:', error);
    console.error('Error stack:', error.stack);
    
    // Return error information as part of the export data
    let errorMessage = error.message;
    
    // Make the error message more user-friendly
    if (errorMessage.includes('authentication failed')) {
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (errorMessage.includes('ENOTFOUND')) {
      errorMessage = 'Could not find MongoDB server. Please check your cluster URL.';
    } else if (errorMessage.includes('timed out')) {
      errorMessage = 'Connection timed out. MongoDB server might be unreachable.';
    } else if (errorMessage.includes('not authorized') || errorMessage.includes('permissions')) {
      errorMessage = `Permission denied. The user in your connection string doesn't have sufficient access rights.
      
To fix this, go to MongoDB Atlas dashboard:
1. Click "Database Access"
2. Edit your user (admin1)
3. Set proper permissions (AtlasAdmin or readWriteAnyDatabase)
`;
    }
    
    return {
      exportDate: new Date().toISOString(),
      connectionSuccessful: false,
      error: errorMessage,
      technicalError: error.message,
      errorDetails: error.stack,
      debugInfo: {
        originalUri: clusterUrl,
        modifiedUri: typeof modifiedUri !== 'undefined' ? 
          modifiedUri.replace(/:([^:@]+)@/, ':****@') : null, // Hide password
        connectionOptions: typeof connectionOptions !== 'undefined' ? 
          connectionOptions : null
      },
      suggestions: [
        "Make sure your connection string is formatted correctly",
        "Check that your database user has proper permissions",
        "Verify IP whitelisting in MongoDB Atlas",
        "Try specifying a database name in your connection string",
        "Try adding '?authSource=admin' to your connection string",
        "Ensure your MongoDB Atlas cluster is active and not paused",
        "Try creating a new database user with Atlas Admin privileges"
      ]
    };
  } finally {
    // Close the connection after use
    if (connection) {
      try {
        await connection.close();
        console.log('Closed MongoDB Atlas connection after export');
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

module.exports = {
  getAllItems,
  getItemById,
  exportItemsAsJson
};