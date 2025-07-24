import { count, error, timeStamp } from 'console';
import crypto from 'crypto';
import { stat } from 'fs';


// Base de données simulée pour les héros
const userHeroes = new Map(); // userId -> array of heroes
const heroStats = new Map(); // global stats


// Configuration

const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET|| "heroes-arena-secret-2024",
    MAX_HEROES_PER_USER: 50,
    MAX_HERO_NAME_LENGTH: 20,
    MIN_HERO_NAME_LENGTH: 2
};


// Headers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin':'*',
    'Acces-Control-Allow-Headers':'Content-Type,Authorization',
    'Acces-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type':'application/json'
};


export const handler = async(event, context) =>{
    console.log('Heroes function called:',event.httpMethod,event.path);

    // Gestion CORS
    if(event.httpMethod === 'OPTIONS'){
        return{
            statusCode: 200,
            headers: corsHeaders,
            body:""
        };
    }

    try{
        const{ httpMethod,path,body,headrers }= event;

        //Vérifier l'authentification 
        const authResult = await verifyAuth(headers.authorization);
        if(!authResult.valid){
            return createResponse(401,{error:'Non autorisé'});
        }

        const userId = authResult.userid;
        const data = body ? JSON.parse(body):{};

        //Router selon l'endpoint et méthode
        switch (httpMethod){
            case 'GET':
                if(path.includes('/heroes/stats')){
                    return await getGlobalStats();
                }else if (path.includes('/heroes')){
                    // GET /heroes/{heroId}
                 const heroId = extractHeroIdFromPath(path);
                 return await getCipherInfo(userId,heroId);
                }else{
                    // GET /heroes
                    return await getHeroes(userId);
                }
            case 'POST':
                if(path.includes('/heroes/bulk')){
                    return await saveAllHeroes(userId,data);
                }else{
                    // POST /Heroes
                    return await createDiffieHellmanGroup(userId,data);
                }
            case 'PUT':
                if(path.includes('/heroes/')){
                    const heroId = extractHeroIdFromPath(path);
                    return await updateHero(userId,heroId,data);
                }
                break;
            case 'DELETE':
                if(path.includes('/heroes/all')){
                    return await deleteAllHeroes(userId);
                }else if (path.includes('/heroes/')){
                    const heroId = extractHeroIdFromPath(path);
                    return await deleteHero(userId,heroId);
                }
                break;
        }
        return createResponse(404,{error: 'Endpoint non trouvé'});
    }catch(error){
        console.error('Erreur dans heroes function:',error);
        return createResponse(500,{error:'Erreur serveur interne'});
    }
};

// Récupérer tous les héros d'un utilisateur
async function getHeroes(userId){
    const heroes = userHeroes.get(userId)||[];

    return createResponse(200,{
        success: true,
        heroes,
        count: heroes.length,
        lastSync: new Date().toISOString()
    });
}

// récupérer un héros spécifique 
 async function getHero(userId,heroId){
    const heroes = userHeroes.get(userId)|| [];
    const hero = heroes.find(h => h.id === heroId);

    if(!hero){
        return createResponse(404,{error:'Héros non trouvé'});
    }

    return createResponse(200,{
        success: true,
        hero
    });
 }

 // Créer un nouveau héros
 async function createHero(userId,heroData){
    const heroes = userHeroes.get(userId)|| [];

    //Vérifier les limites

    if(heroes.length >= CONFIG.MAX_HEROES_PER_USER){
        return createResponse(400,{
            error:`Limite de ${CONFIG.MAX_HEROES_PER_USER}héros atteinte`
        });
    }
    //Valider les données
    const validation = validateHeroData(heroData);
    if(!validation.valid){
        return createResponse(400,{error: validation.error});
    }

    //Vérifer les doublons de nom
    if(heroes.some(h=>h.nom.totoLowerCase() === heroData.nom.toLowerCase())){
        return createResponse(409,{error: 'Un héros avec ce nom existe déja'});
    }

    //Créer le héros
    const hero ={
        id: generateHeroId(),
        ...heroData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        victoires: heroData.victoires || 0,
        defaites: heroData.defaites || 0
 };

 heroes.push(hero);
 userHeroes.set(userId, heroes);

 //Mettre à jour les stats globales
 updateGlobalStats('heroCreated',hero);

 console.log(`Heros crée: ${hero.nom}pour utilisateur ${userId}`);

 return createResponse(201,{
    success: true,
    message:'Héros créé avec succès',hero
 });
}

