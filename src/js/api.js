// LocalStorage Data Layer & Persistence Manager
import { supabase } from '../lib/supabase.js';
import { escapeHTML } from './utils/sanitize.js';
import { showToast } from './components/toast.js';

export { escapeHTML, escapeHTML as escapeHtml };

// Validation helpers (FIX 8)
function validateNonEmptyString(val, fieldName) {
  if (val === undefined || val === null || typeof val !== 'string' || val.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
}

function validateNonNegativeNumber(val, fieldName) {
  if (val === undefined || val === null || val === '') return;
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    throw new Error(`${fieldName} must be a number greater than or equal to 0`);
  }
}

function validateClientInput(clientData) {
  validateNonEmptyString(clientData.name, 'Client name');
}

function validateInvoiceInput(invoiceData) {
  validateNonEmptyString(invoiceData.clientId, 'Client selection');
  if (invoiceData.taxPercent !== undefined) {
    validateNonNegativeNumber(invoiceData.taxPercent, 'Tax percentage');
  }
  if (invoiceData.discountPercent !== undefined) {
    validateNonNegativeNumber(invoiceData.discountPercent, 'Discount percentage');
  }
  if (Array.isArray(invoiceData.items)) {
    invoiceData.items.forEach((item, idx) => {
      if (item.price !== undefined) validateNonNegativeNumber(item.price, `Item #${idx + 1} price`);
      const qty = item.qty !== undefined ? item.qty : item.quantity;
      if (qty !== undefined) validateNonNegativeNumber(qty, `Item #${idx + 1} quantity`);
    });
  }
}

function validateProposalInput(proposalData) {
  validateNonEmptyString(proposalData.title, 'Proposal title');
  validateNonEmptyString(proposalData.clientId, 'Client selection');
  if (proposalData.budget !== undefined) validateNonNegativeNumber(proposalData.budget, 'Budget');
  if (proposalData.amount !== undefined) validateNonNegativeNumber(proposalData.amount, 'Amount');
  if (Array.isArray(proposalData.items)) {
    proposalData.items.forEach((item, idx) => {
      if (item.price !== undefined) validateNonNegativeNumber(item.price, `Item #${idx + 1} price`);
      const qty = item.qty !== undefined ? item.qty : item.quantity;
      if (qty !== undefined) validateNonNegativeNumber(qty, `Item #${idx + 1} quantity`);
    });
  }
}

const KEYS = {
  USER: 'freelance_user',
  CLIENTS: 'freelance_clients',
  INVOICES: 'freelance_invoices',
  PROPOSALS: 'freelance_proposals',
  REMINDERS: 'freelance_reminders',
  THEME: 'freelance_theme',
  INVOICE_COUNTER: 'freelance_invoice_counter'
};

export class ApiService {

  /**
   * Client-side plan limit checker for immediate UX feedback (FIX 4).
   * Note: Database triggers (check_user_plan_limits) serve as the authoritative server-side enforcement layer.
   */
  static async canCreate(type) {
    const user = this.getUser();
    const plan = (user.plan || '').toLowerCase();

    if (plan.includes('pro')) {
      return true;
    }

    const isStarter = plan.includes('starter');
    const items = type === 'client'
      ? await this.getClients()
      : type === 'invoice'
        ? await this.getInvoices()
        : type === 'proposal'
          ? await this.getProposals()
          : null;

    if (!items) return true;
    if (type === 'client') return items.length < (isStarter ? 15 : 3);

    const now = new Date();
    const thisMonthCount = items.filter(item => {
      const createdAt = new Date(item.created_at || item.createdAt);
      return !Number.isNaN(createdAt.getTime())
        && createdAt.getFullYear() === now.getFullYear()
        && createdAt.getMonth() === now.getMonth();
    }).length;

    return thisMonthCount < (type === 'invoice'
      ? (isStarter ? 30 : 5)
      : (isStarter ? 20 : 3));

  }

  // Generic Getters
  static getUser() {
    return JSON.parse(localStorage.getItem(KEYS.USER) || '{}');
  }

  static saveUser(user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  static async getClients(limit = 100) {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, company, address, notes, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching clients from Supabase:', error);
      showToast('Gagal memuat data klien: ' + error.message, 'error');
      return [];
    }
    return data || [];
  }

  static sanitizeClientPayload(clientData) {
    const allowedFields = ['name', 'email', 'phone', 'company', 'address', 'notes', 'status', 'user_id'];
    const payload = {};
    allowedFields.forEach(field => {
      if (clientData[field] !== undefined) {
        payload[field] = clientData[field];
      }
    });
    return payload;
  }

