import fs from 'fs';
import path from 'path';

const STRAPI_URL = 'http://localhost:1337/api/psychologists';

async function seedData() {
  console.log('Reading psychologists.json...');
  
  // To deal with ES modules, we use process.cwd() or relative path
  const jsonPath = new URL('./src/data/psychologists.json', import.meta.url).pathname;
  
  let psychologists = [];
  try {
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    psychologists = JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to read JSON file:', error.message);
    process.exit(1);
  }

  console.log(`Found ${psychologists.length} records. Starting import...`);

  let successCount = 0;
  let errorCount = 0;

  for (const psych of psychologists) {
    try {
        // Strapi requires the fields to be wrapped in a 'data' object
        const payload = {
            data: {
                name: psych.name,
                avatar: psych.avatar,
                experience: psych.experience,
                license: psych.license,
                specialization: psych.specialization,
                initial_consultation: psych.initial_consultation,
                about: psych.about,
                rating: psych.rating,
                price_per_hour: psych.price_per_hour,
                popular: psych.popular,
                reviews: psych.reviews,
                isAvailable: true,
                publishedAt: new Date().toISOString()
            }
        };

        const response = await fetch(STRAPI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            console.error(`Failed to insert ${psych.name}:`, JSON.stringify(errorResult.error));
            errorCount++;
        } else {
            console.log(`✅ Successfully inserted: ${psych.name}`);
            successCount++;
        }
    } catch (error) {
        console.error(`Error processing ${psych.name}:`, error.message);
        errorCount++;
    }
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

seedData();
