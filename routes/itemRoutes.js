const express = require('express');
const router = express.Router();
const { getAllItems, getItemById, exportItemsAsJson } = require('../data/store');
const connectDB = require('../data/db');

// New route: Validate MongoDB connection
router.get('/validate', async (req, res) => {
    let connection = null;
    
    try {
        console.log('Received validation request');
        
        // Get the raw cluster URL from the query parameter
        const clusterUrl = req.query.clusterUrl;
        
        // Immediately check if URL is missing or completely malformed
        if (!clusterUrl) {
            console.error('Missing MongoDB connection string');
            return res.status(400).json({ 
                error: "MongoDB cluster URL is required",
                status: "error",
                errorType: "missing_url"
            });
        }
        
        // Log a safe version of the URL (hiding credentials)
        try {
            const safeUrl = getSafeConnectionStringForLogging(clusterUrl);
            console.log('Validating connection string:', safeUrl);
        } catch (logError) {
            console.log('Validating connection string: [Error logging URL safely]');
        }
        
        // IMPORTANT: Don't try to decode or manipulate the URL further
        // It should already be properly decoded by Express when it parses the query parameters
        
        // Validate the URL format
        if (!clusterUrl.startsWith('mongodb://') && !clusterUrl.startsWith('mongodb+srv://')) {
            console.error('Invalid MongoDB URI format detected in validation request');
            return res.status(400).json({
                error: "Connection to MongoDB failed: Invalid MongoDB URI format. URI must start with \"mongodb://\" or \"mongodb+srv://\"",
                message: "L'URL del cluster MongoDB non è nel formato corretto. Deve iniziare con \"mongodb://\" o \"mongodb+srv://\"",
                status: "error",
                errorType: "invalid_format"
            });
        }
        
        // Additional URL validation to prevent common errors
        const validationResult = validateMongoDBUrl(clusterUrl);
        if (!validationResult.valid) {
            console.error('MongoDB URL validation failed:', validationResult.reason);
            return res.status(400).json({
                error: `Connection to MongoDB failed: ${validationResult.reason}`,
                message: `URL non valido: ${validationResult.message}`,
                status: "error",
                errorType: "invalid_url",
                details: validationResult.details
            });
        }
        
        console.log('Processing validation request for MongoDB Atlas connection...');
        console.log('Connection string format is valid');
        
        // Try to connect to the MongoDB cluster
        try {
            // Try a direct mongoose connection
            console.log('Attempting MongoDB connection test...');
            
            connection = await connectDB(clusterUrl);
            
            if (!connection) {
                console.error('Connection failed - null connection returned');
                return res.status(400).json({
                    error: "Failed to establish connection to MongoDB Atlas",
                    message: "Connessione fallita - connessione vuota restituita",
                    technical: "The connection function returned null",
                    status: "error"
                });
            }
            
            // Test database connection by getting DB information
            try {
                const dbInfo = {
                    name: connection.name,
                    collections: []
                };
                
                console.log(`Successfully connected to database: ${dbInfo.name}`);
                
                // Try to get collection info - this confirms we have read access
                console.log('Attempting to list collections...');
                
                // Fix access to the db and listCollections
                try {
                    if (!connection.db) {
                        // For mongoose connections, we need to access the db differently
                        console.log('Using mongoose connection client to access db');
                        
                        // Check if connection has a client property
                        if (connection.client && connection.client.db) {
                            const db = connection.client.db(dbInfo.name);
                            const collections = await db.listCollections().toArray();
                            dbInfo.collections = collections.map(c => c.name);
                        } else if (connection.useDb) {
                            // Try using useDb method
                            const db = connection.useDb(dbInfo.name);
                            const collections = await db.db.listCollections().toArray();
                            dbInfo.collections = collections.map(c => c.name);
                        } else {
                            console.log('Cannot access db through standard methods');
                            // Return success without trying to list collections
                            dbInfo.collections = [];
                            dbInfo.note = "Connected successfully but cannot list collections";
                        }
                    } else {
                        // Standard approach if db is already available
                        const collections = await connection.db.listCollections().toArray();
                        dbInfo.collections = collections.map(c => c.name);
                    }
                } catch (dbAccessError) {
                    console.error('Error accessing database collections:', dbAccessError);
                    // Don't fail the whole connection, just note we couldn't list collections
                    dbInfo.collections = [];
                    dbInfo.note = "Connected successfully but cannot list collections: " + dbAccessError.message;
                }
                
                console.log(`Connection validation successful: Connected to "${dbInfo.name}" with ${dbInfo.collections.length} collections`);
                
                // Return success with some DB info
                return res.json({ 
                    status: "success", 
                    message: "Connection to MongoDB Atlas established successfully",
                    database: dbInfo.name,
                    collectionsCount: dbInfo.collections.length,
                    collections: dbInfo.collections,
                    note: dbInfo.note
                });
            } catch (listError) {
                console.error('Error listing collections:', listError);
                console.error('Collection listing error details:', listError.stack);
                
                // Provide a more detailed error message about permissions issues
                let errorDetails = "Un errore è avvenuto durante la lettura delle collezioni. ";
                
                if (listError.message.includes('not authorized') || listError.message.includes('permission')) {
                    errorDetails += "L'utente non ha i permessi necessari per leggere le collezioni nel database.";
                } else {
                    errorDetails += "Motivo: " + listError.message;
                }
                
                return res.status(400).json({
                    error: "Connected to MongoDB but failed to list collections",
                    message: errorDetails,
                    technical: listError.message,
                    possibleIssue: "permission_error",
                    status: "error"
                });
            }
        } catch (connectionError) {
            console.error('MongoDB connection validation error:', connectionError);
            console.error('Connection error stack:', connectionError.stack);
            
            // Create a user-friendly error message
            let errorMessage = connectionError.message;
            let errorType = "unknown_error";
            
            // Check for common errors and provide better messages
            if (errorMessage.includes('authentication failed')) {
                errorMessage = 'Autenticazione fallita. Controlla username e password.';
                errorType = "auth_failed";
            } else if (errorMessage.includes('ENOTFOUND')) {
                errorMessage = 'Impossibile trovare il server MongoDB. Controlla l\'URL del cluster.';
                errorType = "host_not_found";
            } else if (errorMessage.includes('timed out')) {
                errorMessage = 'Connessione scaduta. Il server MongoDB potrebbe essere irraggiungibile.';
                errorType = "timeout";
            } else if (errorMessage.includes('Invalid connection string')) {
                errorMessage = 'Stringa di connessione non valida. Controlla il formato dell\'URL.';
                errorType = "invalid_uri";
            } else if (errorMessage.includes('server selection error')) {
                errorMessage = 'Errore di selezione del server. Il cluster potrebbe essere in pausa o irraggiungibile.';
                errorType = "server_selection";
            }
            
            return res.status(400).json({
                error: "Failed to connect to MongoDB Atlas",
                message: errorMessage,
                technical: connectionError.message,
                errorType: errorType,
                status: "error"
            });
        }
    } catch (error) {
        console.error('Unexpected error in validation route:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
            error: "Internal server error during validation", 
            message: error.message,
            technical: "Si è verificato un errore imprevisto durante la validazione della connessione.",
            status: "error"
        });
    } finally {
        // Close the connection if it was opened
        if (connection) {
            try {
                await connection.close();
                console.log('Closed connection after validation');
            } catch (err) {
                console.error('Error closing connection after validation:', err);
            }
        }
    }
});

