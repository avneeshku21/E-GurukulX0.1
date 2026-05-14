// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – YouTube Data API v3 Service  (Enhanced with Educational Filter)
// server/services/youtube.service.js
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { hashCacheKey } from '../utils/hash.js';

const CACHE_TTL_MS  = 12 * 60 * 60 * 1000;

// ── In-memory cache (replaces DB cache — sufficient for a single-process server) ──
const _memCache = new Map();
function cacheGet(key) {
  const entry = _memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _memCache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  _memCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
// Evict expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _memCache) { if (now > v.expiresAt) _memCache.delete(k); }
}, 60 * 60 * 1000);
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

const BLOCKED_KEYWORDS = [
  'prank','funny','meme','vlog','reaction','challenge','shorts','tiktok',
  'gaming','gameplay','music video','song','lyrics','entertainment','roast',
  'drama','gossip','celebrity','trailer','movie clip','comedy',
];

const EDUCATIONAL_KEYWORDS = [
  'tutorial','course','learn','education','lesson','guide','how to',
  'explained','introduction','beginner','advanced','masterclass','bootcamp',
  'training','lecture','crash course','full course','complete guide','workshop',
  'programming','coding','development','computer science','data structure',
  'algorithm','web dev','machine learning','artificial intelligence',
  'cybersecurity','cloud','devops','javascript','python','java','react',
    'node','sql','html','css','typescript','interview','prep','tips','nielit','o level','gate','cs50','khan academy','freecodecamp','traversy media','the net ninja','a level','CCC Nielit',
];

const TRUSTED_CHANNELS = [
  'freecodecamp','traversy media','the net ninja','fireship','academind',
  'programming with mosh','cs50','mit opencourseware','khan academy',
  'tech with tim','corey schafer','sentdex','techworld with nana',
  'networkchuck','professor messer','google developers','microsoft developer',
  'aws','codecademy','udemy tech','clever programmer','kevin powell',
  'web dev simplified','coding train','derek banas','thenewboston',
  'caleb curry','javascript mastery','code with harry','apna college',
  "jenny's lectures",'abdul bari','gate smashers','love babbar','striver',
  'neetcode','back to back swe','chai aur code','take u forward','codebasics','codekarle','codechef','codeforces','NIELIT India',
];

export function parseISO8601Duration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1]??'0',10)*3600)+(parseInt(match[2]??'0',10)*60)+parseInt(match[3]??'0',10);
}

export function formatDurationSeconds(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function isEducationalVideo(v) {
  const t=v.title.toLowerCase(), d=(v.description||'').toLowerCase(), c=v.channelTitle.toLowerCase();
  if (TRUSTED_CHANNELS.some(x=>c.includes(x))) return true;
  if (BLOCKED_KEYWORDS.some(x=>t.includes(x))) return false;
  if (!EDUCATIONAL_KEYWORDS.some(x=>t.includes(x)||d.includes(x))) return false;
  if (v.durationSeconds<180||v.durationSeconds>28800) return false;
  if (v.viewCount<1000) return false;
  return true;
}

function mapVideoItem(item) {
  const sn=item.snippet??{}, st=item.statistics??{}, cd=item.contentDetails??{};
  const dur=parseISO8601Duration(cd.duration);
  return {
    youtubeVideoId: item.id,
    title: sn.title??'',
    description: (sn.description??'').slice(0,500),
    thumbnailUrl: sn.thumbnails?.maxres?.url??sn.thumbnails?.high?.url??sn.thumbnails?.medium?.url??'',
    channelTitle: sn.channelTitle??'',
    channelId: sn.channelId??'',
    publishedAt: sn.publishedAt??null,
    durationSeconds: dur,
    durationFormatted: formatDurationSeconds(dur),
    viewCount: parseInt(st.viewCount??'0',10),
    likeCount: parseInt(st.likeCount??'0',10),
    commentCount: parseInt(st.commentCount??'0',10),
    isTrustedChannel: TRUSTED_CHANNELS.some(c=>(sn.channelTitle??'').toLowerCase().includes(c)),
  };
}

async function fetchDetailsBatch(videoIds, apiKey) {
  if (!videoIds||!videoIds.length) return [];
  const { data } = await axios.get(YT_VIDEOS_URL,{params:{part:'statistics,contentDetails,snippet',id:videoIds.join(','),key:apiKey}});
  return data.items??[];
}

export async function searchEducationalVideos(query, options={}) {
  const { sortBy='relevance', duration='any', pageToken=null } = options;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) { console.warn('[youtube] YOUTUBE_API_KEY not set'); return {videos:[],nextPageToken:null,totalResults:0}; }
  const enhancedQuery = `${query} tutorial course learn`;
  const cacheKey = hashCacheKey(enhancedQuery+JSON.stringify({sortBy,duration,pageToken}));
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const params = {part:'snippet',q:enhancedQuery,type:'video',maxResults:50,order:sortBy,relevanceLanguage:'en',key:apiKey};
  if (duration&&duration!=='any') params.videoDuration=duration;
  if (pageToken) params.pageToken=pageToken;
  const sr = await axios.get(YT_SEARCH_URL,{params});
  const items=sr.data.items??[], nextPage=sr.data.nextPageToken??null, totalRes=sr.data.pageInfo?.totalResults??0;
  if (!items.length) return {videos:[],nextPageToken:null,totalResults:0};
  const videoIds=items.map(i=>i.id?.videoId).filter(Boolean);
  const dItems=await fetchDetailsBatch(videoIds,apiKey);
  const finalVideos=dItems.map(mapVideoItem).filter(isEducationalVideo).slice(0,20);
  const result={videos:finalVideos,nextPageToken:nextPage,totalResults:totalRes};
  const expiresAt=new Date(Date.now()+CACHE_TTL_MS);
  cacheSet(cacheKey, result);
  return result;
}

