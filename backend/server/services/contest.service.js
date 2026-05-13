import axios from 'axios';
import Contest from '../models/Contest.model.js';

const PLATFORM_LOGOS = {
  codeforces:     'https://codeforces.org/favicon-32x32.png',
  codeforces_gym: 'https://codeforces.org/favicon-32x32.png',
  leetcode:       'https://leetcode.com/favicon.ico',
  codechef:       'https://www.codechef.com/favicon.ico',
  hackerrank:     'https://www.hackerrank.com/favicon.ico',
  hackerearth:    'https://www.hackerearth.com/favicon.ico',
  atcoder:        'https://atcoder.jp/favicon.ico',
  topcoder:       'https://www.topcoder.com/favicon.ico',
  geeksforgeeks:  'https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_favicon.png',
  kaggle:         'https://www.kaggle.com/favicon.ico',
  devfolio:       'https://devfolio.co/favicon.ico',
  unstop:         'https://d8it4huxumps7.cloudfront.net/uploads/images/unstop/favicon.ico',
  mlh:            'https://static.mlh.io/favicon.ico',
  toph:           'https://toph.co/favicon.ico',
};

function normalizeKey(apiKey) {
  return apiKey.toLowerCase().replace(/-/g, '_');
}

function computeStatus(start, end) {
  const now = Date.now();
  const s   = new Date(start).getTime();
  const e   = new Date(end).getTime();
  if (now < s) return 'upcoming';
  if (now <= e) return 'live';
  return 'ended';
}

function tagsFor(platformKey, title = '') {
  const t = title.toLowerCase();
  const tags = [];
  if (['codeforces', 'codeforces_gym', 'atcoder', 'topcoder', 'codechef'].includes(platformKey))
    tags.push('DSA', 'Competitive');
  if (platformKey === 'leetcode') tags.push('DSA', 'Algorithms');
  if (t.includes('python'))  tags.push('Python');
  if (t.includes('web') || t.includes('frontend')) tags.push('Web Dev');
  if (t.includes('ml') || t.includes('ai') || t.includes('machine') || t.includes('deep'))
    tags.push('AI/ML');
  if (t.includes('hack'))    tags.push('Hackathon');
  if (t.includes('java') && !t.includes('javascript')) tags.push('Java');
  if (t.includes('javascript') || t.includes('react') || t.includes('node'))
    tags.push('JavaScript');
  if (t.includes('data'))    tags.push('Data Science');
  if (t.includes('beginner') || t.includes('abc')) tags.push('Beginner');
  if (!tags.length)          tags.push('Programming');
  return [...new Set(tags)];
}

function typeFor(platformKey, title = '') {
  const t = title.toLowerCase();
  if (['devfolio', 'mlh', 'unstop'].includes(platformKey) || t.includes('hackathon'))
    return 'hackathon';
  if (t.includes('internship') || t.includes('intern')) return 'internship';
  if (t.includes(' ai ') || t.includes('ml') || platformKey === 'kaggle') return 'aiml';
  if (t.includes('web') || t.includes('frontend')) return 'webdev';
  return 'contest';
}

function difficultyFor(title = '') {
  const t = title.toLowerCase();
  if (t.includes('div. 1') || t.includes('advanced') || t.includes('expert'))    return 'advanced';
  if (t.includes('div. 3') || t.includes('beginner') || t.includes('abc'))        return 'beginner';
  if (t.includes('div. 2') || t.includes('intermediate') || t.includes('regular')) return 'intermediate';
  return 'any';
}

