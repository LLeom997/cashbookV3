import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  USER: 'cashflow_user',
};

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  return {
    id: data.user.id,
    email: data.user.email,
  };
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const updateUserProfile = async (_userId: string, updates: { name?: string }) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { name: updates.name },
  });
  return { data, error };
};
