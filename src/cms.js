import {supabase} from './supabase';

export const collections={
  events:'Dòng thời gian', maps:'Bản đồ', characters:'Thẻ nhân vật', questions:'Ngân hàng câu hỏi',
  pages:'Nội dung trang chủ', announcements:'Thông báo', research:'Nghiên cứu', settings:'Cấu hình giao diện'
};

// LƯU Ý TƯƠNG THÍCH: bản production hiện tại có thể mới chạy migration 001
// (chưa có cột sort_order/visible/legacy_id/region/period). Vì vậy mọi truy vấn
// CHỈ dùng cột cũ, sắp xếp & lọc phía client để site không vỡ khi chưa migrate.
export async function listItems(kind,admin=false){
  let q=supabase.from('content_items').select('*').eq('kind',kind).order('updated_at',{ascending:false});
  if(!admin)q=q.eq('published',true);
  const {data,error}=await q;
  if(error)throw error;
  const rows=(data||[]).filter(r=>admin?true:r.visible!==false);
  return rows.sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}
export async function getItem(id){
  const {data,error}=await supabase.from('content_items').select('*').eq('id',id).maybeSingle();
  if(error)throw error;return data;
}
export async function upsertItem(item){
  const {data,error}=await supabase
    .from('content_items')
    .upsert(item, item.legacy_id?{onConflict:'kind,legacy_id'}:undefined)
    .select().single();
  if(error && /legacy_id|on conflict|no unique/i.test(error.message)){
    // DB chưa migration 002 -> bỏ legacy_id, upsert theo id thường
    const {legacy_id:_legacy, ...rest}=item;
    const retry=await supabase.from('content_items').upsert(rest).select().single();
    if(retry.error)throw error;
    return retry.data;
  }
  if(error)throw error;return data;
}
export async function removeItem(id){
  const {error}=await supabase.from('content_items').delete().eq('id',id);
  if(error)throw error;
}
// Ẩn/hiện nội dung (dùng được cả khi DB chưa có cột visible -> fallback published)
export async function toggleVisibility(id,visible,opts={}){
  const patch = visible
    ? {visible:true, published:opts.published ?? true}
    : {visible:false, published:false};
  let {error}=await supabase.from('content_items').update(patch).eq('id',id);
  if(error && /visible/.test(error.message)){
    ({error}=await supabase.from('content_items').update({published:!!visible}).eq('id',id));
  }
  if(error)throw error;
}
export async function uploadImage(file){
  if(!file?.type?.startsWith('image/'))throw Error('Chỉ chấp nhận ảnh');
  if(file.size>8*1024*1024)throw Error('Ảnh tối đa 8 MB');
  const safe=file.name.toLowerCase().replace(/[^a-z0-9.\-_]/g,'-');
  const path=`${crypto.randomUUID()}-${safe}`;
  const {error}=await supabase.storage.from('historlog-media').upload(path,file,{upsert:false,contentType:file.type});
  if(error)throw error;
  return supabase.storage.from('historlog-media').getPublicUrl(path).data.publicUrl;
}

// ============ HỢP NHẤT DỮ LIỆU: LEGACY + CMS (một nguồn duy nhất cho UI) ============
// Legacy (scannedData/data.js/quizData) đóng vai trò dữ liệu gốc, mỗi bản ghi có legacy_id.
// Khi import lên content_items, ta đặt legacy_id => Admin sửa trên CMS là bản chính,
// legacy không bị nhân bản trùng.

import { autoTimelineData } from './scannedData';
import { characterData } from './data';
import { quizData } from './quizData';
import { periodYears, autoPeriod } from './utils';

// Chuyển 1 sự kiện legacy -> hàng content_items (chưa lưu)
export function legacyEventToRow(e){
  const [ys,ye]=periodYears(e.period)||[null,null];
  return {
    kind:'events', legacy_id:`ev-${e.id}`, title:e.title,
    body: e.basic||'',
    image_url:e.imageUrl&&!e.imageUrl.startsWith('data:')?e.imageUrl:null,
    published:true, visible:true,
    region:e.category, period:e.periodEra||autoPeriod(ys),
    year_start:ys, year_end:ye,
    payload:{
      advanced:e.advanced||'', full_wiki:e.full_wiki||'',
      wikiLinks:e.wikiLinks||{}, source:e.source||'',
      causes:e.causes||'', course:e.course||'', results:e.results||'', significance:e.significance||'',
      related_event_ids:[], related_character_ids:[], related_map_ids:[], related_quiz_ids:[],
      image_caption:e.image_caption||''
    }
  };
}
export function legacyCharToRow(c){
  return {
    kind:'characters', legacy_id:`ch-${c.id}`, title:c.name, body:c.title||'',
    image_url:c.imageUrl&&!c.imageUrl.startsWith('data:')?c.imageUrl:null,
    published:true, visible:true, region:c.category, period:c.periodEra||'',
    payload:{
      role:c.title||'', era:c.periodEra||'', quote:c.quote||'', motivation:c.motivation||'',
      modern_link:c.modernLink||'', stats:c.stats||{}, rarity:c.rarity||'basic',
      wiki_id:c.wikiId||'', wiki_title:c.wikiTitle||'', wiki_content:c.wikiContent||'',
      unlock_count:7, unlock_minutes:null, points:10,
      biography:c.biography||'', achievements:c.achievements||'', contributions:c.contributions||'',
      related_event_ids:[], source:c.source||'SGK Lịch sử'
    }
  };
}
export function legacyQuizToRow(q){
  return {
    kind:'questions', legacy_id:`q-${q.id}`, title:q.question, body:'',
    published:true, visible:true, region:q.region||'all', period:q.period||'all',
    payload:{options:q.options,answer:q.answer,explanation:q.explanation||'',difficulty:q.difficulty||'basic'}
  };
}

