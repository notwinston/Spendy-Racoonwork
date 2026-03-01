import * as ImagePicker from 'expo-image-picker';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Transaction, ParsedReceipt, EventCategory } from '../types';

// ---------- Image Capture ----------

/**
 * Launch the camera to capture a receipt photo.
 * Returns the base64-encoded image data.
 */
export async function captureReceipt(): Promise<string> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: true,
    allowsEditing: true,
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}

/**
 * Pick a receipt image from the photo gallery.
 * Returns the base64-encoded image data.
 */
export async function pickReceiptFromGallery(): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}

// ---------- Receipt Parsing ----------

const RECEIPT_PROMPT = `Analyze this receipt image and extract the following as JSON:
{
  "merchant_name": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "currency": "CAD",
  "items": [{"name": "item", "quantity": 1, "price": 0.00}],
  "category": "one of: dining|groceries|transport|entertainment|shopping|travel|health|education|fitness|social|professional|bills|personal|other",
  "payment_method": "card type if visible, else null"
}
Return ONLY valid JSON. If a field is not visible, use null.`;

/**
 * Parse a receipt image using Gemini Vision API.
 */
export async function parseReceiptWithGemini(
  imageBase64: string,
): Promise<ParsedReceipt> {
  const { GeminiAdapter } = await import('./llm/gemini');
  const adapter = new GeminiAdapter();
  const response = await adapter.predictWithImage(
    RECEIPT_PROMPT,
    imageBase64,
    'image/jpeg',
  );

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse receipt from LLM response');

  return JSON.parse(jsonMatch[0]) as ParsedReceipt;
}

/**
 * Mock receipt parser for when no Gemini API key is available.
 * Returns a realistic-looking parsed receipt.
 */
export function parseReceiptMock(): ParsedReceipt {
  const today = new Date().toISOString().split('T')[0];
  return {
    merchant_name: 'Demo Coffee Shop',
    date: today,
    total: 12.50,
    subtotal: 10.87,
    tax: 1.63,
    tip: null,
    currency: 'CAD',
    items: [
      { name: 'Latte', quantity: 1, price: 5.50 },
      { name: 'Croissant', quantity: 1, price: 4.25 },
      { name: 'Orange Juice', quantity: 1, price: 1.12 },
    ],
    category: 'dining' as EventCategory,
    payment_method: 'Visa ending 4242',
  };
}

// ---------- Transaction Creation ----------

/**
 * Create a transaction from a parsed receipt.
 * Persists to Supabase if configured, otherwise returns a local object.
 */
export async function createTransactionFromReceipt(
  userId: string,
  accountId: string,
  receipt: ParsedReceipt,
): Promise<Transaction> {
  const transaction: Omit<Transaction, 'id'> = {
    user_id: userId,
    account_id: accountId,
    plaid_transaction_id: null,
    amount: -Math.abs(receipt.total),
    currency: receipt.currency ?? 'CAD',
    merchant_name: receipt.merchant_name,
    category: receipt.category ?? 'other',
    subcategory: null,
    date: receipt.date,
    pending: false,
    is_recurring: false,
    recurring_group_id: null,
    reviewed: false,
    notes: receipt.items.map((i) => i.name).join(', '),
    source: 'receipt_scan',
    receipt_data: receipt,
    receipt_image_url: null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    if (error) {
      console.warn('Supabase receipt transaction insert error:', error.message);
    }
    if (data) return data as Transaction;
  }

  return { id: `receipt-${Date.now()}`, ...transaction };
}
