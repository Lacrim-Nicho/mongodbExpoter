// Aggiunge stili per l'interfaccia di debug
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .debug-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 999;
            backdrop-filter: blur(3px);
        }
        
        .debug-info {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--background-color);
            border: 2px solid var(--accent-primary);
            border-radius: 8px;
            padding: 20px;
            max-width: 90%;
            width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }
        
        .debug-info h3, .debug-info h4 {
            color: var(--accent-primary);
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        .debug-info p {
            margin: 8px 0;
        }
        
        .debug-btn {
            background: var(--accent-secondary);
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 10px 5px 10px 0;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .debug-btn:hover {
            background: var(--accent-primary);
        }
        
        .url-analysis {
            background: rgba(0,0,0,0.05);
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
        }
        
        .code {
            font-family: monospace;
            background: rgba(0,0,0,0.1);
            padding: 2px 4px;
            border-radius: 3px;
            word-break: break-all;
        }
        
        .url-fix {
            background: rgba(0,100,0,0.1);
            border-left: 4px solid #28a745;
            padding: 10px;
            margin-top: 20px;
        }
        
        .debug-info ul, .debug-info ol {
            margin-left: 20px;
        }
        
        .debug-info li {
            margin: 5px 0;
        }
        
        .debug-button {
            display: inline-block;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .debug-button:hover {
            background-color: #5a6268;
        }
        
        .test-result {
            margin-top: 15px;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            background-color: rgba(0,0,0,0.05);
        }
        
        .test-result .success {
            color: #28a745;
        }
        
        .test-result .error {
            color: #dc3545;
        }
    `;
    document.head.appendChild(style);
    
    initTheme();
    initUI();
});


// Inizializza il tema in base alle preferenze dell'utente o all'impostazione salvata
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Controlla se l'utente preferisce la modalità scura
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Inizializza le interazioni dell'interfaccia utente
function initUI() {
    // Pulsante per cambiare tema
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Aggiunge effetto ondulazione ai pulsanti
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Aggiunge eventi di focus animati all'input
    const input = document.getElementById('clusterUrl');
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
    });
    
    // Aggiunge icona animata all'area dei risultati
    updateResultIcon();
}

// Alterna tra tema chiaro e scuro
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Aggiunge un bell'effetto di transizione
    document.body.classList.add('theme-transition');
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 1000);
}

// Crea effetto ondulazione al clic del pulsante
function createRipple(event) {
    const button = event.currentTarget;
    
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
}

// Aggiorna l'icona nell'area dei risultati in base allo stato
function updateResultIcon(status = 'info') {
    const resultHeader = document.querySelector('.result-header');
    const icon = resultHeader.querySelector('i');
    
    // Rimuove tutte le classi precedenti
    icon.className = '';
    
    // Aggiunge l'icona appropriata in base allo stato
    if (status === 'error') {
        icon.classList.add('fas', 'fa-exclamation-circle');
        resultHeader.style.backgroundColor = 'var(--error-color)';
    } else if (status === 'success') {
        icon.classList.add('fas', 'fa-check-circle');
        resultHeader.style.backgroundColor = 'var(--success-color)';
    } else {
        icon.classList.add('fas', 'fa-info-circle');
        resultHeader.style.backgroundColor = 'var(--accent-primary)';
    }
}

// Aggiunge una funzione per aiutare a risolvere i problemi di connessione
function showDebugInfo() {
    // Crea overlay
    const debugOverlay = document.createElement('div');
    debugOverlay.className = 'debug-overlay';
    document.body.appendChild(debugOverlay);
    
    const debugContainer = document.createElement('div');
    debugContainer.className = 'debug-info';
    
    const clusterUrl = document.getElementById('clusterUrl').value.trim();
    let maskedUrl = clusterUrl;
    if (clusterUrl.includes('@')) {
        const parts = clusterUrl.split('@');
        const credentials = parts[0].split('://')[1].split(':');
        const username = credentials[0];
        const maskedUsername = username.substring(0, 2) + '***';
        maskedUrl = clusterUrl.replace(username, maskedUsername).replace(/:[^:@]+@/, ':***@');
    }
    
    // Controlla se l'URL ha il parametro authSource
    const hasAuthSource = clusterUrl.includes('authSource=');
    
    // Controlla se l'URL ha un database specificato
    const urlParts = clusterUrl.split('?')[0].split('/');
    const hasDatabase = urlParts.length > 4 && urlParts[4] !== '';
    
    // Diagnostica avanzata dell'URL
    const urlAnalysis = analyzeMongoURL(clusterUrl);
    
    debugContainer.innerHTML = `
        <h3>Informazioni di Debug</h3>
        <p>User Agent: ${navigator.userAgent}</p>
        <p>Ora Attuale: ${new Date().toISOString()}</p>
        <p>Validazione Formato URL di Connessione: 
            <span id="url-validation-result">Non controllato</span>
        </p>
        <p>Stringa di Connessione: <span id="connection-string-preview">Non impostata</span></p>
        <p><strong>Database Specificato:</strong> ${hasDatabase ? 'Sì' : 'No'}</p>
        <p><strong>Parametro authSource Presente:</strong> ${hasAuthSource ? 'Sì' : 'No'}</p>
        
        <div class="url-analysis">
            <h4>Analisi URL</h4>
            <p><strong>Protocollo:</strong> <span class="${urlAnalysis.protocol.valid ? 'valid' : 'invalid'}">${urlAnalysis.protocol.value} ${urlAnalysis.protocol.valid ? '✓' : '✗'}</span></p>
            <p><strong>Nome Utente:</strong> <span class="${urlAnalysis.username.valid ? 'valid' : 'invalid'}">${urlAnalysis.username.value} ${urlAnalysis.username.valid ? '✓' : '✗'}</span></p>
            <p><strong>Password:</strong> <span class="${urlAnalysis.password.valid ? 'valid' : 'invalid'}">Fornita ${urlAnalysis.password.valid ? '✓' : '✗'}</span></p>
            <p><strong>Nome Host:</strong> <span class="${urlAnalysis.hostname.valid ? 'valid' : 'invalid'}">${urlAnalysis.hostname.value} ${urlAnalysis.hostname.valid ? '✓' : '✗'}</span></p>
            <p><strong>Database:</strong> <span class="${urlAnalysis.database.valid ? 'valid' : 'invalid'}">${urlAnalysis.database.value} ${urlAnalysis.database.valid ? '✓' : '✗'}</span></p>
            <p><strong>Parametri:</strong> <span class="${urlAnalysis.params.valid ? 'valid' : 'invalid'}">${urlAnalysis.params.value} ${urlAnalysis.params.valid ? '✓' : '✗'}</span></p>
        </div>
        
        <h4>Possibili Problemi:</h4>
        <ul id="possible-issues">
            ${!hasDatabase ? '<li>Nessun database specificato nell\'URL. Prova ad aggiungere un nome di database dopo l\'host.</li>' : ''}
            ${!hasAuthSource ? '<li>Nessun parametro authSource. Prova ad aggiungere ?authSource=admin alla tua stringa di connessione.</li>' : ''}
            ${urlAnalysis.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
        
        <h4>Passaggi per la Risoluzione dei Problemi:</h4>
        <ol>
            <li>Verifica che il tuo utente MongoDB Atlas abbia i privilegi <strong>readWriteAnyDatabase</strong> o <strong>Atlas Admin</strong></li>
            <li>Controlla che il tuo indirizzo IP sia nella whitelist nelle impostazioni di Network Access di MongoDB Atlas</li>
            <li>Prova ad aggiungere <code>?authSource=admin</code> alla tua stringa di connessione se non è già presente</li>
            <li>Assicurati che la tua password non contenga caratteri speciali che necessitano di codifica URL</li>
            <li>Prova a specificare un nome di database nella tua stringa di connessione</li>
            <li>Verifica che il nome del cluster sia corretto (controlla la dashboard di MongoDB Atlas)</li>
            <li>Assicurati che il cluster sia attivo e non in pausa</li>
        </ol>
        <button id="test-server" class="debug-btn">Testa Connessione al Server</button>
        <button id="fix-url" class="debug-btn">Suggerisci Correzioni URL</button>
        <button id="close-debug" class="debug-btn">Chiudi</button>
    `;
    
    document.body.appendChild(debugContainer);
    
    // Aggiunge stili per gli indicatori di validazione
    const style = document.createElement('style');
    style.setAttribute('data-debug-style', 'true');
    style.textContent = `
        .url-analysis .valid { color: #28a745; font-weight: bold; }
        .url-analysis .invalid { color: #dc3545; font-weight: bold; }
    `;
    document.head.appendChild(style);
    
    // Valida il formato dell'URL corrente
    const urlValidationResult = document.getElementById('url-validation-result');
    
    if (!clusterUrl) {
        urlValidationResult.textContent = 'Nessun URL inserito';
        urlValidationResult.style.color = 'var(--error-color)';
    } else if (clusterUrl.startsWith('mongodb://') || clusterUrl.startsWith('mongodb+srv://')) {
        urlValidationResult.textContent = 'Formato valido ✓';
        urlValidationResult.style.color = 'var(--success-color)';
    } else {
        urlValidationResult.textContent = 'Formato non valido ✗';
        urlValidationResult.style.color = 'var(--error-color)';
    }
    
    // Mostra una versione mascherata della stringa di connessione per privacy
    const connectionStringPreview = document.getElementById('connection-string-preview');
    if (clusterUrl) {
        connectionStringPreview.textContent = maskedUrl;
    } else {
        connectionStringPreview.textContent = 'Non impostata';
    }
    
    // Aggiunge event listener per il pulsante di test del server
    document.getElementById('test-server').addEventListener('click', testConnection);
    
    // Aggiunge event listener per il pulsante di correzione URL
    document.getElementById('fix-url').addEventListener('click', () => suggestURLFixes(clusterUrl));
    
    // Aggiunge event listener per il pulsante di chiusura
    document.getElementById('close-debug').addEventListener('click', () => {
        document.body.removeChild(debugContainer);
        document.body.removeChild(debugOverlay);
        document.head.removeChild(style);
    });
}

// Funzione per analizzare un URL MongoDB e trovare potenziali problemi
function analyzeMongoURL(url) {
    const analysis = {
        protocol: { value: 'Non specificato', valid: false },
        username: { value: 'Non specificato', valid: false },
        password: { value: 'Non specificato', valid: false },
        hostname: { value: 'Non specificato', valid: false },
        database: { value: 'Non specificato', valid: false },
        params: { value: 'Nessuno', valid: true }, // I parametri sono opzionali
        issues: []
    };
    
    if (!url) {
        analysis.issues.push('L\'URL è vuoto');
        return analysis;
    }
    
    // Controlla il protocollo
    if (url.startsWith('mongodb://')) {
        analysis.protocol.value = 'mongodb://';
        analysis.protocol.valid = true;
    } else if (url.startsWith('mongodb+srv://')) {
        analysis.protocol.value = 'mongodb+srv://';
        analysis.protocol.valid = true;
    } else {
        analysis.protocol.value = 'Non valido';
        analysis.protocol.valid = false;
        analysis.issues.push('Protocollo non valido. Deve iniziare con mongodb:// o mongodb+srv://');
    }
    
    if (!analysis.protocol.valid) {
        return analysis; // Interrompe l'analisi se il protocollo non è valido
    }
    
    try {
        // Estrae credenziali e host
        const urlWithoutProtocol = url.replace(/^(mongodb(\+srv)?:\/\/)/, '');
        
        // Controlla se le credenziali sono presenti
        if (urlWithoutProtocol.includes('@')) {
            const parts = urlWithoutProtocol.split('@');
            const credentials = parts[0].split(':');
            
            if (credentials.length >= 1) {
                analysis.username.value = credentials[0];
                analysis.username.valid = credentials[0].length > 0;
                if (!analysis.username.valid) {
                    analysis.issues.push('Il nome utente è vuoto');
                }
            }
            
            if (credentials.length >= 2) {
                // Non mostra la password effettiva per sicurezza
                analysis.password.value = 'Fornita';
                analysis.password.valid = credentials[1].length > 0;
                if (!analysis.password.valid) {
                    analysis.issues.push('La password è vuota');
                } else if (credentials[1].includes('%')) {
                    analysis.issues.push('La password contiene caratteri codificati URL, che potrebbero causare problemi se codificati due volte');
                } else if (/[#&=+:;,]/g.test(credentials[1])) {
                    analysis.issues.push('La password contiene caratteri speciali che potrebbero richiedere la codifica URL');
                }
            } else {
                analysis.password.value = 'Non fornita';
                analysis.password.valid = false;
                analysis.issues.push('La password è mancante');
            }
            
            // Estrae la parte dell'host
            const hostPart = parts[1];
            
            // Controlla il nome del database
            if (hostPart.includes('/')) {
                const hostParts = hostPart.split('/');
                analysis.hostname.value = hostParts[0];
                analysis.hostname.valid = hostParts[0].length > 0;
                
                if (!analysis.hostname.valid) {
                    analysis.issues.push('Il nome host è vuoto');
                } else if (!analysis.hostname.value.includes('.')) {
                    analysis.issues.push('Il nome host potrebbe essere errato (dominio mancante)');
                } else {
                    // Verifica rigorosa del dominio MongoDB.net
                    const correctDomain = 'mongodb.net';
                    if (analysis.hostname.value.includes('mongodb.net')) {
                        // Controlla se il dominio è esattamente 'mongodb.net' e non una variante come 'monodb.net'
                        if (!analysis.hostname.value.includes(correctDomain)) {
                            analysis.hostname.valid = false;
                            analysis.issues.push(`Il dominio contiene un errore di battitura. Trovato un dominio simile a '${correctDomain}' ma non corretto. Verifica che sia esattamente '${correctDomain}'`);
                        }
                    } else if (!analysis.hostname.value.includes('localhost')) {
                        analysis.hostname.valid = false;
                        analysis.issues.push('Il nome host non sembra un dominio standard di MongoDB Atlas. Dovrebbe contenere "mongodb.net"');
                    }
                }
                
                // Estrae il nome del database (prima dei parametri di query, se presenti)
                if (hostParts.length > 1) {
                    let dbName = hostParts[1];
                    if (dbName.includes('?')) {
                        dbName = dbName.split('?')[0];
                    }
                    
                    analysis.database.value = dbName;
                    analysis.database.valid = dbName.length > 0;
                    
                    if (!analysis.database.valid) {
                        analysis.issues.push('Il nome del database è specificato ma vuoto');
                    }
                } else {
                    analysis.database.valid = false;
                    analysis.issues.push('Nessun database specificato nell\'URL');
                }
            } else {
                analysis.hostname.value = hostPart;
                analysis.hostname.valid = hostPart.length > 0;
                analysis.database.valid = false;
                analysis.issues.push('Nessun database specificato nell\'URL');
            }
        } else {
            analysis.username.valid = false;
            analysis.password.valid = false;
            analysis.hostname.value = urlWithoutProtocol.split('/')[0];
            analysis.hostname.valid = analysis.hostname.value.length > 0;
            analysis.issues.push('Nessuna credenziale di autenticazione nell\'URL');
        }
        
        // Controlla i parametri di query
        if (url.includes('?')) {
            const params = url.split('?')[1];
            analysis.params.value = params;
            
            // Verifica più rigorosa dei parametri
            const paramPairs = params.split('&');
            const paramMap = {};
            
            // Crea una mappa dei parametri per un controllo più facile
            paramPairs.forEach(pair => {
                if (pair.includes('=')) {
                    const [key, value] = pair.split('=');
                    paramMap[key] = value;
                }
            });
            
            // Controlla il parametro authSource
            if (!paramMap.hasOwnProperty('authSource')) {
                analysis.issues.push('Nessun parametro authSource. Considera di aggiungere ?authSource=admin');
            } else if (paramMap.authSource !== 'admin') {
                analysis.issues.push(`Il valore del parametro authSource è '${paramMap.authSource}', ma il valore consigliato è 'admin'`);
            }
            
            // Controlla il parametro retryWrites
            if (!paramMap.hasOwnProperty('retryWrites')) {
                analysis.issues.push('Nessun parametro retryWrites. Considera di aggiungere retryWrites=true');
            } else if (paramMap.retryWrites !== 'true') {
                analysis.issues.push(`Il valore del parametro retryWrites è '${paramMap.retryWrites}', ma il valore consigliato è 'true'`);
            }
            
            // Controlla il parametro w
            if (!paramMap.hasOwnProperty('w')) {
                analysis.issues.push('Nessun parametro w. Considera di aggiungere w=majority per una migliore affidabilità');
            } else if (paramMap.w !== 'majority') {
                analysis.issues.push(`Il valore del parametro w è '${paramMap.w}', ma il valore consigliato è 'majority'`);
            }
        } else {
            analysis.params.value = 'Nessuno';
            analysis.issues.push('Nessun parametro di query. Considera di aggiungere ?authSource=admin&retryWrites=true&w=majority');
        }
    } catch (error) {
        analysis.issues.push(`Errore nell'analisi dell'URL: ${error.message}`);
    }
    
    return analysis;
}

// Funzione per suggerire correzioni per problemi comuni negli URL di connessione MongoDB
function suggestURLFixes(url) {
    if (!url) {
        alert('Inserisci prima un URL di connessione MongoDB');
        return;
    }
    
    const analysis = analyzeMongoURL(url);
    let fixedUrl = url;
    let changes = [];
    
    // Corregge il protocollo se necessario
    if (!analysis.protocol.valid) {
        fixedUrl = 'mongodb+srv://' + fixedUrl;
        changes.push('Aggiunto protocollo mongodb+srv://');
    }
    
    // Assicura che l'URL abbia un database
    if (!analysis.database.valid) {
        // Find the right place to insert the database name
        if (fixedUrl.includes('?')) {
            // L'URL ha parametri
            const parts = fixedUrl.split('?');
            if (parts[0].endsWith('/')) {
                fixedUrl = parts[0] + 'admin?' + parts[1];
            } else {
                fixedUrl = parts[0] + '/admin?' + parts[1];
            }
        } else {
            // L'URL non ha parametri
            if (fixedUrl.endsWith('/')) {
                fixedUrl = fixedUrl + 'admin';
            } else {
                fixedUrl = fixedUrl + '/admin';
            }
        }
        changes.push('Aggiunto database predefinito "admin"');
    }
    
    // Aggiunge i parametri mancanti
    if (!fixedUrl.includes('?')) {
        fixedUrl += '?authSource=admin&retryWrites=true&w=majority';
        changes.push('Aggiunti parametri di connessione standard');
    } else {
        if (!fixedUrl.includes('authSource=')) {
            fixedUrl += '&authSource=admin';
            changes.push('Aggiunto parametro authSource=admin');
        }
        if (!fixedUrl.includes('retryWrites=')) {
            fixedUrl += '&retryWrites=true';
            changes.push('Aggiunto parametro retryWrites=true');
        }
        if (!fixedUrl.includes('w=')) {
            fixedUrl += '&w=majority';
            changes.push('Aggiunto parametro w=majority');
        }
    }
    
    // Mostra la correzione suggerita
    const debugInfo = document.querySelector('.debug-info');
    const fixSection = document.createElement('div');
    fixSection.className = 'url-fix';
    fixSection.innerHTML = `
        <h4>Correzioni URL Suggerite</h4>
        <p><strong>URL Originale:</strong> <span class="code">${url}</span></p>
        <p><strong>URL Corretto:</strong> <span class="code">${fixedUrl}</span></p>
        <p><strong>Modifiche Effettuate:</strong></p>
        <ul>
            ${changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
        <button id="apply-fix" class="debug-btn">Applica Correzione</button>
    `;
    
    // Rimuove qualsiasi sezione di correzione esistente
    const existingFix = debugInfo.querySelector('.url-fix');
    if (existingFix) {
        debugInfo.removeChild(existingFix);
    }
    
    debugInfo.appendChild(fixSection);
    
    // Aggiunge event listener per il pulsante di applicazione correzione
    document.getElementById('apply-fix').addEventListener('click', () => {
        document.getElementById('clusterUrl').value = fixedUrl;
        // Trova e rimuove le informazioni di debug e l'overlay
        const debugInfo = document.querySelector('.debug-info');
        const debugOverlay = document.querySelector('.debug-overlay');
        if (debugInfo) document.body.removeChild(debugInfo);
        if (debugOverlay) document.body.removeChild(debugOverlay);
        // Rimuove anche l'elemento style
        const debugStyle = document.head.querySelector('style[data-debug-style]');
        if (debugStyle) document.head.removeChild(debugStyle);
        
        alert('URL corretto applicato al campo della stringa di connessione');
    });
}

async function testConnection() {
    const clusterUrl = document.getElementById('clusterUrl').value.trim();
    
    if (!clusterUrl) {
        alert('Inserisci prima una stringa di connessione MongoDB');
        return;
    }
    
    // Validazione URL di base
    if (!clusterUrl.startsWith('mongodb://') && !clusterUrl.startsWith('mongodb+srv://')) {
        alert('Formato stringa di connessione non valido. Deve iniziare con mongodb:// o mongodb+srv://');
        return;
    }
    
    try {
        // Mostra messaggio di test
        const debugInfo = document.querySelector('.debug-info');
        const testResult = document.createElement('div');
        testResult.className = 'test-result';
        testResult.innerHTML = '<p>Test della connessione in corso... attendere prego</p>';
        debugInfo.appendChild(testResult);
        
        // Prova a validare la connessione
        const validateUrl = `/api/items/validate?clusterUrl=${encodeURIComponent(clusterUrl)}`;
        const response = await fetch(validateUrl);
        const data = await response.json();
        
        // Aggiorna il risultato del test
        if (response.ok) {
            testResult.innerHTML = `
                <p class="success">✅ Connessione riuscita!</p>
                <p>Connesso al database: ${data.database}</p>
                <p>Collezioni trovate: ${data.collectionsCount}</p>
                <p>Nomi delle collezioni: ${data.collections ? data.collections.join(', ') : 'Nessuna'}</p>
            `;
        } else {
            // Formatta il messaggio di errore con più dettagli per aiutare a diagnosticare il problema
            let errorDetails = '';
            let troubleshooting = '';
            
            if (data.errorType) {
                switch(data.errorType) {
                    case 'auth_failed':
                        errorDetails = 'Errore di autenticazione - controlla nome utente e password';
                        troubleshooting = `
                            <li>Verifica nome utente e password nella stringa di connessione</li>
                            <li>Assicurati che i caratteri speciali nella password siano codificati correttamente</li>
                            <li>Controlla la dashboard di MongoDB Atlas per le credenziali corrette</li>
                        `;
                        break;
                    case 'host_not_found':
                        errorDetails = 'Host non trovato - controlla URL del cluster';
                        troubleshooting = `
                            <li>Verifica l'indirizzo del cluster nella dashboard di MongoDB Atlas</li>
                            <li>Assicurati di utilizzare il nome del cluster corretto</li>
                        `;
                        break;
                    case 'timeout':
                        errorDetails = 'Timeout di connessione';
                        troubleshooting = `
                            <li>Controlla la tua connessione di rete</li>
                            <li>Assicurati che MongoDB Atlas non sia in manutenzione</li>
                            <li>Verifica che il cluster non sia in pausa</li>
                        `;
                        break;
                    case 'invalid_uri':
                        errorDetails = 'Formato stringa di connessione non valido';
                        troubleshooting = `
                            <li>Controlla la sintassi della tua stringa di connessione</li>
                            <li>Assicurati di includere il nome del database</li>
                        `;
                        break;
                    case 'server_selection':
                        errorDetails = 'Timeout selezione server';
                        troubleshooting = `
                            <li>Controlla se il tuo IP è nella whitelist di MongoDB Atlas</li>
                            <li>Assicurati che il cluster sia attivo (non in pausa)</li>
                        `;
                        break;
                    case 'permission_error':
                        errorDetails = 'Permesso negato';
                        troubleshooting = `
                            <li>Controlla i permessi utente nella dashboard di MongoDB Atlas</li>
                            <li>Aggiungi il ruolo readWrite o readWriteAnyDatabase al tuo utente</li>
                            <li>Prova a creare prima una collezione nel database</li>
                        `;
                        break;
                    default:
                        errorDetails = 'Errore sconosciuto';
                        troubleshooting = `
                            <li>Controlla lo stato del cluster nella dashboard di MongoDB Atlas</li>
                            <li>Prova a creare un nuovo utente con privilegi di amministratore</li>
                        `;
                }
            }
            
            testResult.innerHTML = `
                <p class="error">❌ Connessione fallita</p>
                <p><strong>Tipo di errore:</strong> ${errorDetails}</p>
                <p><strong>Messaggio di errore:</strong> ${data.message || data.error || 'Errore sconosciuto'}</p>
                ${data.technical ? `<p><strong>Dettagli tecnici:</strong> ${data.technical}</p>` : ''}
                <hr>
                <p><strong>Risoluzione problemi:</strong></p>
                <ul>
                    ${troubleshooting || `
                        <li>Controlla la tua stringa di connessione MongoDB Atlas</li>
                        <li>Verifica la connettività di rete</li>
                        <li>Controlla i permessi utente</li>
                    `}
                </ul>
                <p>Prova ad aggiungere <code>?authSource=admin</code> alla tua stringa di connessione se non presente</p>
                <button id="retry-connection" class="debug-btn">Riprova</button>
            `;
            
            // Aggiunge event listener al pulsante di ripetizione
            const retryButton = testResult.querySelector('#retry-connection');
            if (retryButton) {
                retryButton.addEventListener('click', testConnection);
            }
        }
    } catch (error) {
        console.error('Test connection error:', error);
        const testResult = document.querySelector('.test-result');
        if (testResult) {
            testResult.innerHTML = `
                <p class="error">❌ Test fallito</p>
                <p>Errore: ${error.message}</p>
                <p>Potrebbe essere un errore di rete o del server. Controlla la tua connessione internet e riprova.</p>
                <button id="retry-connection" class="debug-btn">Riprova</button>
            `;
            
            // Aggiunge event listener al pulsante di ripetizione
            const retryButton = testResult.querySelector('#retry-connection');
            if (retryButton) {
                retryButton.addEventListener('click', testConnection);
            }
        }
    }
}

// Funzione per codificare in modo sicuro la stringa di connessione MongoDB
function encodeMongoURI(uri) {
    // Prima, rimuovi eventuali spazi bianchi che potrebbero essere presenti
    uri = uri.trim();
    
    // Registra il formato originale per il debug
    console.log('Controllo formato URI originale:', 
        uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://') ? 'Valido' : 'Non valido');
    
    // CRITICO: Assicurati che il protocollo URI non venga modificato
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
        console.error('Formato URI MongoDB non valido rilevato prima della codifica');
        return uri; // Restituisci così com'è per evitare ulteriori problemi
    }
    
    // Per la sicurezza dei parametri di query, passeremo l'URI così com'è
    // Questo previene qualsiasi problema di codifica con il protocollo
    return uri;
}

// Funzione per gestire gli errori di rete in modo elegante
function handleNetworkError(error, message = null) {
    console.error('Network error:', error);
    
    // Ottiene un messaggio di errore specifico
    let errorMessage;
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossibile contattare il server. Verifica la tua connessione internet.';
    } else if (error.name === 'AbortError') {
        errorMessage = 'La richiesta è stata interrotta a causa di un timeout.';
    } else {
        errorMessage = message || `Errore di rete: ${error.message}`;
    }
    
    // Mostra l'errore all'utente
    displayError(errorMessage);
    
    // Aggiunge un pulsante di debug per diagnostica dettagliata
    const resultContent = document.querySelector('.result-content');
    if (resultContent) {
        // Aggiunge un pulsante di debug alla fine
        const debugButton = document.createElement('button');
        debugButton.innerText = 'Debug Connessione';
        debugButton.className = 'debug-button';
        debugButton.addEventListener('click', showDebugInfo);
        resultContent.appendChild(debugButton);
        
        // Aggiungi pulsante di ripetizione con funzionalità di reset migliorata
        const retryButton = document.createElement('button');
        retryButton.innerText = 'Riprova';
        retryButton.className = 'debug-button retry-button';
        retryButton.style.marginLeft = '10px';
        retryButton.addEventListener('click', function() {
            // Cancella prima lo stato di errore corrente
            if (resultContent) {
                resultContent.innerHTML = '';
                resultContent.className = 'result-content';
            }
            // Reimposta eventuali indicatori visivi di errore
            updateResultIcon('info');
            // Mostra messaggio di caricamento temporaneo
            displayInfo('Preparazione nuovo tentativo...');
            // Leggero ritardo prima di riprovare per assicurarsi che l'interfaccia utente sia aggiornata
            setTimeout(downloadMongoData, 300);
        });
        resultContent.appendChild(retryButton);
    }
}

async function downloadMongoData() {
    try {
        // Clear any previous error state
        const resultContent = document.querySelector('.result-content');
        if (resultContent) {
            // Rimuove eventuali messaggi di errore e pulsanti precedenti
            resultContent.innerHTML = '';
            resultContent.className = 'result-content'; // Reset class
        }
        
        // Mostra lo stato di caricamento
        displayInfo('Inizializzazione del processo di download...');
        
        // Ottiene l'URL del cluster e rimuove eventuali spazi bianchi
        const clusterUrl = document.getElementById('clusterUrl').value.trim();
        
        console.log('Original input URL:', clusterUrl);
        
        // Controlla se l'URL del cluster è stato fornito
        if (!clusterUrl) {
            displayError('È necessario inserire l\'URL del cluster MongoDB per continuare.');
            return;
        }
        
        // Validazione di base dell'URL - QUESTO È CRITICO
        if (!clusterUrl.startsWith('mongodb://') && !clusterUrl.startsWith('mongodb+srv://')) {
            displayError('URL del cluster non valido. L\'URL deve iniziare con "mongodb://" o "mongodb+srv://"');
            return;
        }
        
        displayInfo('Avvio del processo di download...');
        
        // Mostra l'indicatore di caricamento
        if (resultContent) {
            resultContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Connessione al database in corso...</p>
                </div>
            `;
        }
        
        // Usa l'URL originale - non codificarlo poiché potrebbe corrompere il formato
        const mongodbUrl = clusterUrl;
        console.log('Using MongoDB URL directly without encoding');
        
        // Aggiunge pulsante di debug per la risoluzione dei problemi
        const debugButton = document.createElement('button');
        debugButton.innerText = 'Debug Connessione';
        debugButton.className = 'debug-button';
        debugButton.addEventListener('click', showDebugInfo);
        resultContent.querySelector('.loading').appendChild(debugButton);
        
        // First validate the connection
        try {
            displayInfo('Verifica della connessione al cluster MongoDB Atlas...');
            
            console.log('Sending validation request to server');
            
            // Prima, analizza l'URL per individuare problemi evidenti prima di effettuare una richiesta al server
            const urlAnalysis = analyzeMongoURL(mongodbUrl);
            if (urlAnalysis.issues.length > 5) {
                // Se ci sono più problemi, suggerisce di mostrare le informazioni di debug
                console.log('Multiple URL issues detected:', urlAnalysis.issues);
                const showDebugButton = document.createElement('button');
                showDebugButton.innerText = 'Debug URL Connessione';
                showDebugButton.className = 'debug-button';
                showDebugButton.addEventListener('click', showDebugInfo);
                
                displayError(`L'URL del cluster presenta diversi problemi: ${urlAnalysis.issues[0]}... <br>Fare clic su 'Debug Connection URL' per maggiori dettagli e suggerimenti.`);
                document.querySelector('.result-content').appendChild(showDebugButton);
                return;
            }
            
            // Invia l'URL come parametro di query, codificato correttamente per l'URL
            // ma preservando il prefisso mongodb:// o mongodb+srv://
            const validateUrl = `/api/items/validate?clusterUrl=${encodeURIComponent(mongodbUrl)}`;
            console.log('Validation request URL (masked):', validateUrl.replace(/clusterUrl=.*/, 'clusterUrl=MASKED'));
            
            let validateResponse;
            try {
                validateResponse = await fetch(validateUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                console.log('Received validation response, status:', validateResponse.status);
            } catch (fetchError) {
                console.error('Network error during fetch:', fetchError);
                handleNetworkError(fetchError, 'Errore di rete: impossibile contattare il server per la validazione.');
                return;
            }
            
            // Analizza la risposta indipendentemente dallo stato
            let validationData;
            try {
                validationData = await validateResponse.json();
                console.log('Validation response parsed', validationData);
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                displayError('Errore nella risposta del server: formato non valido');
                return;
            }
            
            if (!validateResponse.ok) {
                // Se la validazione fallisce, mostra il messaggio di errore
                const errorMsg = validationData.message || validationData.error || 'Impossibile connettersi al cluster MongoDB Atlas';
                console.error('Connection validation failed:', errorMsg);
                
                // Mostra dettagli tecnici se disponibili per aiutare il debug
                let detailedError = errorMsg;
                if (validationData.technical) {
                    console.error('Technical details:', validationData.technical);
                    detailedError += `\n\nDettagli tecnici: ${validationData.technical}`;
                }
                
                // Reindirizza a una pagina di errore dedicata per cluster non esistenti
                if (validationData.errorType === 'host_not_found' || 
                    validationData.errorType === 'server_selection' ||
                    errorMsg.includes('trovare il server') ||
                    errorMsg.includes('Impossibile connettersi al cluster')) {
                    
                    console.log('Redirecting to error page for non-existent cluster');
                    window.location.href = `cluster-error.html?error=${encodeURIComponent(errorMsg)}`;
                    return;
                }
                
                // Mostra informazioni di debug aggiuntive per altri errori
                detailedError += `\n\nTentativi di risoluzione:
                - Controlla username e password
                - Verifica che l'utente MongoDB abbia i permessi corretti (readWrite o admin)
                - Controlla che l'indirizzo IP sia nella whitelist di MongoDB Atlas
                - Prova ad aggiungere "?authSource=admin" alla fine dell'URL
                - Assicurati che il cluster MongoDB Atlas sia attivo e non in pausa
                - Prova a creare un nuovo database o collection prima di connetterti`;
                
                throw new Error(detailedError);
            }
            
            // Connessione validata con successo
            displayInfo(`Connessione riuscita al database: ${validationData.database} (${validationData.collectionsCount} collezioni trovate)`);
            
            // Avvia il processo di esportazione
            resultContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Esportazione dei dati da MongoDB Atlas in corso...</p>
                    <button class="debug-button">Debug Connessione</button>
                </div>
            `;
            resultContent.querySelector('.debug-button').addEventListener('click', showDebugInfo);
            
            // Configura il download con timeout e gestione degli errori
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
            
            try {
                console.log('Sending download request to server');
                
                // Usa lo stesso formato URL per la richiesta di download
                const downloadUrl = `/api/items/download/json?clusterUrl=${encodeURIComponent(mongodbUrl)}`;
                console.log('Download request URL (masked):', downloadUrl.replace(/clusterUrl=.*/, 'clusterUrl=MASKED'));
                
                let downloadResponse;
                try {
                    downloadResponse = await fetch(downloadUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    console.log('Received download response, status:', downloadResponse.status);
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        handleNetworkError(fetchError, 'Il download è stato interrotto a causa di un timeout. Il server ha impiegato troppo tempo per rispondere.');
                    } else {
                        handleNetworkError(fetchError, `Errore durante il download: ${fetchError.message}`);
                    }
                    return;
                }
                
                if (!downloadResponse.ok) {
                    // Se il download fallisce, analizza l'errore
                    const errorData = await downloadResponse.json();
                    const errorMsg = errorData.message || errorData.error || 'Errore durante il download';
                    console.error('Download failed:', errorMsg);
                    
                    throw new Error(errorMsg);
                }
                
                // Se abbiamo una risposta positiva, scarica il file
                const contentType = downloadResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    // Ottiene i dati blob
                    const blob = await downloadResponse.blob();
                    console.log('Download blob received, size:', blob.size);
                    
                    // Controlla se il blob ha contenuto
                    if (blob.size === 0) {
                        throw new Error('Il file scaricato è vuoto. Nessun dato trovato.');
                    }
                    
                    // Ottiene il nome del file dall'header Content-Disposition se disponibile
                    let filename = 'mongodb-export.json';
                    const disposition = downloadResponse.headers.get('content-disposition');
                    if (disposition && disposition.includes('filename=')) {
                        const filenameRegex = /filename=(.+)$/;
                        const matches = filenameRegex.exec(disposition);
                        if (matches && matches[1]) {
                            filename = matches[1].replace(/"/g, '');
                        }
                    }
                    
                    // Crea un blob per il download
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    
                    // Avvia il download
                    a.click();
                    
                    // Pulizia
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    displaySuccess(`Download completato con successo! Filename: ${filename}`);
                } else {
                    throw new Error('Il tipo di contenuto della risposta non è valido. Tipo ricevuto: ' + (contentType || 'sconosciuto'));
                }
            } catch (downloadError) {
                if (downloadError.name === 'AbortError') {
                    handleNetworkError(downloadError, 'Il download è stato interrotto a causa di un timeout. Il server ha impiegato troppo tempo per rispondere.');
                } else {
                    handleNetworkError(downloadError, `Errore durante il download: ${downloadError.message}`);
                }
                console.error('Download error details:', downloadError);
            }
        } catch (validationError) {
            console.error('Connection validation error details:', validationError);
            
            // Reportistica errori migliorata
            const errorMessage = validationError.message || 'Errore sconosciuto';
            
            // Controlla se sembra un problema di formato URL
            if (errorMessage.includes('Invalid connection string') || 
                errorMessage.includes('Invalid URI') ||
                errorMessage.includes('URL del cluster non valido')) {
                
                // Esegue l'analisi dell'URL per fornire un feedback specifico
                const urlAnalysis = analyzeMongoURL(mongodbUrl);
                
                let detailedMessage = `Errore di connessione: ${errorMessage}`;
                
                // Aggiunge i problemi più critici dall'analisi
                if (urlAnalysis.issues.length > 0) {
                    const criticalIssues = urlAnalysis.issues.slice(0, 2);
                    detailedMessage += `<br><br>Problemi principali:<ul>`;
                    criticalIssues.forEach(issue => {
                        detailedMessage += `<li>${issue}</li>`;
                    });
                    detailedMessage += `</ul>`;
                }
                
                displayError(detailedMessage);
            }
            // Errore di autenticazione specifico
            else if (errorMessage.includes('Authentication failed') || 
                     errorMessage.includes('auth failed') ||
                     errorMessage.includes('not authorized')) {
                displayError(`Errore di autenticazione: Le credenziali fornite non sono corrette o l'utente non ha permessi sufficienti.
                <br><br>Suggerimenti:
                <ul>
                    <li>Verificare username e password</li>
                    <li>Controllare che l'utente abbia i permessi corretti nel database</li>
                    <li>Provare ad aggiungere '?authSource=admin' all'URL</li>
                </ul>`);
            }
            // Errori di rete o host
            else if (errorMessage.includes('ENOTFOUND') || 
                     errorMessage.includes('getaddrinfo') ||
                     errorMessage.includes('nodename nor servname provided')) {
                displayError(`Impossibile trovare il server MongoDB: il nome del cluster potrebbe essere errato o non raggiungibile.
                <br><br>Suggerimenti:
                <ul>
                    <li>Verificare che il nome del cluster sia corretto</li>
                    <li>Controllare che il cluster sia attivo e non in pausa</li>
                    <li>Verificare la connessione internet</li>
                </ul>`);
            }
            // Errori di timeout
            else if (errorMessage.includes('timed out') || 
                     errorMessage.includes('timeout')) {
                displayError(`La connessione è scaduta: il server MongoDB non risponde entro il tempo limite.
                <br><br>Suggerimenti:
                <ul>
                    <li>Verificare che il cluster sia attivo</li>
                    <li>Controllare che l'indirizzo IP sia nella whitelist di MongoDB Atlas</li>
                    <li>Provare a riconnettersi più tardi</li>
                </ul>`);
            }
            else {
                // Errore generico con messaggio originale
                displayError(`Errore di connessione: ${validationError.message}`);
            }
            
            // Aggiunge un pulsante di debug alla fine
            const debugButton = document.createElement('button');
            debugButton.innerText = 'Debug Connessione';
            debugButton.className = 'debug-button';
            debugButton.addEventListener('click', showDebugInfo);
            document.querySelector('.result-content').appendChild(debugButton);
        }
    } catch (error) {
        displayError('Errore imprevisto: ' + error.message);
        console.error('Unexpected error details:', error);
    }
}

function displayError(message) {
    const resultContent = document.querySelector('.result-content');
    if (!resultContent) return;
    
    // Cancella qualsiasi contenuto precedente inclusi i pulsanti
    resultContent.innerHTML = message;
    resultContent.className = 'result-content error';
    updateResultIcon('error');
    
    // Scorre fino al risultato
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

function displayInfo(message) {
    const resultContent = document.querySelector('.result-content');
    if (!resultContent) return;
    
    // Cancella qualsiasi contenuto precedente inclusi i pulsanti
    resultContent.innerHTML = message;
    resultContent.className = 'result-content info';
    updateResultIcon('info');
}

function displaySuccess(message) {
    const resultContent = document.querySelector('.result-content');
    if (!resultContent) return;
    
    // Cancella qualsiasi contenuto precedente inclusi i pulsanti
    resultContent.innerHTML = message;
    resultContent.className = 'result-content success';
    updateResultIcon('success');
}