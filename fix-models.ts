import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

(async () => {
  try {
    const db = drizzle(neon(process.env.DATABASE_URL));
    
    // Update invalid models to valid ones
    const updates = [
      { id: '2bc7d283-a153-4f99-ac0d-694bc1db05ce', newModel: 'qwen/qwen-plus' },
      { id: 'e9d56b02-352b-4757-9202-9803e3e8a12f', newModel: 'openai/gpt-3.5-turbo' },
      { id: '3ae003b6-c4ad-42d6-8ba9-42c042b20787', newModel: 'openai/gpt-3.5-turbo' },
      { id: '63ccf0a6-1835-4d34-abb0-eb3a2f149cd1', newModel: 'openai/gpt-3.5-turbo' },
      { id: '5980dcee-f319-4f22-ba59-cc1c1041a8c5', newModel: 'perplexity/sonar-pro-search' },
      { id: 'd83a23a0-1ddb-4042-b249-7a1848a80162', newModel: 'openai/gpt-3.5-turbo' },
    ];
    
    for (const update of updates) {
      await db.execute(`UPDATE agents SET model = '${update.newModel}' WHERE id = '${update.id}'`);
    }
    
    console.log('Updated all invalid models');
    const rows = await db.execute('SELECT id, name, model FROM agents');
    console.log(JSON.stringify(rows.rows, null, 2));
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  }
})();
