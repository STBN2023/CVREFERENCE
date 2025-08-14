const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'cv_enrichment.db');
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialise la base de données et exécute les scripts de création
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🗄️  Initialisation de la base de données SQLite...');
            
            // Créer la connexion à la base
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Erreur connexion SQLite:', err.message);
                    throw err;
                }
                console.log('✅ Connexion SQLite établie:', this.dbPath);
            });

            // Activer les clés étrangères
            await this.run("PRAGMA foreign_keys = ON");

            // Créer les tables directement
            await this.createTables();
            console.log('✅ Schéma de base de données créé');

            // Corriger la table salaries_references si nécessaire
            await this.fixSalariesReferencesTable();
            
            // Ajouter la contrainte d'unicité sur les références
            await this.addReferencesUniquenessConstraint();

            // Vérifier si des données existent déjà
            const salariesCount = await this.get("SELECT COUNT(*) as count FROM salaries");
            
            if (salariesCount.count === 0) {
                console.log('📊 Insertion des données de test...');
                await this.insertTestData();
                console.log('✅ Données de test insérées');
            } else {
                console.log(`📊 Base de données existante: ${salariesCount.count} salariés`);
            }

            this.isInitialized = true;
            console.log('🎉 Base de données initialisée avec succès');

        } catch (error) {
            console.error('❌ Erreur initialisation base de données:', error);
            throw error;
        }
    }



    /**
     * Corrige la table salaries_references si nécessaire
     */
    async fixSalariesReferencesTable() {
        console.log('🔧 Vérification/correction table salaries_references...');
        
        try {
            // Vérifier si la table existe et a la bonne structure
            const tableInfo = await this.all("PRAGMA table_info(salaries_references)");
            
            if (tableInfo.length === 0) {
                console.log('⚠️ Table salaries_references manquante, création...');
                await this.run(`
                    CREATE TABLE salaries_references (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_salarie INTEGER NOT NULL,
                        id_reference INTEGER NOT NULL,
                        role_projet VARCHAR(100),
                        date_debut DATE,
                        date_fin DATE,
                        principal BOOLEAN DEFAULT 0,
                        FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
                        FOREIGN KEY (id_reference) REFERENCES projets_references(id_reference) ON DELETE CASCADE,
                        UNIQUE(id_salarie, id_reference)
                    )
                `);
            }
            
            console.log('✅ Table salaries_references corrigée');
        } catch (error) {
            console.error('❌ Erreur lors de la correction de salaries_references:', error);
        }
    }

    /**
     * Ajouter la contrainte d'unicité sur les références si nécessaire
     */
    async addReferencesUniquenessConstraint() {
        console.log('🔧 Vérification contrainte d\'unicité sur projets_references...');
        
        try {
            // Vérifier si la contrainte existe déjà
            const tableInfo = await this.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='projets_references'");
            
            if (tableInfo.length > 0 && !tableInfo[0].sql.includes('UNIQUE(nom_projet, client, annee)')) {
                console.log('⚠️ Contrainte d\'unicité manquante, migration de la table...');
                
                // Créer une nouvelle table avec la contrainte
                await this.run(`
                    CREATE TABLE projets_references_new (
                        id_reference INTEGER PRIMARY KEY AUTOINCREMENT,
                        nom_projet VARCHAR(255) NOT NULL,
                        ville VARCHAR(100) NOT NULL,
                        annee INTEGER NOT NULL,
                        type_mission VARCHAR(100) NOT NULL,
                        montant DECIMAL(12,2),
                        description_courte VARCHAR(500),
                        description_longue TEXT,
                        client VARCHAR(255) NOT NULL,
                        duree_mois INTEGER,
                        surface DECIMAL(10,2),
                        date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
                        date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(nom_projet, client, annee)
                    )
                `);
                
                // Copier les données en supprimant les doublons
                await this.run(`
                    INSERT INTO projets_references_new 
                    SELECT * FROM projets_references 
                    WHERE id_reference IN (
                        SELECT MIN(id_reference) 
                        FROM projets_references 
                        GROUP BY nom_projet, client, annee
                    )
                `);
                
                // Mettre à jour les références dans la table de liaison
                await this.run(`
                    UPDATE salaries_references 
                    SET id_reference = (
                        SELECT MIN(pr.id_reference) 
                        FROM projets_references pr 
                        JOIN projets_references pr_old ON pr.nom_projet = pr_old.nom_projet 
                            AND pr.client = pr_old.client 
                            AND pr.annee = pr_old.annee
                        WHERE pr_old.id_reference = salaries_references.id_reference
                    )
                    WHERE id_reference NOT IN (SELECT id_reference FROM projets_references_new)
                `);
                
                // Supprimer l'ancienne table et renommer la nouvelle
                await this.run('DROP TABLE projets_references');
                await this.run('ALTER TABLE projets_references_new RENAME TO projets_references');
                
                console.log('✅ Contrainte d\'unicité ajoutée avec suppression des doublons');
            } else {
                console.log('✅ Contrainte d\'unicité déjà présente');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de la contrainte d\'unicité:', error);
        }
    }

    /**
     * Crée les tables de la base de données
     */
    async createTables() {
        // Table des salariés
        await this.run(`
            CREATE TABLE IF NOT EXISTS salaries (
                id_salarie INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                agence VARCHAR(50),
                fonction VARCHAR(50),
                niveau_expertise VARCHAR(20),
                email VARCHAR(255) UNIQUE,
                telephone VARCHAR(20),
                chemin_cv VARCHAR(255),
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                actif BOOLEAN DEFAULT 1
            )
        `);

        // Table des références
        await this.run(`
            CREATE TABLE IF NOT EXISTS projets_references (
                id_reference INTEGER PRIMARY KEY AUTOINCREMENT,
                nom_projet VARCHAR(255) NOT NULL,
                ville VARCHAR(100) NOT NULL,
                annee INTEGER NOT NULL,
                type_mission VARCHAR(100) NOT NULL,
                montant DECIMAL(12,2),
                description_courte VARCHAR(500),
                description_longue TEXT,
                client VARCHAR(255) NOT NULL,
                duree_mois INTEGER,
                surface DECIMAL(10,2),
                date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(nom_projet, client, annee)
            )
        `);

        // Table de liaison salariés-références
        await this.run(`
            CREATE TABLE IF NOT EXISTS salaries_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_salarie INTEGER NOT NULL,
                id_reference INTEGER NOT NULL,
                role_projet VARCHAR(100),
                date_debut DATE,
                date_fin DATE,
                principal BOOLEAN DEFAULT 0,
                FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
                FOREIGN KEY (id_reference) REFERENCES projets_references(id_reference) ON DELETE CASCADE,
                UNIQUE(id_salarie, id_reference)
            )
        `);

        // Table des agences (villes)
        await this.run(`
            CREATE TABLE IF NOT EXISTS agences (
                id_agence INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                actif BOOLEAN DEFAULT 1
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS fonctions (
                id_fonction INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                description VARCHAR(255),
                actif BOOLEAN DEFAULT 1,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS niveaux_expertise (
                id_niveau INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(50) NOT NULL UNIQUE,
                ordre INTEGER NOT NULL,
                description VARCHAR(255),
                actif BOOLEAN DEFAULT 1,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tables créées avec succès');
    }

    /**
     * Insère les données de test
     */
    async insertTestData() {
        // Insertion des salariés
        const salaries = [
            [1, 'Dupont', 'Jean', 'Paris', 'Architecte', 'Senior', 'jean.dupont@dyad.fr', '01.23.45.67.89', '/templates/architecte_senior.pptx', 1],
            [2, 'Martin', 'Sophie', 'Lyon', 'Ingenieur Structure', 'Expert', 'sophie.martin@dyad.fr', '04.56.78.90.12', '/templates/ingenieur_expert.pptx', 1],
            [3, 'Durand', 'Pierre', 'Paris', 'Chef de Projet', 'Confirme', 'pierre.durand@dyad.fr', '01.34.56.78.90', '/templates/chef_projet.pptx', 1],
            [4, 'Leroy', 'Marie', 'Marseille', 'Architecte', 'Junior', 'marie.leroy@dyad.fr', '04.67.89.01.23', '/templates/architecte_junior.pptx', 1],
            [5, 'Moreau', 'Antoine', 'Lyon', 'Ingenieur Fluides', 'Confirme', 'antoine.moreau@dyad.fr', '04.78.90.12.34', '/templates/ingenieur_fluides.pptx', 1],
            [6, 'Simon', 'Claire', 'Paris', 'Economiste', 'Senior', 'claire.simon@dyad.fr', '01.45.67.89.01', '/templates/economiste.pptx', 1],
            [7, 'Bernard', 'Luc', 'Toulouse', 'Ingenieur VRD', 'Expert', 'luc.bernard@dyad.fr', '05.23.45.67.89', '/templates/ingenieur_vrd.pptx', 1],
            [8, 'Petit', 'Emma', 'Paris', 'Architecte Paysagiste', 'Confirme', 'emma.petit@dyad.fr', '01.56.78.90.12', '/templates/paysagiste.pptx', 1]
        ];

        for (const salarie of salaries) {
            await this.run(`
                INSERT OR REPLACE INTO salaries 
                (id_salarie, nom, prenom, agence, fonction, niveau_expertise, email, telephone, chemin_cv, actif) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, salarie);
        }

        // Insertion des références
        const references = [
            [1, 'Centre Commercial Confluence', 'Lyon', 2023, 'Maitrise d\'oeuvre complete', 15000000.00, 'Centre commercial de 45000 m² avec parking', 'Conception et realisation d\'un centre commercial moderne integrant commerces, restauration et services. Projet HQE avec certification BREEAM Excellent.', 'Unibail-Rodamco-Westfield', 36, 45000.00],
            [2, 'Residence Les Jardins', 'Paris', 2022, 'Conception architecturale', 8500000.00, 'Residence de 120 logements sociaux', 'Programme de logements sociaux innovant avec espaces verts partages, toitures vegetalisees et performance energetique RT2012+20%.', 'Paris Habitat', 24, 12000.00],
            [3, 'Hopital Nord Extension', 'Marseille', 2023, 'Extension hospitaliere', 25000000.00, 'Extension de 8000 m² du pole medical', 'Extension du service de cardiologie et creation d\'un nouveau bloc operatoire. Contraintes d\'exploitation en site occupe.', 'AP-HM', 30, 8000.00],
            [4, 'Ecole Primaire Ecologique', 'Toulouse', 2021, 'Batiment scolaire', 3200000.00, 'Ecole de 12 classes en construction bois', 'Ecole primaire bioclimatique en ossature bois, certification E3C1. Cour vegetalisee et recuperation d\'eau de pluie.', 'Mairie de Toulouse', 18, 2400.00]
        ];

        for (const reference of references) {
            await this.run(`
                INSERT OR REPLACE INTO projets_references 
                (id_reference, nom_projet, ville, annee, type_mission, montant, description_courte, description_longue, client, duree_mois, surface) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, reference);
        }

        // Associations salariés-références
        const associations = [
            [1, 1, 'Architecte mandataire', '2022-01-15', '2023-12-30', 1],
            [1, 2, 'Architecte conseil', '2021-06-01', '2022-11-30', 0],
            [2, 1, 'Ingenieur structure principal', '2022-02-01', '2023-12-30', 1],
            [2, 3, 'Ingenieur structure', '2022-08-15', '2023-10-31', 1],
            [3, 2, 'Chef de projet', '2021-06-01', '2022-11-30', 1],
            [3, 4, 'Chef de projet', '2020-09-01', '2021-12-31', 1],
            [4, 4, 'Architecte junior', '2020-10-01', '2021-12-31', 0],
            [5, 1, 'Ingenieur CVC', '2022-03-01', '2023-11-30', 0],
            [5, 3, 'Ingenieur fluides medicaux', '2022-09-01', '2023-10-31', 1]
        ];

        for (const assoc of associations) {
            await this.run(`
                INSERT OR REPLACE INTO salaries_references 
                (id_salarie, id_reference, role_projet, date_debut, date_fin, principal) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, assoc);
        }

        // Données de test pour agences (villes)
        const agences = [
            [1, 'Paris'],
            [2, 'Lyon'],
            [3, 'Marseille'],
            [4, 'Toulouse'],
            [5, 'Nantes'],
            [6, 'Bordeaux'],
            [7, 'Lille'],
            [8, 'Nice'],
            [9, 'Strasbourg'],
            [10, 'Rennes']
        ];
        
        for (const agence of agences) {
            await this.run(`
                INSERT OR REPLACE INTO agences (id_agence, nom) 
                VALUES (?, ?)
            `, agence);
        }

    // Insertion des fonctions
    const fonctions = [
        [1, 'Architecte', 'Conception architecturale et coordination de projet', 1],
        [2, 'Ingenieur Structure', 'Calculs et dimensionnement des structures', 1],
        [3, 'Ingenieur Fluides', 'Conception des installations CVC et plomberie', 1],
        [4, 'Ingenieur VRD', 'Voirie, réseaux et aménagements extérieurs', 1],
        [5, 'Chef de Projet', 'Pilotage et coordination des équipes projet', 1],
        [6, 'Economiste', 'Estimation des coûts et suivi budgétaire', 1],
        [7, 'Architecte Paysagiste', 'Conception des espaces verts et paysagers', 1],
        [8, 'Dessinateur', 'Réalisation des plans et documents techniques', 1],
        [9, 'BIM Manager', 'Coordination et gestion des maquettes numériques', 1],
        [10, 'Chargé d\'affaires', 'Développement commercial et suivi client', 1]
    ];

    for (const fonction of fonctions) {
        await this.run(`
            INSERT OR REPLACE INTO fonctions 
            (id_fonction, nom, description, actif) 
            VALUES (?, ?, ?, ?)
        `, fonction);
    }

    // Insertion des niveaux d'expertise
    const niveaux = [
        [1, 'Junior', 1, '0-2 ans d\'expérience', 1],
        [2, 'Confirme', 2, '3-5 ans d\'expérience', 1],
        [3, 'Senior', 3, '6-10 ans d\'expérience', 1],
        [4, 'Expert', 4, 'Plus de 10 ans d\'expérience', 1]
    ];

    for (const niveau of niveaux) {
        await this.run(`
            INSERT OR REPLACE INTO niveaux_expertise 
            (id_niveau, nom, ordre, description, actif) 
            VALUES (?, ?, ?, ?, ?)
        `, niveau);
    }

    console.log('✅ Données de test insérées avec succès');
    }

    /**
     * Exécute un script SQL depuis un fichier
     */
    async executeScript(filename) {
        const scriptPath = path.join(__dirname, filename);
        const sql = fs.readFileSync(scriptPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) {
                    console.error(`❌ Erreur exécution ${filename}:`, err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Exécute une requête SQL (INSERT, UPDATE, DELETE)
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Erreur SQL run:', err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Exécute une requête SELECT et retourne une ligne
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ Erreur SQL get:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Exécute une requête SELECT et retourne toutes les lignes
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Erreur SQL all:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Ferme la connexion à la base de données
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Erreur fermeture base:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Connexion base de données fermée');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // ===================================
    // MÉTHODES MÉTIER - SALARIÉS
    // ===================================

    /**
     * Récupère tous les salariés actifs
     */
    async getAllSalaries() {
        const sql = `
            SELECT 
                id_salarie, nom, prenom, agence, fonction, 
                niveau_expertise, email, telephone, chemin_cv,
                date_creation, actif
            FROM salaries 
            ORDER BY nom, prenom
        `;
        return await this.all(sql);
    }

    /**
     * Récupère un salarié par ID
     */
    async getSalarieById(id) {
        const sql = `
            SELECT * FROM salaries 
            WHERE id_salarie = ? AND actif = 1
        `;
        return await this.get(sql, [id]);
    }

    /**
     * Ajoute un nouveau salarié
     */
    async addSalarie(salarie) {
        const sql = `
            INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const email = `${salarie.prenom.toLowerCase()}.${salarie.nom.toLowerCase()}@entreprise.com`;
        const result = await this.run(sql, [
            salarie.nom, salarie.prenom, salarie.agence, salarie.fonction, 
            salarie.niveau_expertise, email, salarie.telephone || null, 
            salarie.actif !== undefined ? salarie.actif : 1
        ]);
        return { id: result.lastID };
    }

    /**
     * Met à jour un salarié
     */
    async updateSalarie(id, salarie) {
        const sql = `
            UPDATE salaries 
            SET nom = ?, prenom = ?, agence = ?, fonction = ?, niveau_expertise = ?, 
                telephone = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_salarie = ?
        `;
        
        // Convertir le booléen en entier pour SQLite
        const actifValue = salarie.actif !== undefined ? (salarie.actif ? 1 : 0) : 1;
        
        return await this.run(sql, [
            salarie.nom, salarie.prenom, salarie.agence, salarie.fonction, 
            salarie.niveau_expertise, salarie.telephone || null, 
            actifValue, id
        ]);
    }

    // ===================================
    // MÉTHODES MÉTIER - RÉFÉRENCES
    // ===================================

    /**
     * Récupère toutes les références
     */
    async getAllReferences() {
        const sql = `
            SELECT 
                id_reference, nom_projet, ville, annee, type_mission,
                montant, description_courte AS description_projet, client, duree_mois, surface,
                date_ajout
            FROM projets_references 
            ORDER BY annee DESC, nom_projet
        `;
        return await this.all(sql);
    }

    /**
     * Récupère une référence par ID
     */
    async getReferenceById(id) {
        const sql = `
            SELECT * FROM projets_references 
            WHERE id_reference = ?
        `;
        return await this.get(sql, [id]);
    }

    /**
     * Récupère les références d'un salarié
     */
    async getReferencesBySalarie(salarieId) {
        const sql = `
            SELECT 
                r.*, sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
            FROM projets_references r
            INNER JOIN salaries_references sr ON r.id_reference = sr.id_reference
            WHERE sr.id_salarie = ?
            ORDER BY sr.principal DESC, r.annee DESC
        `;
        return await this.all(sql, [salarieId]);
    }

    /**
     * Récupère les dernières références pour plusieurs salariés
     * @param {Array} salarieIds - Liste des IDs des salariés
     * @param {number} limit - Nombre maximum de références par salarié (défaut: 5)
     * @returns {Object} Objet avec salarieId comme clé et array de références comme valeur
     */
    async getLatestReferencesBySalaries(salarieIds, limit = 5) {
        if (!salarieIds || salarieIds.length === 0) {
            return {};
        }

        const result = {};
        
        // Pour chaque salarié, récupérer ses dernières références
        for (const salarieId of salarieIds) {
            console.log(`🔍 [DB] Recherche références pour salarié ${salarieId}`);
            
            const sql = `
                SELECT 
                    r.id_reference, r.nom_projet, r.ville, r.annee, r.type_mission,
                    r.montant, r.description_courte AS description_projet, r.client,
                    sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
                FROM projets_references r
                INNER JOIN salaries_references sr ON r.id_reference = sr.id_reference
                WHERE sr.id_salarie = ?
                ORDER BY r.annee DESC, sr.principal DESC, r.nom_projet
                LIMIT ?
            `;
            
            const references = await this.all(sql, [salarieId, limit]);
            console.log(`📅 [DB] Salarié ${salarieId}: ${references.length} références trouvées`);
            
            result[salarieId] = references;
        }
        
        return result;
    }

    /**
     * Alias pour getReferencesBySalarie (compatibilité API)
     */
    async getSalarieReferences(salarieId) {
        return await this.getReferencesBySalarie(salarieId);
    }

    /**
     * Ajoute une nouvelle référence
     */
    async addReference(reference) {
        const sql = `
            INSERT INTO projets_references (
                nom_projet, ville, annee, type_mission, montant,
                description_courte, client, duree_mois, surface
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.run(sql, [
            reference.nom_projet, 
            reference.ville || '', 
            reference.annee || new Date().getFullYear(),
            reference.type_mission || '', 
            reference.montant || null, 
            reference.description_projet || reference.description_courte || '',
            reference.client,
            reference.duree_mois || null,
            reference.surface || null
        ]);
        return { id: result.lastID };
    }

    /**
     * Met à jour une référence
     */
    async updateReference(id, reference) {
        const sql = `
            UPDATE projets_references 
            SET nom_projet = ?, ville = ?, annee = ?, type_mission = ?, 
                montant = ?, description_courte = ?, client = ?, 
                duree_mois = ?, surface = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_reference = ?
        `;
        return await this.run(sql, [
            reference.nom_projet, 
            reference.ville, 
            reference.annee,
            reference.type_mission, 
            reference.montant, 
            reference.description_projet || reference.description_courte,
            reference.client, 
            reference.duree_mois || null,
            reference.surface || null,
            id
        ]);
    }

    // ===================================
    // MÉTHODES MÉTIER - ASSOCIATIONS
    // ===================================

    /**
     * Associe un salarié à une référence
     */
    async associateSalarieReference(salarieId, referenceId, roleProjet, principal = false) {
        const sql = `
            INSERT OR REPLACE INTO salaries_references 
            (id_salarie, id_reference, role_projet, principal)
            VALUES (?, ?, ?, ?)
        `;
        return await this.run(sql, [salarieId, referenceId, roleProjet, principal]);
    }

    /**
     * Supprime l'association salarié-référence
     */
    async dissociateSalarieReference(salarieId, referenceId) {
        const sql = `
            DELETE FROM salaries_references 
            WHERE id_salarie = ? AND id_reference = ?
        `;
        return await this.run(sql, [salarieId, referenceId]);
    }

    // ===================================
    // MÉTHODES MÉTIER - TABLES DE RÉFÉRENCE
    // ===================================

    /**
     * Récupère toutes les agences actives
     */
    async getAgences() {
        const sql = `
            SELECT * FROM agences 
            WHERE actif = 1 
            ORDER BY nom
        `;
        return await this.all(sql);
    }

    /**
     * Ajoute une nouvelle agence (ville)
     */
    async addAgence(agence) {
        const sql = `
            INSERT INTO agences (nom, actif) 
            VALUES (?, ?)
        `;
        return await this.run(sql, [agence.nom, 1]);
    }

    /**
     * Met à jour une agence (ville)
     */
    async updateAgence(id, agence) {
        const sql = `
            UPDATE agences 
            SET nom = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_agence = ?
        `;
        return await this.run(sql, [agence.nom, id]);
    }

    /**
     * Supprime une agence (désactivation)
     */
    async deleteAgence(id) {
        const sql = `UPDATE agences SET actif = 0, date_modification = CURRENT_TIMESTAMP WHERE id_agence = ?`;
        return await this.run(sql, [id]);
    }

    /**
     * Récupère toutes les fonctions actives
     */
    async getFonctions() {
        const sql = `
            SELECT * FROM fonctions 
            WHERE actif = 1 
            ORDER BY nom
        `;
        return await this.all(sql);
    }

    /**
     * Ajoute une nouvelle fonction
     */
    async addFonction(fonction) {
        const sql = `
            INSERT INTO fonctions (nom, description, actif) 
            VALUES (?, ?, ?)
        `;
        return await this.run(sql, [fonction.nom, fonction.description, 1]);
    }

    /**
     * Ajoute une fonction avec contrôle d'unicité (pour import Excel)
     */
    async addFonctionWithUniqueness(fonction) {
        // Vérifier si la fonction existe déjà
        const existingFunction = await this.get(
            'SELECT id_fonction FROM fonctions WHERE LOWER(nom) = LOWER(?)',
            [fonction.Fonction || fonction.nom]
        );
        
        if (existingFunction) {
            console.log(`⚠️ [DB] Fonction "${fonction.Fonction || fonction.nom}" existe déjà, ignorée`);
            return { exists: true, id: existingFunction.id_fonction };
        }
        
        // Ajouter la nouvelle fonction
        const sql = `
            INSERT INTO fonctions (nom, description, actif) 
            VALUES (?, ?, ?)
        `;
        const result = await this.run(sql, [
            fonction.Fonction || fonction.nom, 
            fonction.Description || fonction.description || '', 
            1
        ]);
        
        console.log(`✅ [DB] Fonction "${fonction.Fonction || fonction.nom}" ajoutée avec ID: ${result.lastID}`);
        return { exists: false, id: result.lastID };
    }

    /**
     * Met à jour une fonction
     */
    async updateFonction(id, fonction) {
        const sql = `
            UPDATE fonctions 
            SET nom = ?, description = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_fonction = ?
        `;
        return await this.run(sql, [fonction.nom, fonction.description, id]);
    }

    /**
     * Supprime une fonction (désactivation)
     */
    async deleteFonction(id) {
        const sql = `UPDATE fonctions SET actif = 0, date_modification = CURRENT_TIMESTAMP WHERE id_fonction = ?`;
        return await this.run(sql, [id]);
    }

    /**
     * Récupère tous les niveaux d'expertise actifs
     */
    async getNiveauxExpertise() {
        const sql = `
            SELECT * FROM niveaux_expertise 
            WHERE actif = 1 
            ORDER BY ordre
        `;
        return await this.all(sql);
    }

    /**
     * Ajoute un nouveau niveau d'expertise
     */
    async addNiveauExpertise(niveau) {
        const sql = `
            INSERT INTO niveaux_expertise (nom, ordre, description, actif) 
            VALUES (?, ?, ?, ?)
        `;
        return await this.run(sql, [niveau.nom, niveau.ordre, niveau.description, 1]);
    }

    /**
     * Met à jour un niveau d'expertise
     */
    async updateNiveauExpertise(id, niveau) {
        const sql = `
            UPDATE niveaux_expertise 
            SET nom = ?, ordre = ?, description = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_niveau = ?
        `;
        return await this.run(sql, [niveau.nom, niveau.ordre, niveau.description, id]);
    }

    /**
     * Supprime un niveau d'expertise (désactivation)
     */
    async deleteNiveauExpertise(id) {
        const sql = `UPDATE niveaux_expertise SET actif = 0, date_modification = CURRENT_TIMESTAMP WHERE id_niveau = ?`;
        return await this.run(sql, [id]);
    }

    // ===================================
    // GESTION DES ASSOCIATIONS SALARIÉS-RÉFÉRENCES
    // ===================================

    /**
     * Récupère les références associées à un salarié
     */
    async getSalarieReferences(salarieId) {
        const sql = `
            SELECT 
                pr.*,
                sr.role_projet,
                sr.date_debut,
                sr.date_fin,
                sr.principal
            FROM projets_references pr
            INNER JOIN salaries_references sr ON pr.id_reference = sr.id_reference
            WHERE sr.id_salarie = ?
            ORDER BY sr.principal DESC, pr.annee DESC
        `;
        return await this.all(sql, [salarieId]);
    }

    /**
     * Associe une référence à un salarié
     */
    async addSalarieReference(salarieId, referenceId, options = {}) {
        const sql = `
            INSERT INTO salaries_references 
            (id_salarie, id_reference, role_projet, date_debut, date_fin, principal)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await this.run(sql, [
            salarieId,
            referenceId,
            options.role_projet || null,
            options.date_debut || null,
            options.date_fin || null,
            options.principal || false
        ]);
    }

    /**
     * Supprime l'association entre un salarié et une référence
     */
    async removeSalarieReference(salarieId, referenceId) {
        const sql = `
            DELETE FROM salaries_references 
            WHERE id_salarie = ? AND id_reference = ?
        `;
        return await this.run(sql, [salarieId, referenceId]);
    }

    /**
     * Met à jour une association salarié-référence
     */
    async updateSalarieReference(salarieId, referenceId, options = {}) {
        const sql = `
            UPDATE salaries_references 
            SET role_projet = ?, date_debut = ?, date_fin = ?, principal = ?
            WHERE id_salarie = ? AND id_reference = ?
        `;
        return await this.run(sql, [
            options.role_projet || null,
            options.date_debut || null,
            options.date_fin || null,
            options.principal || false,
            salarieId,
            referenceId
        ]);
    }

    /**
     * Récupère tous les salariés avec leurs références
     */
    async getSalariesWithReferences() {
        try {
            const salaries = await this.getSalaries();
            
            for (const salarie of salaries) {
                try {
                    salarie.references = await this.getSalarieReferences(salarie.id_salarie);
                } catch (error) {
                    console.error(`Erreur récupération références pour salarié ${salarie.id_salarie}:`, error.message);
                    salarie.references = []; // Valeur par défaut si erreur
                }
            }
            
            return salaries;
        } catch (error) {
            console.error('Erreur getSalariesWithReferences:', error.message);
            throw error;
        }
    }

    /**
     * Définit les références par défaut d'un salarié (remplace toutes les associations existantes)
     */
    async setSalarieDefaultReferences(salarieId, referenceIds) {
        try {
            console.log(`🔧 [DB] setSalarieDefaultReferences - salarié: ${salarieId}, références:`, referenceIds);
            
            // Supprimer toutes les associations existantes
            console.log(`🗑️ [DB] Suppression associations existantes pour salarié ${salarieId}`);
            const deleteResult = await this.run('DELETE FROM salaries_references WHERE id_salarie = ?', [salarieId]);
            console.log(`✅ [DB] ${deleteResult.changes || 0} associations supprimées`);
            
            // Ajouter les nouvelles associations
            console.log(`➕ [DB] Ajout de ${referenceIds.length} nouvelles associations`);
            for (const referenceId of referenceIds) {
                console.log(`➕ [DB] Ajout association: salarié ${salarieId} <-> référence ${referenceId}`);
                await this.addSalarieReference(salarieId, referenceId, { principal: false });
            }
            
            console.log(`✅ [DB] setSalarieDefaultReferences terminé avec succès`);
            return { success: true, count: referenceIds.length };
        } catch (error) {
            console.error(`❌ [DB] Erreur setSalarieDefaultReferences:`, error.message);
            throw error;
        }
    }

    /**
     * Ajoute un salarié avec contrôle d'unicité (pour import Excel)
     */
    async addSalarieWithUniqueness(salarie) {
        // Vérifier si le salarié existe déjà (nom + prénom)
        const existingSalarie = await this.get(
            'SELECT id_salarie FROM salaries WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)',
            [salarie.Nom || salarie.nom, salarie.Prenom || salarie.prenom]
        );
        
        if (existingSalarie) {
            console.log(`⚠️ [DB] Salarié "${salarie.Prenom || salarie.prenom} ${salarie.Nom || salarie.nom}" existe déjà, ignoré`);
            return { exists: true, id: existingSalarie.id_salarie };
        }
        
        // Ajouter le nouveau salarié
        const email = `${(salarie.Prenom || salarie.prenom).toLowerCase()}.${(salarie.Nom || salarie.nom).toLowerCase()}@entreprise.com`;
        const sql = `
            INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.run(sql, [
            salarie.Nom || salarie.nom,
            salarie.Prenom || salarie.prenom,
            salarie.Agence || salarie.agence || '',
            salarie.Fonction || salarie.fonction || '',
            salarie.Niveau_Expertise || salarie.niveau_expertise || '',
            salarie.Email || email,
            salarie.Telephone || salarie.telephone || null,
            1
        ]);
        
        console.log(`✅ [DB] Salarié "${salarie.Prenom || salarie.prenom} ${salarie.Nom || salarie.nom}" ajouté avec ID: ${result.id}`);
        return { exists: false, id: result.id };
    }

    /**
     * Supprime un salarié par son ID
     */
    async deleteSalarie(id) {
        // D'abord supprimer les associations avec les références
        await this.run('DELETE FROM salaries_references WHERE id_salarie = ?', [id]);
        
        // Ensuite supprimer le salarié
        const result = await this.run('DELETE FROM salaries WHERE id_salarie = ?', [id]);
        
        console.log(`🗑️ [DB] Salarié avec ID ${id} supprimé`);
        return result.changes > 0;
    }

    /**
     * Supprime une référence par son ID
     */
    async deleteReference(id) {
        // D'abord supprimer les associations avec les salariés
        await this.run('DELETE FROM salaries_references WHERE id_reference = ?', [id]);
        
        // Ensuite supprimer la référence
        const result = await this.run('DELETE FROM projets_references WHERE id_reference = ?', [id]);
        
        console.log(`🗑️ [DB] Référence avec ID ${id} supprimée`);
        return result.changes > 0;
    }

    /**
     * Ajoute une référence avec contrôle d'unicité (pour import Excel)
     */
    async addReferenceWithUniqueness(reference) {
        // Vérifier si la référence existe déjà (nom_projet + client + année)
        const existingReference = await this.get(
            'SELECT id_reference FROM projets_references WHERE LOWER(nom_projet) = LOWER(?) AND LOWER(client) = LOWER(?) AND annee = ?',
            [
                reference.Nom_Projet || reference.nom_projet,
                reference.Client || reference.client,
                reference.Annee || reference.annee
            ]
        );
        
        if (existingReference) {
            console.log(`⚠️ [DB] Référence "${reference.Nom_Projet || reference.nom_projet}" (${reference.Client || reference.client}, ${reference.Annee || reference.annee}) existe déjà, ignorée`);
            return { exists: true, id: existingReference.id_reference };
        }
        
        // Ajouter la nouvelle référence
        const sql = `
            INSERT INTO projets_references (
                nom_projet, ville, annee, type_mission, montant,
                description_courte, client, duree_mois, surface
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.run(sql, [
            reference.Nom_Projet || reference.nom_projet,
            reference.Ville || reference.ville || '',
            reference.Annee || reference.annee || new Date().getFullYear(),
            reference.Type_Mission || reference.type_mission || '',
            reference.Montant || reference.montant || null,
            reference.Description || reference.description_courte || '',
            reference.Client || reference.client,
            reference.Duree_Mois || reference.duree_mois || null,
            reference.Surface || reference.surface || null
        ]);
        
        console.log(`✅ [DB] Référence "${reference.Nom_Projet || reference.nom_projet}" ajoutée avec ID: ${result.id}`);
        return { exists: false, id: result.id };
    }

}

// Instance singleton
const dbManager = new DatabaseManager();

module.exports = dbManager;