export async function getTopViewedEducationalVideos(categoryQuery) {
  return searchEducationalVideos(categoryQuery, { sortBy:'viewCount' });
}

export async function getLatestEducationalVideos(categoryQuery) {
  return searchEducationalVideos(categoryQuery, { sortBy:'date' });
}

export async function getVideoById(videoId) {
  const apiKey=process.env.YOUTUBE_API_KEY;
  const cacheKey=hashCacheKey(`single::${videoId}`);
  const cached=cacheGet(cacheKey);
  if (cached) return cached;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');
  const {data}=await axios.get(YT_VIDEOS_URL,{params:{part:'snippet,statistics,contentDetails',id:videoId,key:apiKey}});
  const item=data.items?.[0];
  if (!item) return null;
  const result=mapVideoItem(item);
  cacheSet(cacheKey, result);
  return result;
}

export async function searchVideos(query, categoryId='', options={}) {
  const { maxResults=20, order='viewCount', relevanceLanguage='en' } = options;
  const apiKey=process.env.YOUTUBE_API_KEY;
  const cacheKey=hashCacheKey(`legacy::${query}::${categoryId}::${JSON.stringify({maxResults,order,relevanceLanguage})}`);
  const cached=cacheGet(cacheKey);
  if (cached) return cached;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');
  const sr=await axios.get(YT_SEARCH_URL,{params:{part:'snippet',q:query,type:'video',maxResults,order,relevanceLanguage,key:apiKey}});
  const searchItems=sr.data.items??[];
  if (!searchItems.length) return [];
  const videoIds=searchItems.map(i=>i.id?.videoId).filter(Boolean);
  const dItems=await fetchDetailsBatch(videoIds,apiKey);
  const dMap={};
  for (const d of dItems) dMap[d.id]=d;
  const results=searchItems.map(si=>{
    const vid=si.id?.videoId??si.id, det=dMap[vid]??{}, sn=si.snippet??{}, st=det.statistics??{}, cd=det.contentDetails??{};
    return {youtubeVideoId:vid,title:sn.title??'',description:sn.description??'',thumbnailUrl:sn.thumbnails?.high?.url??sn.thumbnails?.medium?.url??'',channelTitle:sn.channelTitle??'',publishedAt:sn.publishedAt??null,durationSeconds:parseISO8601Duration(cd.duration),viewCount:parseInt(st.viewCount??'0',10),likeCount:parseInt(st.likeCount??'0',10),commentCount:parseInt(st.commentCount??'0',10),definition:cd.definition??'sd'};
  });
  cacheSet(cacheKey, results);
  return results;
}

export async function purgeCacheExpired() {
  _memCache.clear();
  return 0;
}