// GET /api/items/download/json - Download all items as JSON
router.get('/download/json', async (req, res) => {
    try {
        console.log('Received download request');
        // Get cluster URL from query params - don't further encode or decode it
        const clusterUrl = req.query.clusterUrl;
        
        // Immediately check if URL is missing or completely malformed
        if (!clusterUrl) {
            console.error('Missing MongoDB connection string for download');
            return res.status(400).json({ 
                error: "MongoDB Atlas URL is required",
                status: "error",
                errorType: "missing_url"
            });
        }
        
        // Log a safe version of the URL (hiding credentials)
        try {
            const safeUrl = getSafeConnectionStringForLogging(clusterUrl);
            console.log('Download using connection string:', safeUrl);
        } catch (logError) {
            console.log('Download using connection string: [Error logging URL safely]');
        }
        
        // Validate the URL format
        if (!clusterUrl.startsWith('mongodb://') && !clusterUrl.startsWith('mongodb+srv://')) {
            console.error('Invalid MongoDB URI format detected in download request');
            return res.status(400).json({
                error: "Connection to MongoDB failed: Invalid MongoDB URI format. URI must start with \"mongodb://\" or \"mongodb+srv://\"",
                message: "L'URL del cluster MongoDB non è nel formato corretto. Deve iniziare con \"mongodb://\" o \"mongodb+srv://\"",
                status: "error",
                errorType: "invalid_format"
            });
        }
        
        // Additional URL validation to prevent common errors
        const validationResult = validateMongoDBUrl(clusterUrl);
        if (!validationResult.valid) {
            console.error('MongoDB URL validation failed for download:', validationResult.reason);
            return res.status(400).json({
                error: `Connection to MongoDB failed: ${validationResult.reason}`,
                message: `URL non valido: ${validationResult.message}`,
                status: "error",
                errorType: "invalid_url",
                details: validationResult.details
            });
        }
        
        // Show a processing message in the response headers
        res.setHeader('X-Processing', 'Retrieving data from MongoDB Atlas');
        
        try {
            console.log('Starting MongoDB Atlas data export...');
            // Start fetching MongoDB data
            const exportData = await exportItemsAsJson(clusterUrl);
            
            // Generate a timestamp for the filename
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const dbName = exportData.database || 'mongodb';
            const filename = `${dbName}-export-${timestamp}.json`;
            
            console.log(`Export completed successfully. Preparing file: ${filename}`);
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            
            // Properly stringify the JSON data and send as a file
            const jsonData = JSON.stringify(exportData, null, 2);
            console.log(`Sending response with ${jsonData.length} bytes of data`);
            res.send(jsonData);
        } catch (connectionError) {
            // Handle MongoDB connection errors specifically
            console.error('MongoDB connection or export error:', connectionError);
            return res.status(400).json({
                error: "Failed to export data from MongoDB",
                message: connectionError.message,
                status: "error"
            });
        }
    } catch (error) {
        console.error('Error in download route:', error);
        res.status(500).json({ 
            error: "Failed to download data from MongoDB", 
            message: error.message || "Unknown error",
            details: error.stack || "No stack trace available",
            status: "error"
        });
    }
});

