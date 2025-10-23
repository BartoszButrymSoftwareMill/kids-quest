import { A as AppError } from './errors_ClCkzvSe.mjs';

async function requireAuth(supabase) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AppError(401, "unauthorized", "Wymagane uwierzytelnienie");
  }
  return user.id;
}
async function getAuthUser(supabase) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AppError(401, "unauthorized", "Wymagane uwierzytelnienie");
  }
  return user;
}

export { getAuthUser as g, requireAuth as r };
