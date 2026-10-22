import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { listItems, myUnlocks } from './cms';
import { autoTimelineData } from './scannedData';
import { characterData } from './data';
import { quizData } from './quizData';
import { periodYears, autoPeriod } from './utils';

// =================== STORE CHIA SẺ TOÀN HỆ THỐNG ===================
// Một nguồn dữ liệu duy nhất cho mọi trang (Timeline/Map/Character/Quiz/Trang chủ).
// Merge CMS content_items + legacy. Link chéo bằng _key ổn định (legacy_id hoặc uuid).

const Ctx = createContext(null);

const evFromLegacy = e => {
  const [ys, ye] = periodYears(e.period) || [null, null];
  return {
    key: `ev-${e.id}`, source: 'legacy', id: e.id, title: e.title,
    region: e.category || 'vietnam', era: e.periodEra || autoPeriod(ys),
    periodText: e.period || '', yearStart: ys, yearEnd: ye,
    basic: e.basic || '', advanced: e.advanced || '', fullWiki: e.full_wiki || '',
    wikiLinks: e.wikiLinks || {}, ref: e.source || 'SGK Lịch sử',
    imageUrl: e.imageUrl && !e.imageUrl.startsWith('data:') ? e.imageUrl : '',
    caption: e.image_caption || '',
    causes: e.causes || '', course: e.course || '', results: e.results || '', significance: e.significance || '',
    relatedEvents: [], relatedCharacters: [], relatedMaps: [], relatedQuizzes: [],
    featured: Boolean(e.featured),
  };
};
const evFromCms = c => {
  const p = c.payload || {};
  const [ys, ye] = p.year_start != null
    ? [p.year_start, p.year_end ?? p.year_start]
    : periodYears(p.periodText || c.title) || [c.year_start || null, c.year_end || null];
  return {
    key: c.legacy_id || `cms-${c.id}`, cmsId: c.id, source: 'cms', id: c.id, title: c.title,
    region: p.region || c.region || 'vietnam', era: p.era || c.period || autoPeriod(ys),
    periodText: p.periodText || c.period || '', yearStart: ys, yearEnd: ye,
    basic: p.basic || c.body || '', advanced: p.advanced || '', fullWiki: p.full_wiki || '',
    wikiLinks: p.wikiLinks || {}, ref: p.source || '', imageUrl: c.image_url || '', caption: p.image_caption || '',
    causes: p.causes || '', course: p.course || '', results: p.results || '', significance: p.significance || '',
    relatedEvents: p.related_event_ids || [], relatedCharacters: p.related_character_ids || [],
    relatedMaps: p.related_map_ids || [], relatedQuizzes: p.related_quiz_ids || [],
    published: c.published, visible: c.visible !== false, sort: c.sort_order ?? 0,
    featured: Boolean(p.featured),
    hidden: Boolean(p.hidden),
  };
};

const chFromLegacy = ch => ({
  key: `ch-${ch.id}`, source: 'legacy', id: ch.id, name: ch.name,
  role: ch.title || '', region: ch.category || 'vietnam', era: ch.periodEra || '',
  quote: ch.quote || '', motivation: ch.motivation || '', modernLink: ch.modernLink || '',
  stats: ch.stats || { int: 50, ldr: 50, vis: 50 }, rarity: ch.rarity || 'basic',
  wikiId: ch.wikiId || '', wikiTitle: ch.wikiTitle || '', wikiContent: ch.wikiContent || '',
  biography: ch.biography || '', achievements: ch.achievements || '', contributions: ch.contributions || '',
  imageUrl: ch.imageUrl && !ch.imageUrl.startsWith('data:') ? ch.imageUrl : '',
  unlockCount: ch.unlock_count || 7, unlockMinutes: ch.unlock_minutes ?? null, points: ch.points || 10,
  relatedEvents: ch.related_event_ids || [], ref: ch.source || 'SGK Lịch sử',
});
const chFromCms = c => {
  const p = c.payload || {};
  return {
    key: c.legacy_id || `cms-${c.id}`, cmsId: c.id, source: 'cms', id: c.id, name: c.title,
    role: p.role || c.body || '', region: p.region || c.region || 'vietnam', era: p.era || c.period || '',
    quote: p.quote || '', motivation: p.motivation || '', modernLink: p.modern_link || '',
    stats: p.stats || { int: 50, ldr: 50, vis: 50 }, rarity: p.rarity || 'basic',
    wikiId: p.wiki_id || '', wikiTitle: p.wiki_title || '', wikiContent: p.wiki_content || '',
    biography: p.biography || c.body || '', achievements: p.achievements || '', contributions: p.contributions || '',
    imageUrl: c.image_url || '',
    unlockCount: p.unlock_count ?? null, unlockMinutes: p.unlock_minutes ?? null, points: p.points ?? null,
    relatedEvents: p.related_event_ids || [], ref: p.source || '',
    published: c.published, visible: c.visible !== false,
  };
};