// GET /api/items - Get all items
router.get('/', async (req, res) => {
    try {
        const clusterUrl = req.query.clusterUrl;
        if (!clusterUrl) {
            return res.status(400).json({ 
                error: "MongoDB cluster URL is required",
                status: "error"
            });
        }
        
        const items = await getAllItems(clusterUrl);
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ 
            error: error.message || "Internal server error",
            status: "error"
        });
    }
});

// GET /api/items/:id - Get item by ID
router.get('/:id', async (req, res) => {
    try {
        const clusterUrl = req.query.clusterUrl;
        if (!clusterUrl) {
            return res.status(400).json({ 
                error: "MongoDB cluster URL is required",
                status: "error"
            });
        }
        
        const item = await getItemById(req.params.id, clusterUrl);
        if (!item) {
            return res.status(404).json({ 
                error: "Item not found",
                status: "error"
            });
        }
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ 
            error: error.message || "Internal server error",
            status: "error"
        });
    }
});

// Helper function to mask sensitive parts of connection string for logging
function getSafeConnectionStringForLogging(connectionString) {
    if (!connectionString) return 'undefined';
    
    try {
        // Check if it's a valid MongoDB URL format
        if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
            return '[Invalid format]';
        }
        
        // Try to mask password in the URL
        if (connectionString.includes('@')) {
            const parts = connectionString.split('@');
            const credentialsPart = parts[0];
            const hostPart = parts[1];
            
            // Extract protocol and username
            const protocolSplit = credentialsPart.split('://');
            const protocol = protocolSplit[0] + '://';
            const userPass = protocolSplit[1];
            
            if (userPass.includes(':')) {
                const [username] = userPass.split(':');
                // Return masked version
                return `${protocol}${username}:****@${hostPart}`;
            } else {
                return `${protocol}${userPass}@${hostPart}`;
            }
        }
        
        // If no @ symbol, just return the protocol part
        return connectionString.split('//')[0] + '//*****';
    } catch (error) {
        // If any error occurs during masking, return a placeholder
        console.error('Error masking connection string:', error);
        return '[Error masking URL]';
    }
}

// Validate MongoDB URL for common problems
function validateMongoDBUrl(url) {
    // Return object with validation result
    const result = {
        valid: true,
        reason: null,
        message: null,
        details: {}
    };
    
    try {
        // Check for minimum URL parts
        if (!url.includes('@')) {
            result.valid = false;
            result.reason = 'Missing authentication information';
            result.message = 'Mancano le informazioni di autenticazione (username:password@)';
            return result;
        }
        
        // Check for credentials
        const [credentialPart, hostPart] = url.split('@');
        const protocal = credentialPart.split('://')[0];
        const credentials = credentialPart.split('://')[1];
        
        if (!credentials || !credentials.includes(':')) {
            result.valid = false;
            result.reason = 'Invalid credential format in connection string';
            result.message = 'Formato delle credenziali non valido (deve essere username:password)';
            result.details.credentials = 'missing or malformed';
            return result;
        }
        
        const [username, password] = credentials.split(':');
        
        if (!username || username.trim() === '') {
            result.valid = false;
            result.reason = 'Username is missing or empty';
            result.message = 'Username mancante o vuoto';
            result.details.username = 'missing';
            return result;
        }
        
        if (!password || password.trim() === '') {
            result.valid = false;
            result.reason = 'Password is missing or empty';
            result.message = 'Password mancante o vuota';
            result.details.password = 'missing';
            return result;
        }
        
        // Check for host part
        if (!hostPart || hostPart.trim() === '') {
            result.valid = false;
            result.reason = 'Missing host information';
            result.message = 'Informazioni sull\'host mancanti';
            result.details.host = 'missing';
            return result;
        }
        
        // Basic hostname validation
        const hostClean = hostPart.split('/')[0];
        if (!hostClean.includes('.')) {
            result.valid = false;
            result.reason = 'Invalid hostname format';
            result.message = 'Formato dell\'hostname non valido';
            result.details.host = 'invalid format';
            return result;
        }
        
        // All checks passed
        return result;
    } catch (error) {
        // Any error during validation means the URL is likely invalid
        result.valid = false;
        result.reason = 'Error validating connection string: ' + error.message;
        result.message = 'Errore durante la validazione della stringa di connessione';
        result.details.error = error.message;
        return result;
    }
}

module.exports = router; 
