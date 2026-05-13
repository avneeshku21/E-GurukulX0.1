// Run: node --env-file=../.env scripts/seedCategories.js
import mongoose from 'mongoose';

await mongoose.connect(process.env.DATABASE_URL);
console.log('Connected to MongoDB');

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  icon: String,
  color: String,
  youtubeQuery: String,
  isActive: Boolean,
  videoCount: Number,
});
const Category = mongoose.model('Category', CategorySchema);

const categories = [
  { name: 'Programming',       slug: 'programming',       description: 'Learn coding and software development', icon: '💻', color: '#6366f1', youtubeQuery: 'programming tutorial coding',                  isActive: true, videoCount: 0 },
  { name: 'Mathematics',       slug: 'mathematics',       description: 'Math from basics to advanced',          icon: '📐', color: '#8b5cf6', youtubeQuery: 'mathematics tutorial lesson',                  isActive: true, videoCount: 0 },
  { name: 'Science',           slug: 'science',           description: 'Physics, chemistry, biology and more',  icon: '🔬', color: '#06b6d4', youtubeQuery: 'science education tutorial',                   isActive: true, videoCount: 0 },
  { name: 'History',           slug: 'history',           description: 'World history and civilizations',       icon: '🏛️', color: '#f59e0b', youtubeQuery: 'history lesson documentary educational',       isActive: true, videoCount: 0 },
  { name: 'Language Learning', slug: 'language-learning', description: 'Learn new languages effectively',       icon: '🌍', color: '#10b981', youtubeQuery: 'language learning tutorial lesson',             isActive: true, videoCount: 0 },
  { name: 'Data Science',      slug: 'data-science',      description: 'Data analysis, ML and AI',              icon: '📊', color: '#3b82f6', youtubeQuery: 'data science machine learning tutorial',        isActive: true, videoCount: 0 },
  { name: 'Design',            slug: 'design',            description: 'UI/UX, graphic design and creativity',  icon: '🎨', color: '#ec4899', youtubeQuery: 'design tutorial ui ux graphic',                 isActive: true, videoCount: 0 },
  { name: 'Web Development',   slug: 'web-development',   description: 'Frontend and backend web dev',          icon: '🌐', color: '#f97316', youtubeQuery: 'web development tutorial full course html css', isActive: true, videoCount: 0 },
];

let created = 0, updated = 0;
for (const cat of categories) {
  const result = await Category.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true });
  if (result.upsertedCount) { created++; console.log('  Created:', cat.name); }
  else { updated++; console.log('  Updated:', cat.name); }
}

console.log(`\nDone — ${created} created, ${updated} updated.`);
await mongoose.disconnect();
