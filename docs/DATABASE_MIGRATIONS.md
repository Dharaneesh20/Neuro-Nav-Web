# NeuroNav - Database Migration Guide

## Overview
This guide explains how to manage database migrations and schema changes in NeuroNav using a migration framework.

## Migration Structure

Create a migrations directory:
```
server/
├── migrations/
│   ├── 001_create_users_collection.js
│   ├── 002_add_sensory_preferences.js
│   ├── 003_create_calm_scores.js
│   └── migration.js (runner)
└── models/
```

## Creating Migrations

### 1. Migration Template

**server/migrations/001_create_users_collection.js:**
```javascript
module.exports = {
  version: 1,
  description: 'Create users collection with initial indexes',
  
  up: async (db) => {
    console.log('⬆️  Running migration 001: Create users collection');
    
    // Create collection
    await db.createCollection('users');
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 });
    
    console.log('✅ Migration 001 completed');
  },
  
  down: async (db) => {
    console.log('⬇️  Rolling back migration 001');
    
    // Drop collection
    await db.collection('users').drop();
    
    console.log('✅ Rollback 001 completed');
  }
};
```

### 2. Add Schema Version

**server/migrations/002_add_schema_version.js:**
```javascript
module.exports = {
  version: 2,
  description: 'Add schema version to users and create migration history',
  
  up: async (db) => {
    console.log('⬆️  Running migration 002: Add schema version');
    
    // Add schema version field to existing documents
    await db.collection('users').updateMany(
      {},
      { $set: { schemaVersion: 2, migratedAt: new Date() } }
    );
    
    // Create migration history collection
    await db.createCollection('migrationHistory');
    await db.collection('migrationHistory').createIndex(
      { version: 1 },
      { unique: true }
    );
    
    console.log('✅ Migration 002 completed');
  },
  
  down: async (db) => {
    console.log('⬇️  Rolling back migration 002');
    
    // Remove schema version
    await db.collection('users').updateMany(
      {},
      { $unset: { schemaVersion: '', migratedAt: '' } }
    );
    
    // Drop migration history
    await db.collection('migrationHistory').drop();
    
    console.log('✅ Rollback 002 completed');
  }
};
```

### 3. Add Indexes

**server/migrations/003_add_calm_score_indexes.js:**
```javascript
module.exports = {
  version: 3,
  description: 'Add indexes for calm score queries',
  
  up: async (db) => {
    console.log('⬆️  Running migration 003: Add calm score indexes');
    
    await db.collection('calmscores').createIndex(
      { userId: 1, timestamp: -1 }
    );
    
    await db.collection('calmscores').createIndex(
      { location: '2dsphere' }
    );
    
    // Create text index for search
    await db.collection('calmscores').createIndex(
      { stressors: 'text' }
    );
    
    console.log('✅ Migration 003 completed');
  },
  
  down: async (db) => {
    console.log('⬇️  Rolling back migration 003');
    
    const indexes = [
      'userId_1_timestamp_-1',
      'location_2dsphere',
      'stressors_text'
    ];
    
    for (const index of indexes) {
      try {
        await db.collection('calmscores').dropIndex(index);
      } catch (error) {
        console.warn(`Index ${index} not found`);
      }
    }
    
    console.log('✅ Rollback 003 completed');
  }
};
```

## Migration Runner

