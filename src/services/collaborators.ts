import { supabase } from '../lib/supabase';
import type { JoinCode, ProjectCollaborator } from '../types';

export const getCollaborators = async (projectId: string): Promise<ProjectCollaborator[]> => {
  const { data, error } = await supabase
    .from('project_collaborators')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((collaborator: any) => ({
    id: collaborator.id,
    projectId: collaborator.project_id,
    userEmail: collaborator.user_email,
    role: collaborator.role,
    accessibleLedgerIds: collaborator.accessible_ledger_ids || [],
    createdAt: new Date(collaborator.created_at).getTime(),
  }));
};

export const inviteCollaborator = async (
  projectId: string,
  email: string,
  role: 'admin' | 'editor' | 'viewer',
  ledgerIds: string[]
): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('project_collaborators').insert([
    {
      project_id: projectId,
      user_email: email,
      role,
      accessible_ledger_ids: ledgerIds,
    },
  ]);

  return { error: error?.message || null };
};

export const removeCollaborator = async (id: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('project_collaborators').delete().eq('id', id);
  return { error: error?.message || null };
};

export const updateCollaborator = async (
  id: string,
  role: 'admin' | 'editor' | 'viewer',
  ledgerIds: string[]
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('project_collaborators')
    .update({
      role,
      accessible_ledger_ids: ledgerIds,
    })
    .eq('id', id);

  return { error: error?.message || null };
};

export const getJoinCodes = async (projectId: string): Promise<JoinCode[]> => {
  const { data, error } = await supabase
    .from('join_codes')
    .select('*')
    .eq('project_id', projectId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((code: any) => ({
    id: code.id,
    code: code.code,
    projectId: code.project_id,
    role: code.role,
    accessibleLedgerIds: code.accessible_ledger_ids || [],
    createdAt: new Date(code.created_at).getTime(),
    expiresAt: new Date(code.expires_at).getTime(),
  }));
};

export const generateJoinCode = async (
  projectId: string,
  role: 'admin' | 'editor' | 'viewer',
  ledgerIds: string[]
): Promise<{ code: string | null; error: string | null }> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from('join_codes').insert([
    {
      project_id: projectId,
      code,
      role,
      accessible_ledger_ids: ledgerIds,
    },
  ]);

  return { code: error ? null : code, error: error?.message || null };
};

export const deleteJoinCode = async (id: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('join_codes').delete().eq('id', id);
  return { error: error?.message || null };
};

export const useJoinCode = async (code: string): Promise<{ error: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'User not logged in' };

  const { data: joinRecord, error: fetchError } = await supabase
    .from('join_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .gt('expires_at', new Date().toISOString())
    .single();

  if (fetchError || !joinRecord) return { error: 'Invalid or expired code' };

  const { error: collabError } = await supabase.from('project_collaborators').insert([
    {
      project_id: joinRecord.project_id,
      user_email: user.email,
      role: joinRecord.role,
      accessible_ledger_ids: joinRecord.accessible_ledger_ids,
      join_code_id: joinRecord.id,
    },
  ]);

  if (collabError) {
    if (collabError.code === '23505') return { error: 'You already have access to this business' };
    return { error: collabError.message };
  }

  return { error: null };
};
