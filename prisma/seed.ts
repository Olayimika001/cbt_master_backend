import { seedAll } from '../src/lib/seed.js';

seedAll()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
