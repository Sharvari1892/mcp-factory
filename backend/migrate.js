require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function migrate() {
try {
const migrationsDir = path.join(
__dirname,
'src',
'db',
'migrations'
);


    const files = fs
        .readdirSync(migrationsDir)
        .sort();

    for (const file of files) {
        console.log(`Running ${file}`);

        const sql = fs.readFileSync(
            path.join(migrationsDir, file),
            'utf8'
        );

        await pool.query(sql);
    }

    console.log('All migrations completed');
}
catch (err) {
    console.error(err);
}
finally {
    await pool.end();
}


}

migrate();
