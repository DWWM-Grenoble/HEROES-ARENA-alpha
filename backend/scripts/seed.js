require('dotenv').config();
const database = require('../config/database');
const User = require('../models/User');
const Hero = require('../models/Hero');
const Combat = require('../models/Combat');

// Données d'exemple
const sampleUsers = [
    {
        username: 'GameMaster',
        email: 'admin@heroes-arena.com',
        password: 'admin123',
        role: 'admin',
        profile: {
            niveau: 10,
            xp: 1500
        }
    },
    {
        username: 'WarriorKing',
        email: 'warrior@example.com',
        password: 'password123',
        profile: {
            niveau: 5,
            xp: 750
        }
    },
    {
        username: 'MageSupreme',
        email: 'mage@example.com',
        password: 'password123',
        profile: {
            niveau: 7,
            xp: 1200
        }
    },
    {
        username: 'ShadowAssassin',
        email: 'assassin@example.com',
        password: 'password123',
        profile: {
            niveau: 6,
            xp: 900
        }
    },
    {
        username: 'HolyPaladin',
        email: 'paladin@example.com',
        password: 'password123',
        profile: {
            niveau: 4,
            xp: 600
        }
    }
];

const heroTemplates = [
    {
        nom: 'Aragorn',
        classe: 'Guerrier',
        avatar: 'guerrier-1.png',
        stats: { force: 85, agility: 70, magic: 30, defense: 80 }
    },
    {
        nom: 'Gandalf',
        classe: 'Mage',
        avatar: 'mage-1.png',
        stats: { force: 40, agility: 60, magic: 95, defense: 50 }
    },
    {
        nom: 'Legolas',
        classe: 'Archer',
        avatar: 'archer-1.png',
        stats: { force: 70, agility: 90, magic: 45, defense: 60 }
    },
    {
        nom: 'Gimli',
        classe: 'Guerrier',
        avatar: 'guerrier-2.png',
        stats: { force: 90, agility: 55, magic: 25, defense: 85 }
    },
    {
        nom: 'Saruman',
        classe: 'Mage',
        avatar: 'mage-2.png',
        stats: { force: 35, agility: 50, magic: 98, defense: 55 }
    },
    {
        nom: 'Boromir',
        classe: 'Paladin',
        avatar: 'paladin-1.png',
        stats: { force: 75, agility: 65, magic: 60, defense: 90 }
    },
    {
        nom: 'Arwen',
        classe: 'Druide',
        avatar: 'druide-1.png',
        stats: { force: 55, agility: 80, magic: 85, defense: 70 }
    },
    {
        nom: 'Sméagol',
        classe: 'Assassin',
        avatar: 'assassin-1.png',
        stats: { force: 65, agility: 95, magic: 40, defense: 45 }
    }
];

class DataSeeder {
    constructor() {
        this.users = [];
        this.heroes = [];
        this.combats = [];
    }

    async seed() {
        try {
            console.log('🌱 Démarrage du seed de données...');
            
            // Connexion à la base de données
            await database.connect();
            
            // Nettoyer la base de données
            await this.clearDatabase();
            
            // Créer les utilisateurs
            await this.createUsers();
            
            // Créer les héros
            await this.createHeroes();
            
            // Créer quelques combats d'exemple
            await this.createSampleCombats();
            
            // Afficher les statistiques
            await this.displayStats();
            
            console.log('✅ Seed de données terminé avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur lors du seed:', error);
            throw error;
        }
    }

    async clearDatabase() {
        console.log('🧹 Nettoyage de la base de données...');
        
        await Promise.all([
            User.deleteMany({}),
            Hero.deleteMany({}),
            Combat.deleteMany({})
        ]);
        
        console.log('✅ Base de données nettoyée');
    }

    async createUsers() {
        console.log('👥 Création des utilisateurs...');
        
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            this.users.push(user);
            console.log(`  ✅ Utilisateur créé: ${user.username}`);
        }
        
