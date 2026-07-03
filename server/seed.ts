import mongoose from 'mongoose';
import dotenv from 'dotenv';
import App from './src/models/App';
import Category from './src/models/Category';
import Version from './src/models/Version';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB, clearing existing data...');

    await App.deleteMany({});
    await Category.deleteMany({});
    await Version.deleteMany({});

    console.log('Creating categories...');
    const catGames = await Category.create({ name: 'Games', slug: 'games', icon: 'Gamepad2' });
    const catProd = await Category.create({ name: 'Productivity', slug: 'productivity', icon: 'Briefcase' });
    const catSocial = await Category.create({ name: 'Social', slug: 'social', icon: 'MessageCircle' });

    console.log('Creating apps...');
    const app1 = await App.create({
      packageName: 'com.unity.app',
      name: 'unityApp',
      developer: 'Unity Corp',
      category: catGames._id,
      description: 'Experience the thrill of high-speed racing with stunning graphics and realistic physics. Elite Racer Pro brings you the ultimate arcade racing experience.',
      shortDescription: 'High-speed arcade racing game.',
      iconUrl: 'http://localhost:5173/images/unity.png',
      featureGraphicUrl: 'https://placehold.co/800x400/2563eb/ffffff?text=unityApp',
      screenshots: [
        'https://placehold.co/300x600/2563eb/ffffff?text=Screen+1',
        'https://placehold.co/300x600/2563eb/ffffff?text=Screen+2'
      ],
      rating: 4.8,
      downloads: 12500,
      tags: ['racing', '3d', 'multiplayer'],
      website: 'https://eliteracer.com',
      isEditorChoice: true,
      isTrending: true,
      isFeatured: true
    });

    const app2 = await App.create({
      packageName: 'com.elite.space',
      name: 'EliteSpace',
      developer: 'Elite Gaming Studios',
      category: catProd._id,
      description: 'The ultimate note-taking app powered by AI. Organize your thoughts, transcribe audio, and let the AI generate summaries for you instantly.',
      shortDescription: 'AI-powered note-taking and organization.',
      iconUrl: 'http://localhost:5173/images/space.png',
      featureGraphicUrl: 'https://placehold.co/800x400/0f172a/ffffff?text=EliteSpace',
      screenshots: [
        'https://placehold.co/300x600/0f172a/ffffff?text=Space+Screen'
      ],
      rating: 4.5,
      downloads: 8300,
      tags: ['notes', 'ai', 'productivity'],
      isEditorChoice: false,
      isTrending: true,
      isFeatured: false
    });

    const app3 = await App.create({
      packageName: 'com.chatly.app',
      name: 'chatlyApp',
      developer: 'Chatly Inc',
      category: catSocial._id,
      description: 'A revolutionary new way to connect with friends and family. Share moments, video chat in high definition, and join communities of interest.',
      shortDescription: 'Next-gen social networking app.',
      iconUrl: 'http://localhost:5173/images/chat.png',
      featureGraphicUrl: 'https://placehold.co/800x400/10b981/ffffff?text=chatlyApp',
      screenshots: [
        'https://placehold.co/300x600/10b981/ffffff?text=Chat+Screen'
      ],
      rating: 4.2,
      downloads: 42000,
      tags: ['social', 'chat', 'video'],
      isEditorChoice: true,
      isTrending: false,
      isFeatured: true
    });

    console.log('Creating versions...');
    await Version.create({
      appId: app1._id,
      versionName: '1.2.0',
      versionCode: 12,
      apkUrl: 'https://ik.imagekit.io/amanikbt1/placeholder.apk',
      fileSize: 45000000,
      sha256Checksum: 'a1b2c3d4e5f6g7h8',
      releaseNotes: 'Added new cars and tracks! Performance improvements.',
      isMandatoryUpdate: false
    });

    await Version.create({
      appId: app2._id,
      versionName: '2.0.1',
      versionCode: 20,
      apkUrl: 'https://ik.imagekit.io/amanikbt1/placeholder2.apk',
      fileSize: 12000000,
      sha256Checksum: 'b2c3d4e5f6g7h8i9',
      releaseNotes: 'Introduced AI summaries and dark mode.',
      isMandatoryUpdate: true
    });

    await Version.create({
      appId: app3._id,
      versionName: '3.5.0',
      versionCode: 35,
      apkUrl: 'https://ik.imagekit.io/amanikbt1/placeholder3.apk',
      fileSize: 28000000,
      sha256Checksum: 'c3d4e5f6g7h8i9j0',
      releaseNotes: 'High-definition video calling is finally here.',
      isMandatoryUpdate: false
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedData();