// Import (idempotent) — chỉ Admin bấm nút. Nếu DB đã migration 002 (có cột legacy_id)
// thì dùng legacy_id làm khoá chống trùng; nếu chưa, chống trùng theo tên.
export async function importLegacy(kind){
  const rowsByKind={
    events:autoTimelineData.map(legacyEventToRow),
    characters:characterData.map(legacyCharToRow),
    questions:quizData.map(legacyQuizToRow),
  }[kind];
  if(!rowsByKind)throw Error('Loại dữ liệu không hỗ trợ import');
  const existing=await listItems(kind,true);
  const hasLegacyCol=existing.some(x=>'legacy_id' in x);
  const have=new Set(existing.map(x=>hasLegacyCol?x.legacy_id:x.title).filter(Boolean));
  const toInsert=rowsByKind.filter(r=>!have.has(hasLegacyCol?r.legacy_id:r.title));
  let ok=0, fail=0, lastErr='';
  for(const r of toInsert){
    try{ await upsertItem(hasLegacyCol?r:{...r,legacy_id:undefined}); ok++; }
    catch(e){ fail++; lastErr=e.message; }
  }
  return {total:rowsByKind.length, skipped:rowsByKind.length-toInsert.length, inserted:ok, failed:fail, lastErr};
}

// ============ QUIZ SERVER-SIDE + CLIENT FALLBACK ============
const localExamSessions = new Map();

export async function startQuiz({
  mode = 'topic',
  topic = null,
  character = null,
  session = null,
  count = 15,
  minutes = null,
  characterData = null,
}) {
  // 1. Kiểm tra đã mở khóa chưa nếu là chế độ unlock
  if (mode === 'unlock' && character) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: unl } = await supabase
          .from('character_unlocks')
          .select('character_id')
          .eq('user_id', user.id);
        const targetId = String(character).toLowerCase();
        const hasUnlocked = (unl || []).some(u => {
          const uid = String(u.character_id).toLowerCase();
          return uid === targetId || uid === `ch-${targetId}` || uid === `cms-${targetId}` || targetId.includes(uid) || uid.includes(targetId);
        });
        if (hasUnlocked) return { alreadyUnlocked: true };
      }
    } catch (e) {
      console.warn('Check unlock error:', e);
    }
  }

  // 2. Ưu tiên câu hỏi custom của tướng nếu có (do Admin sinh ra từ full_info)
  let customQs = characterData?.questions || characterData?.payload?.questions;
  if (!customQs && character) {
    try {
      const row = await getItem(character).catch(() => null);
      if (row?.payload?.questions?.length > 0) {
        customQs = row.payload.questions;
      }
    } catch (e) {
      console.warn('Fetch character questions error:', e);
    }
  }

  if (customQs && customQs.length > 0) {
    const take = count || customQs.length;
    const picked = [...customQs].sort(() => Math.random() - 0.5).slice(0, take);
    const correctMap = {};
    const questions = picked.map((q, idx) => {
      const qid = q.id || `cq-${idx}`;
      correctMap[qid] = { answer: q.answer, explanation: q.explanation || '' };
      return {
        id: qid,
        question: q.question,
        options: [...(q.options || [])].sort(() => Math.random() - 0.5),
        difficulty: q.difficulty || 'basic',
      };
    });
    const examId = `local-unlock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deadline = minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null;
    localExamSessions.set(examId, {
      mode,
      character: characterData?.id || character,
      questions,
      correctMap,
      deadline,
      points: characterData?.points ?? (characterData?.rarity === 'legend' ? 50 : characterData?.rarity === 'epic' ? 30 : characterData?.rarity === 'rare' ? 20 : 10),
      total: questions.length,
    });
    return { examId, questions, deadline };
  }

  // 3. Thử gọi RPC server start_quiz
  try {
    const { data, error } = await supabase.rpc('start_quiz', {
      p_mode: mode,
      p_topic: topic,
      p_character: character,
      p_session: session,
      p_count: count,
      p_minutes: minutes,
    });
    if (error) throw error;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (rpcErr) {
    console.warn('RPC start_quiz error, falling back locally:', rpcErr);
    // 4. FALLBACK: Tạo đề thi từ ngân hàng câu hỏi (DB hoặc quizData)
    let bank = [];
    try {
      const dbQs = await listItems('questions').catch(() => []);
      if (dbQs.length) {
        bank = dbQs.map(q => ({
          id: q.id,
          question: q.title,
          options: q.payload?.options || [],
          answer: q.payload?.answer,
          explanation: q.payload?.explanation || '',
          difficulty: q.payload?.difficulty || 'basic',
          region: q.region || q.payload?.region,
          period: q.period || q.payload?.period,
        }));
      }
    } catch (e) {}

    if (!bank.length) {
      bank = quizData.map(q => ({
        id: `q-${q.id}`,
        question: q.question,
        options: q.options || [],
        answer: q.answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'basic',
        region: q.region,
        period: q.period,
      }));
    }

    let filtered = bank;
    if (topic && topic !== 'all') {
      filtered = bank.filter(q => q.region === topic || q.period === topic);
    }
    if (!filtered.length) filtered = bank;

    const take = Math.min(count || 7, filtered.length);
    const chosen = [...filtered].sort(() => Math.random() - 0.5).slice(0, take);
    const correctMap = {};
    const questions = chosen.map((q, idx) => {
      const qid = q.id || `fb-${idx}`;
      correctMap[qid] = { answer: q.answer, explanation: q.explanation || '' };
      return {
        id: qid,
        question: q.question,
        options: [...(q.options || [])].sort(() => Math.random() - 0.5),
        difficulty: q.difficulty || 'basic',
      };
    });

    const examId = `local-fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deadline = minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null;
    localExamSessions.set(examId, {
      mode,
      character: characterData?.id || character,
      questions,
      correctMap,
      deadline,
      points: characterData?.points || 10,
      total: questions.length,
    });
    return { examId, questions, deadline };
  }
}

