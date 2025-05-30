const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();

// Abilita il debug dettagliato per MongoDB
mongoose.set('debug', true);

// Registra le informazioni di avvio del server
console.log('Inzializzando il server...');
console.log('Versione di Node.js:', process.version);
console.log('Versione di Mongoose:', mongoose.version);
console.log('Porta del server:', process.env.PORT || 3000);

const itemRoutes = require('./routes/itemRoutes');
const connectDB = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Per analizzare i dati codificati nell'URL

// Aggiungi middleware per il logging delle richieste
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servi file statici dalla directory public
app.use(express.static(path.join(__dirname, 'public')));

// Route di fallback per servire index.html alla radice
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route API
app.use('/api/items', itemRoutes);

// Aggiungi endpoint di test del server
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running properly' });
});

// Middleware per la gestione degli errori
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    console.error('Error Stack:', err.stack);
    
    // Invia informazioni più dettagliate sull'errore
    res.status(500).json({ 
        error: "Errore interno del server",
        message: err.message || "Nessun messaggio di errore disponibile",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Gestione degli errori del processo
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server avviato con successo e in ascolto sulla porta ${PORT}`);
    console.log(`Apri http://localhost:${PORT} per vedere la pagina`);
    console.log(`Test server all'indirizzo http://localhost:${PORT}/api/test`);
});