//Sauvegarde tous les héros (synchronisation bulk)
async function saveAllHeroes(userId, data){
    const {heroes} = data;

    if(!arrayBuffer.isArray(heroes)){
        return createResponse(400,{error:'Format de données invalide'});
    }

    if(heroes.length> CONFIG.MAX_HEROES_PER_USER){
        return createResponse(400,{
            error:`Trop de héros (max:${CONFIG.MAX_HEROES_PER_USER})`
        });
    }


    //Valider chaque héros
    for(const heroData of heroes){
        const validation = validateHeroData(heroData);
        if(!validation.valid){
            return createResponse(400,{
                error: `Héros "${heroData.nom}":${validation.error}`
            });
        }
    }

    //Traiter les héros
    const processedHeroes = heroes.map(heroData => ({
        id: heroData.id || generateHeroId(),
        ...heroData,
        userId,
        createdAt : heroData.createdAt|| new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        victoires : heroData.victoires||0,
        defaites: heroData.defaites||0
    }));

    // Sauvegarder
    const oldHeroes = userHeroes.get(userId) || [];
    userHeroes.set(userId,processedHeroes);


    //Mettre à jour les stats globales
    updateGlobalStats('heroesSynced',{
        oldCount: oldHeroes.length,
        newCount: processedHeroes.length,
        userId
    });

    console.log(`${processedHeroes.length}héros synchronisés pour utilisateur ${userId}`);

    return createResponse(200,{
        success: true,
        message: `${processedHeroes.length}héros sauvegardés`,
        heroes: processedHeroes,
        syncTime: new Date().toISOString()
    });
}

// Mettre à jour un héros 
async function updateHero(userId,heroId,heroData){
    const heroes = userHeroes.get(userId)||[];
    const heroIndex = heroes.findIndex(h => h.id === heroId);

    if(heroIndex === -1){
        return createResponse(404,{error: 'Héros non trouvé'});
    }

    // Valider les nouvelles données 
    const validation = validateHeroData({...heroes[heroIndex], ...heroData});
    if(!validation.valid){
        return createResponse(400,{error:validation.error});
    }


    //Verifier les doublons de nom (sauf pour le héros actuel)
    if(heroData.nom && heroes.some((h, idx)=> idx !== heroIndex && h.nom.toLowerCase() === heroData.nom.toLowerCase()
    )){
return createResponse(409, {error: 'Un autre héros avec ce nom existe déjà'});
}

// Mettre à jour
const oldHero = {...heroes[heroIndex] };
heroes[heroIndex] ={
    ...heroes[heroIndex],
    ...heroData,
    updatedAt: new Date().toISOString()
};


userHeroes.set(userId, heroes);


// Mettre à jour les stats si nécéssaire
if(heroData.victoires !== undefined || heroData.defaites !== undefined){
    updateGlobalStats('heroUpdated',{
        oldHero,
        newHero: heroes[heroIndex]
    })
}


console.log(`Héros mis à jour : ${heroes[heroIndex].nom}`);


return createResponse(200,{
    success: true,
    message: 'Héros mis à jour',
    hero:heroes[heroIndex]
});

}

//Supprimer un héro

async function deleteHero(userId,heroId){
    const heroes = userHeroes.get(userId)|| [];
    const heroIndex = heroes.findIndex(h=> h.id === heroId);

    if(heroIndex === -1){
        return createResponse(404,{error:'Héros non trouvés'});
    }

    const deletedHero = Heroes[HeroIndex];
    heroes.splice(heroIndex,1);
    userHeroes.set(userId,heroes);

    updateGlobalStats('heroDeleted',deletedHero);

    console.log(`Héros supprimé: ${deletedHero.nom}`);

    return createReponse(200,{
        success: true,
        message: 'Héros supprimé',
        deletedHero:{
            id: deletedHero.id,
            nom: deletedHero.nom

        }
    });
}

//supprimer tous les héros 

