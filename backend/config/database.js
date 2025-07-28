const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            console.log('🔗 Connexion à MongoDB...');
            
            const options = {
                // Options de connexion modernes
                useNewUrlParser: true,
                useUnifiedTopology: true,
                
                // Pool de connexions
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                
                // Reconnexion automatique
                bufferMaxEntries: 0,
                bufferCommands: false,
                
                // Compression
                compressors: ['zlib'],
                
                // Heartbeat
                heartbeatFrequencyMS: 10000
            };

            this.connection = await mongoose.connect(process.env.MONGODB_URI, options);
            
            console.log('✅ MongoDB connecté avec succès');
            console.log(`📊 Base de données: ${this.connection.connection.db.databaseName}`);
            console.log(`🌐 Serveur: ${this.connection.connection.host}:${this.connection.connection.port}`);
            
            // Gestion des événements de connexion
            this.setupEventHandlers();
            
            return this.connection;
            
        } catch (error) {
            console.error('❌ Erreur de connexion MongoDB:', error.message);
            
            // Tentative de reconnexion après 5 secondes
            setTimeout(() => {
                console.log('🔄 Tentative de reconnexion...');
                this.connect();
            }, 5000);
            
            throw error;
        }
    }

    setupEventHandlers() {
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('🟢 MongoDB connecté');
        });

        connection.on('error', (error) => {
            console.error('🔴 Erreur MongoDB:', error.message);
        });

        connection.on('disconnected', () => {
            console.log('🟡 MongoDB déconnecté');
        });

        connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnecté');
        });

        // Gestion de l'arrêt propre
        process.on('SIGINT', async () => {
            try {
                await connection.close();
                console.log('👋 Connexion MongoDB fermée proprement');
                process.exit(0);
            } catch (error) {
                console.error('❌ Erreur lors de la fermeture:', error);
                process.exit(1);
            }
        });
    }

    async disconnect() {
        try {
            await mongoose.connection.close();
            console.log('👋 Connexion MongoDB fermée');
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            throw error;
        }
    }

    async clearDatabase() {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('🚫 clearDatabase ne peut être utilisé qu\'en développement');
        }

        try {
            console.log('🧹 Nettoyage de la base de données...');
            
            const collections = await mongoose.connection.db.collections();
            
            for (let collection of collections) {
                await collection.deleteMany({});
                console.log(`✅ Collection ${collection.collectionName} nettoyée`);
            }
            
            console.log('🎉 Base de données nettoyée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const stats = await mongoose.connection.db.stats();
            
            return {
                database: stats.db,
                collections: stats.collections,
                objects: stats.objects,
                dataSize: this.formatBytes(stats.dataSize),
                indexSize: this.formatBytes(stats.indexSize),
                storageSize: this.formatBytes(stats.storageSize)
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des stats:', error);
            throw error;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Méthodes utilitaires pour le développement
    async createIndexes() {
        try {
            console.log('📋 Création des index...');
            
            // Les index sont automatiquement créés via les schémas
            // Cette méthode peut être utilisée pour des index personnalisés
            
            console.log('✅ Index créés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la création des index:', error);
            throw error;
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }

    getConnectionState() {
        const states = {
            0: 'Déconnecté',
            1: 'Connecté',
            2: 'Connexion en cours',
            3: 'Déconnexion en cours'
        };
        
        return states[mongoose.connection.readyState];
    }
}

module.exports = new Database();