const qFromLegacy = q => ({
  key: `q-${q.id}`, source: 'legacy', id: q.id, question: q.question,
  options: q.options || [], answer: q.answer, explanation: q.explanation || '',
  region: q.region || 'all', period: q.period || 'all', difficulty: q.difficulty || 'basic',
});
const qFromCms = c => {
  const p = c.payload || {};
  return {
    key: c.legacy_id || `cms-${c.id}`, cmsId: c.id, source: 'cms', id: c.id, question: c.title,
    options: p.options || [], answer: p.answer, explanation: p.explanation || '',
    region: p.region || c.region || 'all', period: p.period || c.period || 'all',
    difficulty: p.difficulty || 'basic', published: c.published,
  };
};

export function DataProvider({ children }) {
  const [events, setEvents] = useState(autoTimelineData.map(evFromLegacy));
  const [characters, setCharacters] = useState(characterData.map(chFromLegacy));
  const [questions, setQuestions] = useState(quizData.map(qFromLegacy));
  const [maps, setMaps] = useState([]);
  const [pages, setPages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [points, setPoints] = useState(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (user) => {
    setLoading(true);
    const results = {};
    const [ev, ch, q, mp, pg, an] = await Promise.all([
      listItems('events').catch(e => (results.events = e.message, [])),
      listItems('characters').catch(e => (results.characters = e.message, [])),
      listItems('questions').catch(e => (results.questions = e.message, [])),
      listItems('maps').catch(e => (results.maps = e.message, [])),
      listItems('pages').catch(e => (results.pages = e.message, [])),
      listItems('announcements').catch(e => (results.announcements = e.message, [])),
    ]);
    const merge = (legacyList, fromLegacy, fromCms, cmsList) => {
      const cmsNorm = cmsList.map(fromCms);
      const byKey = new Map(cmsNorm.filter(r => r.key.startsWith('ev-') || r.key.startsWith('ch-') || r.key.startsWith('q-')).map(r => [r.key, r]));
      const base = legacyList.map(fromLegacy).map(l => byKey.get(l.key) || l);
      const extras = cmsNorm.filter(r => !byKey.has(r.key));
      return [...base, ...extras].filter(r => r.visible !== false && !r.hidden);
    };
    setEvents(merge(autoTimelineData, evFromLegacy, evFromCms, ev));
    setCharacters(merge(characterData, chFromLegacy, chFromCms, ch));
    setQuestions(merge(quizData, qFromLegacy, qFromCms, q));
    setMaps(mp.map(c => ({ key: c.legacy_id || `cms-${c.id}`, cmsId: c.id, title: c.title, body: c.body, imageUrl: c.image_url, ...c.payload, published: c.published })));
    setPages(pg);
    setAnnouncements(an);
    setStatus(results);
    if (user) {
      try {
        const { data } = await supabase.from('profiles').select('points').eq('id', user.id).maybeSingle();
        setPoints(data?.points ?? 0);
      } catch { setPoints(0); }
      try { setUnlocks(await myUnlocks()); } catch { setUnlocks([]); }
    } else { setPoints(null); setUnlocks([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) loadAll(data.session?.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => alive && loadAll(session?.user), 0);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadAll]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadAll(data.session?.user);
  }, [loadAll]);

  const value = {
    events, characters, questions, maps, pages, announcements,
    unlocks, points, status, loading, refresh,
    eventByKey: k => events.find(e => e.key === k),
    charByKey: k => characters.find(c => c.key === k),
    isUnlocked: k => unlocks.some(u => u.character_id === k),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);