        console.log(`✅ ${this.users.length} utilisateurs créés`);
    }

    async createHeroes() {
        console.log('🦸 Création des héros...');
        
        for (let i = 0; i < heroTemplates.length; i++) {
            const template = heroTemplates[i];
            const owner = this.users[i % this.users.length];
            
            const heroData = {
                ...template,
                owner: owner._id,
                progression: {
                    niveau: Math.floor(Math.random() * 8) + 1,
                    xp: Math.floor(Math.random() * 800),
                    victoires: Math.floor(Math.random() * 20),
                    defaites: Math.floor(Math.random() * 15)
                }
            };
            
            const hero = new Hero(heroData);
            await hero.save();
            this.heroes.push(hero);
            console.log(`  ✅ Héros créé: ${hero.nom} (${hero.classe}) - Propriétaire: ${owner.username}`);
        }
        
        // Créer quelques héros supplémentaires pour d'autres utilisateurs
        const additionalHeroes = [
            { nom: 'Elrond', classe: 'Mage', avatar: 'mage-3.png' },
            { nom: 'Faramir', classe: 'Archer', avatar: 'archer-2.png' },
            { nom: 'Éowyn', classe: 'Guerrier', avatar: 'guerrier-3.png' },
            { nom: 'Galadriel', classe: 'Druide', avatar: 'druide-2.png' }
        ];
        
        for (const template of additionalHeroes) {
            const owner = this.users[Math.floor(Math.random() * this.users.length)];
            
            const heroData = {
                ...template,
                owner: owner._id,
                stats: {
                    force: Math.floor(Math.random() * 40) + 40,
                    agility: Math.floor(Math.random() * 40) + 40,
                    magic: Math.floor(Math.random() * 40) + 40,
                    defense: Math.floor(Math.random() * 40) + 40
                },
                progression: {
                    niveau: Math.floor(Math.random() * 10) + 1,
                    xp: Math.floor(Math.random() * 1000),
                    victoires: Math.floor(Math.random() * 25),
                    defaites: Math.floor(Math.random() * 20)
                }
            };
            
            const hero = new Hero(heroData);
            await hero.save();
            this.heroes.push(hero);
            console.log(`  ✅ Héros créé: ${hero.nom} (${hero.classe}) - Propriétaire: ${owner.username}`);
        }
        
        console.log(`✅ ${this.heroes.length} héros créés`);
    }

    async createSampleCombats() {
        console.log('⚔️ Création de combats d\'exemple...');
        
        // Créer 10 combats aléatoires
        for (let i = 0; i < 10; i++) {
            // Sélectionner deux héros aléatoirement
            const hero1 = this.heroes[Math.floor(Math.random() * this.heroes.length)];
            let hero2 = this.heroes[Math.floor(Math.random() * this.heroes.length)];
            
            // S'assurer que ce ne sont pas les mêmes héros
            while (hero2._id.equals(hero1._id)) {
                hero2 = this.heroes[Math.floor(Math.random() * this.heroes.length)];
            }
            
            const combat = new Combat({
                combatId: Combat.genererIdCombat(),
                combattants: [
                    {
                        hero: hero1._id,
                        owner: hero1.owner,
                        nom: hero1.nom,
                        classe: hero1.classe,
                        position: 'gauche',
                        statsAuCombat: hero1.stats
                    },
                    {
                        hero: hero2._id,
                        owner: hero2.owner,
                        nom: hero2.nom,
                        classe: hero2.classe,
                        position: 'droite',
                        statsAuCombat: hero2.stats
                    }
                ],
                resultat: {
                    statut: 'termine',
                    vainqueur: Math.random() > 0.1 ? (Math.random() > 0.5 ? hero1._id : hero2._id) : null,
                    matchNul: Math.random() < 0.1
                },
                statistiques: {
                    duree: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
                    nombreRounds: Math.floor(Math.random() * 10) + 3
                },
                typeCombat: Math.random() > 0.8 ? 'tournoi' : 'classique',
                dateDebut: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Dans les 7 derniers jours
                dateFin: new Date()
            });
            
            // Ajuster la date de fin
            combat.dateFin = new Date(combat.dateDebut.getTime() + combat.statistiques.duree * 1000);
            
            await combat.save();
            this.combats.push(combat);
            
            console.log(`  ✅ Combat créé: ${hero1.nom} vs ${hero2.nom}`);
        }
        
        console.log(`✅ ${this.combats.length} combats créés`);
    }

    async displayStats() {
        console.log('\n📊 STATISTIQUES DES DONNÉES CRÉÉES');
        console.log('=====================================');
        
        const userCount = await User.countDocuments();
        const heroCount = await Hero.countDocuments();
        const combatCount = await Combat.countDocuments();
        
        console.log(`👥 Utilisateurs: ${userCount}`);
        console.log(`🦸 Héros: ${heroCount}`);
        console.log(`⚔️ Combats: ${combatCount}`);
        
        // Distribution des classes
        const classDistribution = await Hero.aggregate([
            {
                $group: {
                    _id: '$classe',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n🏷️ Distribution des classes:');
        classDistribution.forEach(classe => {
            console.log(`  ${classe._id}: ${classe.count}`);
        });
        
        // Top 3 héros par victoires
        const topHeroes = await Hero.find()
            .sort({ 'progression.victoires': -1 })
            .limit(3)
            .populate('owner', 'username');
        
        console.log('\n🏆 Top 3 héros par victoires:');
        topHeroes.forEach((hero, index) => {
            console.log(`  ${index + 1}. ${hero.nom} (${hero.classe}) - ${hero.progression.victoires} victoires - Propriétaire: ${hero.owner.username}`);
        });
    }
}

// Fonction principale
async function main() {
    try {
        const seeder = new DataSeeder();
        await seeder.seed();
        
        console.log('\n🎉 Seed terminé ! Vous pouvez maintenant utiliser l\'API.');
        console.log('🚀 Démarrez le serveur avec: npm start');
        console.log('📡 API disponible sur: http://localhost:3001');
        
        process.exit(0);
    } catch (error) {
        console.error('💥 Erreur fatale:', error);
        process.exit(1);
    }
}

// Lancer le script si exécuté directement
if (require.main === module) {
    main();
}

module.exports = DataSeeder;