**server/migrations/migration.js:**
```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(mongoUri) {
    this.mongoUri = mongoUri;
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = new MongoClient(this.mongoUri);
    await this.client.connect();
    this.db = this.client.db();
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async getMigrations() {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.match(/^\d{3}_.+\.js$/))
      .sort();

    return files.map(f => {
      const migration = require(path.join(migrationsDir, f));
      return {
        file: f,
        ...migration
      };
    });
  }

  async getAppliedMigrations() {
    const collection = this.db.collection('migrationHistory');
    const history = await collection.find().sort({ version: 1 }).toArray();
    return history;
  }

  async recordMigration(version) {
    const collection = this.db.collection('migrationHistory');
    await collection.insertOne({
      version,
      appliedAt: new Date(),
      status: 'applied'
    });
  }

  async removeMigrationRecord(version) {
    const collection = this.db.collection('migrationHistory');
    await collection.deleteOne({ version });
  }

  async up(targetVersion = null) {
    await this.connect();

    try {
      const migrations = await this.getMigrations();
      const applied = await this.getAppliedMigrations();
      const appliedVersions = new Set(applied.map(m => m.version));

      let completed = 0;
      for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) {
          continue;
        }

        if (targetVersion && migration.version > targetVersion) {
          break;
        }

        console.log(`\n🔄 Applying migration ${migration.version}: ${migration.description}`);
        await migration.up(this.db);
        await this.recordMigration(migration.version);
        completed++;
      }

      console.log(`\n✅ ${completed} migration(s) completed`);
    } finally {
      await this.disconnect();
    }
  }

  async down(steps = 1) {
    await this.connect();

    try {
      const migrations = await this.getMigrations();
      const applied = await this.getAppliedMigrations();

      // Get last N migrations
      const toRollback = applied.slice(-steps);

      for (const record of toRollback.reverse()) {
        const migration = migrations.find(m => m.version === record.version);
        if (!migration) {
          console.warn(`Migration ${record.version} not found`);
          continue;
        }

        console.log(`\n🔄 Rolling back migration ${migration.version}: ${migration.description}`);
        await migration.down(this.db);
        await this.removeMigrationRecord(migration.version);
      }

      console.log(`\n✅ ${toRollback.length} migration(s) rolled back`);
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    await this.connect();

    try {
      const migrations = await this.getMigrations();
      const applied = await this.getAppliedMigrations();
      const appliedVersions = new Set(applied.map(m => m.version));

      console.log('\n📊 Migration Status:');
      console.log('─'.repeat(60));

      for (const migration of migrations) {
        const status = appliedVersions.has(migration.version) ? '✅' : '⏳';
        console.log(`${status} ${migration.version}: ${migration.description}`);
      }

      console.log('─'.repeat(60));
      console.log(`Applied: ${applied.length}/${migrations.length}`);
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = MigrationRunner;
```

## Running Migrations

**scripts/migrate.js:**
```javascript
const MigrationRunner = require('../server/migrations/migration');
const dotenv = require('dotenv');

dotenv.config();

const command = process.argv[2];
const arg = process.argv[3];

const runner = new MigrationRunner(process.env.MONGODB_URI);

(async () => {
  try {
    switch (command) {
      case 'up':
        await runner.up(arg ? parseInt(arg) : null);
        break;
      case 'down':
        await runner.down(arg ? parseInt(arg) : 1);
        break;
      case 'status':
        await runner.status();
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migrate up [version]     - Apply migrations');
        console.log('  npm run migrate down [steps]     - Rollback migrations');
        console.log('  npm run migrate status           - Show migration status');
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
})();
```

## Add to package.json

```json
{
  "scripts": {
    "migrate:up": "node scripts/migrate.js up",
    "migrate:down": "node scripts/migrate.js down",
    "migrate:status": "node scripts/migrate.js status",
    "migrate:create": "node scripts/create-migration.js"
  }
}
```

## Usage

```bash
# View migration status
npm run migrate:status

# Apply pending migrations
npm run migrate:up

# Apply migrations up to version 5
npm run migrate:up 5

# Rollback last migration
npm run migrate:down

# Rollback last 3 migrations
npm run migrate:down 3

# Create new migration
npm run migrate:create "add_new_field_to_users"
```

## Zero-Downtime Deployments

### 1. Backward-Compatible Changes

```javascript
// Migration: Add optional field
module.exports = {
  version: 4,
  description: 'Add optional profile picture to users',
  
  up: async (db) => {
    // Add field with default value (doesn't break existing code)
    await db.collection('users').updateMany(
      { profilePictureUrl: { $exists: false } },
      { $set: { profilePictureUrl: null } }
    );
  }
};
```

### 2. Blue-Green Deployment

```bash
# Deploy new code first (points to old schema)
docker pull registry.example.com/neuronav:v2

# Run both old and new versions
docker run -d -e MIGRATION_VERSION=3 neuronav:v1
docker run -d -e MIGRATION_VERSION=4 neuronav:v2

# Run migrations on database
npm run migrate:up

# Switch traffic to new version
# Remove old version
docker stop neuronav:v1
```

## Best Practices

1. **One change per migration** - Keep migrations focused
2. **Always test migrations** - Test in dev first
3. **Write down migrations** - Always include both up and down
4. **Version control** - Commit migrations to git
5. **Timestamp backups** - Backup before running migrations
6. **Test rollbacks** - Ensure down migrations work
7. **Idempotent operations** - Migrations should be repeatable
8. **Document changes** - Explain what the migration does

## Troubleshooting

### Migration Stuck

```bash
# Check migration history
db.migrationHistory.find()

# Manually record as applied if needed
db.migrationHistory.insertOne({ version: 5, appliedAt: new Date() })
```

### Rollback Issues

```bash
# Connect to MongoDB and check collection state
mongo neuronav
db.users.findOne()

# Drop and recreate if necessary
db.users.drop()
```

---

**Last Updated**: February 2026