function externalIdFromUrl(url = '') {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

async function fetchContestHive() {
  try {
    const { data } = await axios.get('https://contest-hive.vercel.app/api/all', {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });

    if (!data?.ok || !data?.data || typeof data.data !== 'object') return [];

    const results = [];
    for (const [apiKey, contests] of Object.entries(data.data)) {
      if (!Array.isArray(contests) || contests.length === 0) continue;
      const platformKey = normalizeKey(apiKey);

      for (const c of contests) {
        if (!c.title || !c.url || !c.startTime || !c.endTime) continue;
        const start  = new Date(c.startTime);
        const end    = new Date(c.endTime);
        const status = computeStatus(start, end);
        if (status === 'ended') continue;

        const platformLabel = c.platform || apiKey;
        const logo = PLATFORM_LOGOS[platformKey]
          || PLATFORM_LOGOS[platformLabel.toLowerCase()]
          || '';

        results.push({
          externalId:      externalIdFromUrl(c.url),
          platform:        platformKey,
          platformLabel,
          platformLogo:    logo,
          title:           c.title,
          url:             c.url,
          description:     platformLabel + ' contest. Duration: ' + Math.round((c.duration || 0) / 3600) + 'h.',
          startTime:       start,
          endTime:         end,
          durationSeconds: c.duration || 0,
          status,
          type:            typeFor(platformKey, c.title),
          tags:            tagsFor(platformKey, c.title),
          difficulty:      difficultyFor(c.title),
          isFree:          true,
          isOnline:        true,
          mode:            'Online',
        });
      }
    }

    console.log('[contests] Contest Hive: ' + results.length + ' active contests fetched');
    return results;
  } catch (e) {
    console.warn('[contests] Contest Hive fetch failed:', e.message);
    return [];
  }
}

async function fetchCodeforces() {
  try {
    const { data } = await axios.get('https://codeforces.com/api/contest.list?gym=false', { timeout: 10000 });
    if (data.status !== 'OK') return [];
    const now = Date.now() / 1000;
    return data.result
      .filter(c => {
        const end = c.startTimeSeconds + c.durationSeconds;
        return (end * 1000 > Date.now()) && (c.startTimeSeconds > now - 3 * 86400);
      })
      .slice(0, 30)
      .map(c => {
        const start = new Date(c.startTimeSeconds * 1000);
        const end   = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
        return {
          externalId:      'codeforces.com/contest/' + c.id,
          platform:        'codeforces',
          platformLabel:   'Codeforces',
          platformLogo:    PLATFORM_LOGOS.codeforces,
          title:           c.name,
          url:             'https://codeforces.com/contest/' + c.id,
          description:     c.type + ' contest on Codeforces. Duration: ' + Math.round(c.durationSeconds / 3600) + 'h.',
          startTime:       start,
          endTime:         end,
          durationSeconds: c.durationSeconds,
          status:          (c.phase === 'CODING' || c.phase === 'PENDING_SYSTEM_TEST')
            ? 'live' : computeStatus(start, end),
          type:            'contest',
          tags:            tagsFor('codeforces', c.name),
          difficulty:      difficultyFor(c.name),
          isFree:          true,
          isOnline:        true,
          mode:            'Online',
        };
      });
  } catch (e) {
    console.warn('[contests] Codeforces direct fetch failed:', e.message);
    return [];
  }
}

async function fetchLeetCode() {
  try {
    const { data } = await axios.post(
      'https://leetcode.com/graphql',
      { query: '{ allContests { title titleSlug startTime duration } }' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    const contests = data?.data?.allContests || [];
    const now = Date.now() / 1000;
    return contests
      .filter(c => (c.startTime + c.duration) > now)
      .slice(0, 10)
      .map(c => {
        const start = new Date(c.startTime * 1000);
        const end   = new Date((c.startTime + c.duration) * 1000);
        return {
          externalId:      'leetcode.com/contest/' + c.titleSlug,
          platform:        'leetcode',
          platformLabel:   'LeetCode',
          platformLogo:    PLATFORM_LOGOS.leetcode,
          title:           c.title,
          url:             'https://leetcode.com/contest/' + c.titleSlug + '/',
          description:     'Weekly/Biweekly LeetCode contest.',
          startTime:       start,
          endTime:         end,
          durationSeconds: c.duration,
          status:          computeStatus(start, end),
          type:            'contest',
          tags:            ['DSA', 'Algorithms', 'LeetCode'],
          difficulty:      'intermediate',
          isFree:          true,
          isOnline:        true,
          mode:            'Online',
        };
      });
  } catch (e) {
    console.warn('[contests] LeetCode direct fetch failed:', e.message);
    return [];
  }
}

function getFallbackContests() {
  const now = new Date();
  const add = (h) => new Date(now.getTime() + h * 3600000);
  return [
    {
      externalId: 'fallback-codeforces-round', platform: 'codeforces',
      platformLabel: 'Codeforces', platformLogo: PLATFORM_LOGOS.codeforces,
      title: 'Codeforces Round (Div. 2)', url: 'https://codeforces.com/contests',
      description: 'Regular Codeforces Div. 2 round.',
      startTime: add(48), endTime: add(51), durationSeconds: 10800,
      status: 'upcoming', type: 'contest', tags: ['DSA', 'Algorithms', 'Competitive'],
      difficulty: 'intermediate', isFree: true, isOnline: true, mode: 'Online',
    },
    {
      externalId: 'fallback-leetcode-weekly', platform: 'leetcode',
      platformLabel: 'LeetCode', platformLogo: PLATFORM_LOGOS.leetcode,
      title: 'LeetCode Weekly Contest', url: 'https://leetcode.com/contest/',
      description: 'Weekly LeetCode contest. 4 problems, 90 minutes.',
      startTime: add(72), endTime: add(73.5), durationSeconds: 5400,
      status: 'upcoming', type: 'contest', tags: ['DSA', 'Algorithms', 'LeetCode'],
      difficulty: 'intermediate', isFree: true, isOnline: true, mode: 'Online',
    },
    {
      externalId: 'fallback-atcoder-abc', platform: 'atcoder',
      platformLabel: 'AtCoder', platformLogo: PLATFORM_LOGOS.atcoder,
      title: 'AtCoder Beginner Contest', url: 'https://atcoder.jp/contests/',
      description: 'Weekly beginner-friendly competitive programming.',
      startTime: add(96), endTime: add(97.67), durationSeconds: 6000,
      status: 'upcoming', type: 'contest', tags: ['DSA', 'Beginner', 'Competitive'],
      difficulty: 'beginner', isFree: true, isOnline: true, mode: 'Online',
    },
    {
      externalId: 'fallback-codechef-starters', platform: 'codechef',
      platformLabel: 'CodeChef', platformLogo: PLATFORM_LOGOS.codechef,
      title: 'CodeChef Starters', url: 'https://www.codechef.com/contests',
      description: 'Weekly CodeChef Starters contest.',
      startTime: add(60), endTime: add(62), durationSeconds: 7200,
      status: 'upcoming', type: 'contest', tags: ['DSA', 'Algorithms', 'Competitive'],
      difficulty: 'intermediate', isFree: true, isOnline: true, mode: 'Online',
    },
  ];
}

export async function fetchAndStoreContests() {
  console.log('[contests] Fetching contests...');
  const [hiveContests, cfContests, lcContests] = await Promise.all([
    fetchContestHive(),
    fetchCodeforces(),
    fetchLeetCode(),
  ]);

  const seen = new Set();
  const allContests = [];
  for (const c of [...hiveContests, ...cfContests, ...lcContests]) {
    const key = c.platform + '::' + c.externalId;
    if (!seen.has(key)) {
      seen.add(key);
      allContests.push(c);
    }
  }

  if (allContests.length === 0) {
    console.warn('[contests] All APIs failed - using fallback contests');
    allContests.push(...getFallbackContests());
  }

  let upserted = 0, skipped = 0;
  for (const contest of allContests) {
    try {
      await Contest.updateOne(
        { externalId: contest.externalId, platform: contest.platform },
        { $set: contest },
        { upsert: true },
      );
      upserted++;
    } catch (_) {
      skipped++;
    }
  }

  const now = new Date();
  await Promise.all([
    Contest.updateMany(
      { endTime: { $lt: now }, status: { $ne: 'ended' } },
      { $set: { status: 'ended' } },
    ),
    Contest.updateMany(
      { startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: 'live' } },
      { $set: { status: 'live' } },
    ),
    Contest.updateMany(
      { startTime: { $gt: now }, status: { $ne: 'upcoming' } },
      { $set: { status: 'upcoming' } },
    ),
  ]);

  console.log('[contests] Done - ' + upserted + ' upserted, ' + skipped + ' skipped');
  return { upserted, skipped, total: allContests.length };
}