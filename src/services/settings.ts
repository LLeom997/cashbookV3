import { supabase } from '../lib/supabase';
import type {
  AppSettings,
  CustomCategory,
  CustomField,
  CustomPaymentMode,
  CustomSubcategory,
} from '../types';
import type { TransactionType } from '../types';

export const getAppSettings = async (userId: string): Promise<AppSettings> => {
  const { data: categoriesData } = await supabase.from('custom_categories').select('*').eq('user_id', userId);
  const { data: subcategoriesData } = await supabase
    .from('custom_subcategories')
    .select('*')
    .eq('user_id', userId);
  const { data: fieldsData } = await supabase.from('custom_fields').select('*').eq('user_id', userId);
  const { data: paymentModesData } = await supabase
    .from('custom_payment_modes')
    .select('*')
    .eq('user_id', userId);

  const categories: CustomCategory[] = (categoriesData || []).map((category: any) => ({
    id: category.id,
    userId: category.user_id,
    name: category.name,
    type: category.type as any,
  }));

  const subcategories: CustomSubcategory[] = (subcategoriesData || []).map((subcategory: any) => ({
    id: subcategory.id,
    userId: subcategory.user_id,
    categoryId: subcategory.category_id,
    name: subcategory.name,
  }));

  const fields: CustomField[] = (fieldsData || []).map((field: any) => ({
    id: field.id,
    userId: field.user_id,
    name: field.name,
    type: field.field_type as any,
    required: field.is_required,
  }));

  const paymentModes: CustomPaymentMode[] = (paymentModesData || []).map((paymentMode: any) => ({
    id: paymentMode.id,
    userId: paymentMode.user_id,
    name: paymentMode.name,
  }));

  return { categories, subcategories, fields, paymentModes };
};

export const createCustomCategory = async (
  userId: string,
  name: string,
  type: TransactionType | 'BOTH'
): Promise<CustomCategory | null> => {
  const { data, error } = await supabase
    .from('custom_categories')
    .insert([{ user_id: userId, name, type }])
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.type as any,
  };
};

export const deleteCustomCategory = async (id: string) => {
  await supabase.from('custom_categories').delete().eq('id', id);
};

export const updateCustomCategory = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('custom_categories').update({ name }).eq('id', id);
  return { error: error?.message || null };
};

export const createCustomSubcategory = async (
  userId: string,
  categoryId: string,
  name: string
): Promise<CustomSubcategory | null> => {
  const { data, error } = await supabase
    .from('custom_subcategories')
    .insert([{ user_id: userId, category_id: categoryId, name }])
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    categoryId: data.category_id,
    name: data.name,
  };
};

export const updateCustomSubcategory = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('custom_subcategories').update({ name }).eq('id', id);
  return { error: error?.message || null };
};

export const deleteCustomSubcategory = async (id: string) => {
  await supabase.from('custom_subcategories').delete().eq('id', id);
};

export const createCustomField = async (
  userId: string,
  name: string,
  type: 'text' | 'number' | 'date',
  required: boolean
): Promise<CustomField | null> => {
  const { data, error } = await supabase
    .from('custom_fields')
    .insert([{ user_id: userId, name, field_type: type, is_required: required }])
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.field_type as any,
    required: data.is_required,
  };
};

export const deleteCustomField = async (id: string) => {
  await supabase.from('custom_fields').delete().eq('id', id);
};

export const createCustomPaymentMode = async (userId: string, name: string): Promise<CustomPaymentMode | null> => {
  const { data, error } = await supabase
    .from('custom_payment_modes')
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
  };
};

export const updateCustomPaymentMode = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from('custom_payment_modes').update({ name }).eq('id', id);
  return { error: error?.message || null };
};

export const deleteCustomPaymentMode = async (id: string) => {
  await supabase.from('custom_payment_modes').delete().eq('id', id);
};
