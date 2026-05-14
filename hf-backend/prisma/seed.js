// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Prisma Seed
// Run: npm run db:seed
// Idempotent: uses upsert throughout — safe to run multiple times.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Category data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name:         'Web Development',
    slug:         'web-development',
    description:  'Learn HTML, CSS, JavaScript, React, Node.js and full-stack frameworks to build modern websites and web applications.',
    icon:         '🌐',
    color:        '#4F46E5',
    youtubeQuery: 'web development tutorial',
  },
  {
    name:         'AI/ML',
    slug:         'ai-ml',
    description:  'Explore artificial intelligence, machine learning algorithms, deep learning, and data science with hands-on tutorials.',
    icon:         '🤖',
    color:        '#7C3AED',
    youtubeQuery: 'machine learning tutorial',
  },
  {
    name:         'DSA',
    slug:         'dsa',
    description:  'Master data structures and algorithms — arrays, trees, graphs, sorting, searching, dynamic programming, and problem solving.',
    icon:         '🧮',
    color:        '#2563EB',
    youtubeQuery: 'data structures algorithms',
  },
  {
    name:         'Cybersecurity',
    slug:         'cybersecurity',
    description:  'Understand ethical hacking, network security, cryptography, pen testing, and best practices to protect systems and data.',
    icon:         '🔒',
    color:        '#DC2626',
    youtubeQuery: 'cybersecurity tutorial',
  },
  {
    name:         'Cloud Computing',
    slug:         'cloud-computing',
    description:  'Get hands-on with AWS, Azure, GCP, Docker, Kubernetes, and cloud-native architectures for scalable deployments.',
    icon:         '☁️',
    color:        '#0891B2',
    youtubeQuery: 'cloud computing AWS',
  },
  {
    name:         'UI/UX Design',
    slug:         'ui-ux-design',
    description:  'Learn design principles, Figma, wireframing, prototyping, and user research to create delightful digital experiences.',
    icon:         '🎨',
    color:        '#D97706',
    youtubeQuery: 'ui ux design tutorial',
  },
  {
    name:         'Interview Preparation',
    slug:         'interview-prep',
    description:  'Ace technical interviews with system design, behavioral questions, coding challenges, and FAANG interview strategies.',
    icon:         '💼',
    color:        '#059669',
    youtubeQuery: 'coding interview preparation',
  },
  {
    name:         'Mobile Development',
    slug:         'mobile-development',
    description:  'Build iOS and Android applications using React Native, Flutter, Swift, and Kotlin for cross-platform and native mobile apps.',
    icon:         '📱',
    color:        '#DB2777',
    youtubeQuery: 'mobile app development',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Sample playlist videos
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_VIDEOS = [
  {
    youtubeVideoId:  'nu_pCVPKzTk',
    title:           'HTML & CSS Full Course – Beginner to Pro',
    thumbnailUrl:    'https://img.youtube.com/vi/nu_pCVPKzTk/hqdefault.jpg',
    channelTitle:    'SuperSimpleDev',
    durationSeconds: 22380,
    viewCount:       BigInt('5200000'),
    likeCount:       BigInt('148000'),
    sortOrder:       1,
    isCompleted:     true,
    completedAt:     new Date('2026-04-15T10:00:00Z'),
    watchedSeconds:  22380,
  },
  {
    youtubeVideoId:  'Ke90Tje7VS0',
    title:           'React JS – Full Course for Beginners',
    thumbnailUrl:    'https://img.youtube.com/vi/Ke90Tje7VS0/hqdefault.jpg',
    channelTitle:    'ProgrammingWithMosh',
    durationSeconds: 20094,
    viewCount:       BigInt('9700000'),
    likeCount:       BigInt('210000'),
    sortOrder:       2,
    isCompleted:     true,
    completedAt:     new Date('2026-04-22T14:30:00Z'),
    watchedSeconds:  20094,
  },
  {
    youtubeVideoId:  'f2EqECiTBL8',
    title:           'Node.js and Express – Full Course',
    thumbnailUrl:    'https://img.youtube.com/vi/f2EqECiTBL8/hqdefault.jpg',
    channelTitle:    'freeCodeCamp',
    durationSeconds: 28800,
    viewCount:       BigInt('3100000'),
    likeCount:       BigInt('87000'),
    sortOrder:       3,
    isCompleted:     false,
    completedAt:     null,
    watchedSeconds:  9600,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  EduTrack seed starting...\n');

  // ── Step 1: Seed Categories ─────────────────────────────────────────────

  console.log('📂  Seeding categories...');
  const categoryMap = {};

  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {
        name:         cat.name,
        description:  cat.description,
        icon:         cat.icon,
        color:        cat.color,
        youtubeQuery: cat.youtubeQuery,
        isActive:     true,
      },
      create: {
        name:         cat.name,
        slug:         cat.slug,
        description:  cat.description,
        icon:         cat.icon,
        color:        cat.color,
        youtubeQuery: cat.youtubeQuery,
        isActive:     true,
      },
    });
    categoryMap[cat.slug] = record;
    console.log(`   ✅  Category: ${record.icon} ${record.name} (${record.id})`);
  }

  // ── Step 2: Seed Demo Student ───────────────────────────────────────────

  console.log('\n👤  Seeding demo student...');

  const studentPasswordHash = await bcrypt.hash('Demo@1234', 10);

  const demoStudent = await prisma.user.upsert({
    where:  { email: 'demo@edutrack.com' },
    update: {
      name:           'Demo Student',
      passwordHash:   studentPasswordHash,
      avatarUrl:      'https://api.dicebear.com/8.x/avataaars/svg?seed=demo',
      bio:            'Passionate IT student exploring web development and AI/ML.',
      emailVerified:  true,
      currentStreak:  12,
      longestStreak:  45,
      lastActiveDate: new Date(),
      isSuspended:    false,
    },
    create: {
      name:           'Demo Student',
      email:          'demo@edutrack.com',
      passwordHash:   studentPasswordHash,
      avatarUrl:      'https://api.dicebear.com/8.x/avataaars/svg?seed=demo',
      bio:            'Passionate IT student exploring web development and AI/ML.',
      role:           'STUDENT',
      emailVerified:  true,
      currentStreak:  12,
      longestStreak:  45,
      lastActiveDate: new Date(),
      isSuspended:    false,
    },
  });

  console.log(`   ✅  Student: ${demoStudent.name} <${demoStudent.email}> (${demoStudent.id})`);

  // ── Step 3: Seed Admin User ─────────────────────────────────────────────

  console.log('\n🛡️   Seeding admin user...');

  const adminPasswordHash = await bcrypt.hash('Admin@EduTrack2026', 10);

  const adminUser = await prisma.user.upsert({
    where:  { email: 'admin@edutrack.com' },
    update: {
      name:          'EduTrack Admin',
      passwordHash:  adminPasswordHash,
      avatarUrl:     'https://api.dicebear.com/8.x/avataaars/svg?seed=admin',
      bio:           'Platform administrator for EduTrack.',
      emailVerified: true,
      role:          'ADMIN',
      isSuspended:   false,
    },
    create: {
      name:          'EduTrack Admin',
      email:         'admin@edutrack.com',
      passwordHash:  adminPasswordHash,
      avatarUrl:     'https://api.dicebear.com/8.x/avataaars/svg?seed=admin',
      bio:           'Platform administrator for EduTrack.',
      role:          'ADMIN',
      emailVerified: true,
      isSuspended:   false,
    },
  });

  console.log(`   ✅  Admin: ${adminUser.name} <${adminUser.email}> (${adminUser.id})`);

  // ── Step 4: UserCategory assignments for demo student ──────────────────

  console.log('\n🔗  Assigning categories to demo student...');

  const studentCategories = ['web-development', 'ai-ml'];

  for (const slug of studentCategories) {
    const cat = categoryMap[slug];
    await prisma.userCategory.upsert({
      where: {
        userId_categoryId: {
          userId:     demoStudent.id,
          categoryId: cat.id,
        },
      },
      update: {},
      create: {
        userId:     demoStudent.id,
        categoryId: cat.id,
      },
    });
    console.log(`   ✅  UserCategory: ${demoStudent.email} → ${cat.icon} ${cat.name}`);
  }

  // ── Step 5: Sample Playlist for demo student ───────────────────────────

  console.log('\n📋  Seeding sample playlist...');

  const webDevCategoryId = categoryMap['web-development'].id;

  // Find existing playlist by userId + name (no unique constraint, so check manually)
  let playlist = await prisma.playlist.findFirst({
    where: {
      userId: demoStudent.id,
      name:   'Full Stack Web Dev Bootcamp',
    },
  });

  if (!playlist) {
    playlist = await prisma.playlist.create({
      data: {
        userId:            demoStudent.id,
        name:              'Full Stack Web Dev Bootcamp',
        categoryId:        webDevCategoryId,
        totalVideos:       15,
        completedCount:    12,
        progressPercent:   80.0,
        certificateIssued: false,
      },
    });
    console.log(`   ✅  Playlist created: "${playlist.name}" (${playlist.id})`);
  } else {
    playlist = await prisma.playlist.update({
      where: { id: playlist.id },
      data: {
        totalVideos:     15,
        completedCount:  12,
        progressPercent: 80.0,
      },
    });
    console.log(`   ✅  Playlist updated: "${playlist.name}" (${playlist.id})`);
  }

  // ── Step 6: Seed PlaylistVideos ─────────────────────────────────────────

  console.log('\n🎬  Seeding playlist videos...');

  for (const video of SAMPLE_VIDEOS) {
    const existing = await prisma.playlistVideo.findFirst({
      where: {
        playlistId:    playlist.id,
        youtubeVideoId: video.youtubeVideoId,
      },
    });

    if (!existing) {
      const pv = await prisma.playlistVideo.create({
        data: {
          playlistId:      playlist.id,
          youtubeVideoId:  video.youtubeVideoId,
          title:           video.title,
          thumbnailUrl:    video.thumbnailUrl,
          channelTitle:    video.channelTitle,
          durationSeconds: video.durationSeconds,
          viewCount:       video.viewCount,
          likeCount:       video.likeCount,
          sortOrder:       video.sortOrder,
          isCompleted:     video.isCompleted,
          completedAt:     video.completedAt,
          watchedSeconds:  video.watchedSeconds,
        },
      });
      console.log(`   ✅  Video [${pv.sortOrder}]: "${pv.title}" (${pv.youtubeVideoId})`);
    } else {
      console.log(`   ⏭️   Video already exists [${video.sortOrder}]: "${video.title}"`);
    }
  }

  // Fetch first video to link notes
  const firstVideo = await prisma.playlistVideo.findFirst({
    where: { playlistId: playlist.id, sortOrder: 1 },
  });

  // ── Step 7: Seed Notes ──────────────────────────────────────────────────

  console.log('\n📝  Seeding notes...');

  // Note 1 — TEXT (TipTap rich text)
  const textNoteContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'HTML & CSS Fundamentals' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'HTML (HyperText Markup Language) provides the structure of a web page. CSS (Cascading Style Sheets) controls the visual presentation.',
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Box model: margin, border, padding, content' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Flexbox for 1D layouts; Grid for 2D layouts' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'CSS variables (custom properties) for theming' }] }] },
        ],
      },
    ],
  });

  const existingTextNote = await prisma.note.findFirst({
    where: { userId: demoStudent.id, title: 'HTML & CSS Fundamentals', type: 'TEXT' },
  });

  if (!existingTextNote) {
    const textNote = await prisma.note.create({
      data: {
        userId:        demoStudent.id,
        type:          'TEXT',
        title:         'HTML & CSS Fundamentals',
        content:       textNoteContent,
        linkedVideoId: firstVideo?.id ?? null,
        playlistId:    playlist.id,
        tags:          ['html', 'css', 'web', 'frontend'],
      },
    });
    console.log(`   ✅  Text note: "${textNote.title}" (${textNote.id})`);
  } else {
    console.log(`   ⏭️   Text note already exists: "HTML & CSS Fundamentals"`);
  }

  // Note 2 — CODE (Monaco editor)
  const codeNoteContent = JSON.stringify({
    code: `// React functional component with hooks
import { useState, useEffect } from 'react';

function VideoProgress({ videoId, totalSeconds }) {
  const [watched, setWatched]   = useState(0);
  const [percent, setPercent]   = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const pct = totalSeconds > 0 ? (watched / totalSeconds) * 100 : 0;
    setPercent(Math.min(pct, 100));
    if (pct >= 80) setCompleted(true);
  }, [watched, totalSeconds]);

  return (
    <div className="p-4">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: \`\${percent}%\` }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {completed ? '✅ Completed!' : \`\${Math.round(percent)}% watched\`}
      </p>
    </div>
  );
}

export default VideoProgress;`,
  });

  const existingCodeNote = await prisma.note.findFirst({
    where: { userId: demoStudent.id, title: 'React Video Progress Component', type: 'CODE' },
  });

  if (!existingCodeNote) {
    const codeNote = await prisma.note.create({
      data: {
        userId:        demoStudent.id,
        type:          'CODE',
        title:         'React Video Progress Component',
        content:       codeNoteContent,
        language:      'javascript',
        linkedVideoId: firstVideo?.id ?? null,
        playlistId:    playlist.id,
        tags:          ['react', 'hooks', 'component', 'javascript'],
      },
    });
    console.log(`   ✅  Code note: "${codeNote.title}" (${codeNote.id})`);
  } else {
    console.log(`   ⏭️   Code note already exists: "React Video Progress Component"`);
  }

  // Note 3 — QUIZ
  const quizNoteContent = JSON.stringify({
    questions: [
      {
        id:       1,
        question: 'What does the CSS box model consist of?',
        answer:   'Content, Padding, Border, and Margin — from innermost to outermost.',
      },
      {
        id:       2,
        question: 'What is the difference between display:flex and display:grid?',
        answer:   'Flexbox is for one-dimensional layouts (row OR column). CSS Grid is for two-dimensional layouts (rows AND columns simultaneously).',
      },
      {
        id:       3,
        question: 'What does the React useEffect hook do?',
        answer:   'useEffect runs side effects (data fetching, subscriptions, DOM mutations) after render. It replaces componentDidMount, componentDidUpdate, and componentWillUnmount from class components.',
      },
      {
        id:       4,
        question: 'When is a video marked as "completed" in EduTrack?',
        answer:   'When the student has watched ≥ 80% of the total video duration.',
      },
    ],
  });

  const existingQuizNote = await prisma.note.findFirst({
    where: { userId: demoStudent.id, title: 'Web Dev Fundamentals – Quiz', type: 'QUIZ' },
  });

  if (!existingQuizNote) {
    const quizNote = await prisma.note.create({
      data: {
        userId:        demoStudent.id,
        type:          'QUIZ',
        title:         'Web Dev Fundamentals – Quiz',
        content:       quizNoteContent,
        playlistId:    playlist.id,
        linkedVideoId: firstVideo?.id ?? null,
        tags:          ['quiz', 'html', 'css', 'react', 'revision'],
      },
    });
    console.log(`   ✅  Quiz note: "${quizNote.title}" (${quizNote.id})`);
  } else {
    console.log(`   ⏭️   Quiz note already exists: "Web Dev Fundamentals – Quiz"`);
  }

  // ── Done ────────────────────────────────────────────────────────────────

  console.log('\n──────────────────────────────────────────');
  console.log('✅  EduTrack seed completed successfully!');
  console.log('──────────────────────────────────────────');
  console.log('   Demo Student : demo@edutrack.com   / Demo@1234');
  console.log('   Admin        : admin@edutrack.com  / Admin@EduTrack2026');
  console.log('──────────────────────────────────────────\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