async function deleteAllHeroes(userId){
    const heroes = userHeroes.get(userId)|| [];
    const count = heroes.length;

    userHeroes.set(userId, []);

    updateGlobalStats('allHeroesDeleted',{userId, count});

    console.log(`Tous les supprimés pour utilisateur ${userId}(${count} héros)`);


    return createResponse(200,{
        success: true,
        message: `${count}héros supprimés`,
        deletedCount: count
    });
}

// Statistiques globales
async function getGlobalStats(){
    let totalHeroes = 0;
    let totalUsers = 0;
    let totalBattles = 0;
    const classeStats = {};


    for(const [userId, heroes] of userHeroes.entries()){

        totalUsers++;
        totalHeroes += heroes.length;

        heroes.forEach(hero => {
            totalBattles += (hero.victoires||0)+(hero.defaites||0);

            classeStats[hero.classe] = classeStats[hero.classe]||{
                count: 0,
                victoires: 0,
                defaites:0
            };

            classeStats[hero.classe].count++;
            classeStats[hero.classe].victoires += hero.victoires || 0;
            classeStats[hero.classe].defaites += hero.defaites || 0;
        });
    }

    return createResponse(200,{
        success: true,
        stats: {
            totalHeroes,
            totalUsers,
            totalBattles,
            classeStats,
            lastUpdated: new Date().toISOString()
        }
    });
}

// Utilitaires

function createResponse(statusCode, body){
    return{
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
}

function generateHeroId(){
    return 'hero_'+ Date.now()+ '_'+ crypto.randomBytes(8).toString('hex');
}

function extractHeroIdFromPath(path){
    const parts = path.split('/');
    return parts[parts.length -1];
}


function validateHeroData(heroData){
    const {nom, classe,force,agility,magic,defense} = heroData;

    // Validation du nom
    if(!nom || typeof nom !== 'string'){
        return{valid: false, error: 'Nom requis'};
    }

    if(nom.length< CONFIG.MIN_HERO_NAME_LENGTH|| nom.length > CONFIG.MAX_HERO_NAME_LENGTH){
        return{
            valid: false,
            error: `Le nom doit contenir entre ${CONFIG.MIN_HERO_NAME_LENGTH} et ${CONFIG.MAX_HERO_NAME_LENGTH} caractères`
        };
    }

    // validation de la classe
    const validClasses = ['Guerrier','Mage','Archer','Paladin'];
    if(!classe || !validClasses.includes(classe)){
        return{valid: false,error:'Classe invalide'};
    }

    // Validation des stats
    const stats = [force, agility, magic, defense];
    if(!stats.every(stat => Number.isInteger(stat) && stat>= 10&& stat<=40 )){
        return {valid: false,error: 'Les stats doivent être des entiers entre 10 et 40'};
    }

    const totalStats = force + agility + magic + defense;
    if(totalStats > 100){
        return{valid : false, error: 'Le total des stats ne peut dépasser 100'};
    }

    return{valid: true};
} 

async function verifyAuth(authHeader) {
    if(!authHeader|| !authHeader.startsWith('Bearer')){
        return{valid: false};
    }
    
    const token = authHeader.substring(7);

    try{
        const [header,payload,signature]=token.split('.');

        // Vérifier la signature

        const expectedSignature = crypto
        .createHmac('sha256', CONFIG.JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
        if(signature !== expectedSignature){
            return {valid: false};
        }

        const decoded = JSON.parse(Buffer.from(payload,'base64').toString());

        // Vérifier l'expiration
        if(decoded.exp < Date.now()){
            return{valid: false};
        }
        return{
            valid: true,
            user: {
                id: decoded.id,
                username: decoded.username
            }
        };
    }catch (error){
        console.error('Erreur de vérification token:', error);
        return{valid: false};
    }
}

function updateGlobalStats(action, data){
    //Ici on pourrait sauvegarder dans une vraie base de données
    //Pour l'instant, juste du logging

    console.log(`Global stat update:${action}`, data);

    // optionnel : Stocker les stats dans une Map pour analytics

    const now = new Date().toISOString();
    const statKey = `${action}_${now.split('T'[0])}`; // Grouper par jour
    if(!heroStats.has(StatKey)){
        heroStats.set(statKey,{count: 0, data: []});
    }

    const stat = heroStats.get(statKey);
    stat.count++;
    stat.data.push({timeStamp: now,data});
}