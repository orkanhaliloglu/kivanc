import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'Function secrets are not configured' }, 500);
  const authorization = req.headers.get('Authorization');
  if (!authorization) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);
  const { data: isAdmin, error: profileError } = await userClient.rpc('is_ritim_admin');
  if (profileError) return json({ error: `Admin role check failed: ${profileError.message}` }, 500);
  if (isAdmin !== true) return json({ error: 'Admin access required' }, 403);
  const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let input: { email?: string; password?: string; full_name?: string };
  try { input = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const email = input.email?.trim().toLowerCase();
  const fullName = input.full_name?.trim();
  const password = input.password;
  if (!email || !fullName || !password || password.length < 8) {
    return json({ error: 'Name, email, and a password of at least 8 characters are required' }, 400);
  }
  const { data, error } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  });
  if (error) return json({ error: error.message }, 400);
  return json({ id: data.user.id, email: data.user.email, full_name: fullName });
});