  static async saveClient(clientData) {
    validateClientInput(clientData);
    if (clientData.id) {
      return await this.updateClient(clientData.id, clientData);
    }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeClientPayload(clientData);
    if (user && !payload.user_id) {
      payload.user_id = user.id;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([payload])
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  }

  static async updateClient(id, clientData) {
    validateClientInput(clientData);
    const payload = this.sanitizeClientPayload(clientData);
    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  }

  static async deleteClient(id) {
    const { data, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  // Invoices
  static sanitizeInvoicePayload(invoiceData, userId = null) {
    const payload = {};
    
    const clientId = invoiceData.clientId || invoiceData.client_id;
    if (clientId) payload.client_id = clientId;
    
    payload.invoice_number = invoiceData.invoiceNumber || invoiceData.invoice_number || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    
    // amount = total tagihan
    payload.amount = Number(invoiceData.amount ?? invoiceData.total ?? 0);
    
    // Status normalisasi
    const rawStatus = (invoiceData.status || 'draft').toLowerCase();
    payload.status = rawStatus;
    payload.payment_status = rawStatus === 'paid' ? 'paid' : (rawStatus === 'overdue' ? 'overdue' : 'unpaid');
    
    const dueDate = invoiceData.dueDate || invoiceData.due_date;
    if (dueDate) payload.due_date = dueDate;
    
    if (invoiceData.items !== undefined) {
      payload.items = typeof invoiceData.items === 'string' ? invoiceData.items : JSON.stringify(invoiceData.items);
    }
    
    if (userId || invoiceData.user_id) {
      payload.user_id = userId || invoiceData.user_id;
    }
    
    return payload;
  }

  static formatInvoiceFromDB(item) {
    if (!item) return null;
    let parsedItems = item.items || [];
    if (typeof parsedItems === 'string') {
      try {
        parsedItems = JSON.parse(parsedItems);
      } catch (e) {
        parsedItems = [];
      }
    }
    return {
      ...item,
      clientId: item.client_id || item.clientId,
      invoiceNumber: item.invoice_number || item.invoiceNumber,
      dueDate: item.due_date || item.dueDate,
      taxPercent: item.tax_rate ?? item.tax_percent ?? item.taxPercent ?? 0,
      discountPercent: item.discount ?? item.discount_percent ?? item.discountPercent ?? 0,
      total: item.amount ?? item.total ?? 0,
      subtotal: item.subtotal ?? item.total ?? 0,
      status: item.payment_status || item.status || 'draft',
      items: parsedItems
    };
  }

  static async getInvoices(limit = 100) {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, client_id, invoice_number, amount, status, payment_status, due_date, items, tax_rate, discount, created_at, user_id, clients(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching invoices from Supabase:', error);
      showToast('Gagal memuat data invoice: ' + error.message, 'error');
      return [];
    }
    return (data || []).map(item => this.formatInvoiceFromDB(item));
  }

  static async saveInvoice(invoiceData) {
    validateInvoiceInput(invoiceData);
    if (invoiceData.id) {
      return await this.updateInvoice(invoiceData.id, invoiceData);
    }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeInvoicePayload(invoiceData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('invoices', payload);
  }

  static async updateInvoice(id, invoiceData) {
    validateInvoiceInput(invoiceData);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeInvoicePayload(invoiceData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('invoices', payload, id);
  }

  static async deleteInvoice(id) {
    const { data, error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  // Proposals
  static sanitizeProposalPayload(proposalData, userId = null) {
    const payload = {};
    
    const clientId = proposalData.clientId || proposalData.client_id;
    if (clientId) payload.client_id = clientId;
    
    if (proposalData.title !== undefined) payload.title = proposalData.title;
    if (proposalData.scope !== undefined || proposalData.scope_of_work !== undefined) {
      payload.scope_of_work = proposalData.scope || proposalData.scope_of_work || '';
    }
    if (proposalData.timeline !== undefined) payload.timeline = proposalData.timeline;
    
    // Kolom budget pada ERD
    payload.budget = Number(proposalData.budget ?? proposalData.amount ?? proposalData.value ?? 0);
    
    if (proposalData.terms !== undefined) payload.terms = proposalData.terms;
    if (proposalData.status !== undefined) payload.status = (proposalData.status).toLowerCase();
    
    if (userId || proposalData.user_id) {
      payload.user_id = userId || proposalData.user_id;
    }
    
    return payload;
  }

  static formatProposalFromDB(item) {
    if (!item) return null;
    return {
      ...item,
      clientId: item.client_id || item.clientId,
      budget: item.budget ?? item.amount ?? 0,
      amount: item.amount ?? item.budget ?? 0,
      items: item.items || []
    };
  }

  static async getProposals(limit = 100) {
    const { data, error } = await supabase
      .from('proposals')
      .select('id, client_id, title, scope_of_work, timeline, budget, amount, terms, status, created_at, user_id, clients(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching proposals from Supabase:', error);
      showToast('Gagal memuat data proposal: ' + error.message, 'error');
      return [];
    }
    return (data || []).map(item => this.formatProposalFromDB(item));
  }

  static async saveProposal(proposalData) {
    validateProposalInput(proposalData);
    if (proposalData.id) {
      return await this.updateProposal(proposalData.id, proposalData);
    }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeProposalPayload(proposalData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('proposals', payload);
  }

  static async updateProposal(id, proposalData) {
    validateProposalInput(proposalData);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeProposalPayload(proposalData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('proposals', payload, id);
  }

  static async deleteProposal(id) {
    const { data, error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  // Reminders
  static sanitizeReminderPayload(reminderData, userId = null) {
    const payload = {};
    
    if (reminderData.title !== undefined) payload.title = reminderData.title;
    
    // Pada ERD kolom tanggal pengingat bernama 'due_date'
    const remindDate = reminderData.remindAt || reminderData.remind_at || reminderData.dueDate || reminderData.due_date;
    if (remindDate) {
      payload.due_date = remindDate;
    }
    
    // Pada ERD kolom selesai bernama 'is_completed' (boolean)
    if (typeof reminderData.is_completed === 'boolean') {
      payload.is_completed = reminderData.is_completed;
    } else {
      payload.is_completed = reminderData.status === 'completed';
    }
    
    // Kolom catatan bernama 'note'
    if (reminderData.note !== undefined || reminderData.notes !== undefined) {
      payload.note = reminderData.note || reminderData.notes || '';
    }
    
    if (reminderData.relatedType || reminderData.related_type) {
      payload.related_type = reminderData.relatedType || reminderData.related_type;
    }
    if (reminderData.category) {
      payload.category = reminderData.category;
    }

    if (userId || reminderData.user_id) {
      payload.user_id = userId || reminderData.user_id;
    }
    
    return payload;
  }

  static formatReminderFromDB(item) {
    if (!item) return null;
    return {
      ...item,
      remindAt: item.remind_at || item.remindAt || item.due_date,
      relatedType: item.related_type || item.relatedType || item.category || 'general',
      note: item.note || item.notes || item.description || ''
    };
  }

  static async getReminders(limit = 100) {
    const { data, error } = await supabase
      .from('reminders')
      .select('id, title, due_date, remind_at, is_completed, note, notes, related_type, category, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching reminders from Supabase:', error);
      showToast('Gagal memuat data pengingat: ' + error.message, 'error');
      return [];
    }
    return (data || []).map(item => this.formatReminderFromDB(item));
  }

  static async saveReminder(reminderData) {
    if (reminderData.id) {
      return await this.updateReminder(reminderData.id, reminderData);
    }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeReminderPayload(reminderData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('reminders', payload);
  }

  static async updateReminder(id, reminderData) {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = this.sanitizeReminderPayload(reminderData, user ? user.id : null);
    return await this.insertOrUpdateSupabase('reminders', payload, id);
  }

  static async deleteReminder(id) {
    const { data, error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  static async insertOrUpdateSupabase(tableName, payload, id = null) {
    let result;
    if (id) {
      result = await supabase.from(tableName).update(payload).eq('id', id).select();
    } else {
      result = await supabase.from(tableName).insert([payload]).select();
    }

    if (result.error) {
      console.warn(`Supabase ${tableName} operation error:`, result.error);

      // Automatic schema mismatch retry: If a field doesn't exist in Supabase DB schema cache, strip it and retry
      if (result.error.message && (result.error.message.includes('schema cache') || result.error.message.includes('column'))) {
        const match = result.error.message.match(/Could not find the '([^']+)' column/i) ||
                      result.error.message.match(/column "([^"]+)" of relation/i);
        if (match && match[1]) {
          const badCol = match[1];
          const newPayload = { ...payload };
          delete newPayload[badCol];

          if (id) {
            result = await supabase.from(tableName).update(newPayload).eq('id', id).select();
          } else {
            result = await supabase.from(tableName).insert([newPayload]).select();
          }
        }
      }
    }

    if (result.error) throw result.error;
    return result.data ? result.data[0] : null;
  }

  // Theme
  static getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'dark';
  }

  static setTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