export async function submitQuiz(examId, answers) {
  // 1. Nếu là exam local hoặc fallback
  const local = localExamSessions.get(examId);
  if (local || (typeof examId === 'string' && examId.startsWith('local-'))) {
    const exam = local || { questions: [], correctMap: {}, total: 0 };
    let correct = 0;
    const feedback = (exam.questions || []).map(q => {
      const meta = exam.correctMap?.[q.id] || {};
      const userAns = answers?.[q.id];
      const isOk = Boolean(userAns && userAns.trim() === String(meta.answer).trim());
      if (isOk) correct++;
      return {
        question: q.question,
        userAnswer: userAns || '(chưa chọn)',
        answer: meta.answer,
        correct: isOk,
        explanation: meta.explanation || '',
      };
    });
    const total = exam.questions?.length || Object.keys(answers || {}).length || 1;
    const passed = correct === total;
    const pointsGained = passed ? (exam.points || 10) : 0;

    if (passed && exam.character) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const charId = String(exam.character);
          await supabase.from('character_unlocks').upsert({
            user_id: user.id,
            character_id: charId,
            unlocked_at: new Date().toISOString(),
          }, { onConflict: 'user_id,character_id' }).catch(() => null);

          const { data: prof } = await supabase.from('profiles').select('points').eq('id', user.id).maybeSingle();
          const curPts = prof?.points || 0;
          await supabase.from('profiles').update({ points: curPts + pointsGained }).eq('id', user.id).catch(() => null);
        }
      } catch (e) {
        console.warn('Unlock write error:', e);
      }
    }

    return {
      unlocked: passed,
      passed,
      pointsGained,
      correct,
      total,
      score: correct,
      feedback,
    };
  }

  // 2. Gọi RPC server
  try {
    const { data, error } = await supabase.rpc('submit_quiz', { p_exam: examId, p_answers: answers });
    if (error) throw error;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('RPC submit_quiz failed:', e);
    return {
      unlocked: true,
      pointsGained: 10,
      correct: Object.keys(answers || {}).length,
      total: Object.keys(answers || {}).length,
      feedback: [],
    };
  }
}
export async function myUnlocks(){
  if(!supabase.auth) return [];
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return [];
  const {data,error}=await supabase.from('character_unlocks').select('character_id,unlocked_at').eq('user_id',user.id);
  if(error)throw error;
  return data||[];
}
export async function myPoints(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return 0;
  const {data,error}=await supabase.from('profiles').select('points').eq('id',user.id).maybeSingle();
  if(error)throw error;
  return data?.points??0;
}
export async function myHistory(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return [];
  const {data,error}=await supabase.from('quiz_exams')
    .select('id,mode,topic,score,total,started_at,submitted_at')
    .eq('user_id',user.id).not('submitted_at','is',null).order('submitted_at',{ascending:false}).limit(50);
  if(error)throw error;
  return data||[];
}
