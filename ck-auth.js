// ck-auth.js — ChartKids auth + data layer (Supabase)
const _sb = supabase.createClient(
  'https://zxusjnlphxiugjkusybd.supabase.co',
  'sb_publishable_lakdqaF7FZ0bIEZDdkSipA_zAwvWbDw'
);

async function ckGetUser() {
  const { data: { user } } = await _sb.auth.getUser();
  return user;
}

async function ckSignIn() {
  await _sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href }
  });
}

async function ckSignOut() {
  await _sb.auth.signOut();
  location.reload();
}

async function ckGetData() {
  const user = await ckGetUser();
  if (user) {
    const { data } = await _sb.from('rewards').select('*').eq('user_id', user.id).maybeSingle();
    if (data) return { completed: data.completed || [], xp: data.xp || 0, badges: data.badges || [], cats: data.cats || {} };
    return { completed: [], xp: 0, badges: [], cats: {} };
  }
  return JSON.parse(localStorage.getItem('ck_rewards') || '{"completed":[],"xp":0,"badges":[],"cats":{}}');
}

async function ckSaveData(d) {
  const user = await ckGetUser();
  if (user) {
    await _sb.from('rewards').upsert({
      user_id: user.id,
      completed: d.completed,
      xp: d.xp,
      badges: d.badges,
      cats: d.cats,
      updated_at: new Date().toISOString()
    });
  } else {
    localStorage.setItem('ck_rewards', JSON.stringify(d));
  }
}

async function ckMigrate(user) {
  const raw = localStorage.getItem('ck_rewards');
  if (!raw) return;
  const local = JSON.parse(raw);
  if (!local.xp && !local.completed?.length) return;
  const { data } = await _sb.from('rewards').select('xp').eq('user_id', user.id).maybeSingle();
  if (!data || data.xp === 0) {
    await _sb.from('rewards').upsert({
      user_id: user.id,
      completed: local.completed || [],
      xp: local.xp || 0,
      badges: local.badges || [],
      cats: local.cats || {},
      updated_at: new Date().toISOString()
    });
    localStorage.removeItem('ck_rewards');
  }
}

// Pages override this to react to auth state changes
function ckOnAuthChange(event, session) {}

_sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await ckMigrate(session.user);
  }
  ckOnAuthChange(event, session);
});
