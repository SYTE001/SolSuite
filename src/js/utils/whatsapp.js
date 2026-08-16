export function buildWhatsAppInvoiceUrl(invoice, client, formatIDR) {
  const clientName = client?.name || 'Klien';
  const invoiceNumber = invoice.invoiceNumber || '';
  const title = invoice.title || 'Invoice';
  const totalStr = formatIDR ? formatIDR(invoice.total) : `Rp ${invoice.total}`;
  const dueDate = invoice.dueDate || '-';
  const invoiceUrl = `https://www.kayana.web.id/invoice-generator?inv=${encodeURIComponent(invoiceNumber)}`;

  const messageText = `Halo ${clientName},

Berikut rincian tagihan untuk ${invoiceNumber} (${title}):
- Total: ${totalStr}
- Jatuh Tempo: ${dueDate}

Anda dapat melihat detail invoice serta melakukan pembayaran secara online melalui link berikut:
${invoiceUrl}

Terima kasih!`;

  const encodedText = encodeURIComponent(messageText);

  let rawPhone = (client?.phone || '').replace(/\D/g, '');
  if (rawPhone.startsWith('0')) {
    rawPhone = '62' + rawPhone.slice(1);
  }

  if (rawPhone && rawPhone.length >= 7) {
    return `https://wa.me/${rawPhone}?text=${encodedText}`;
  } else {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
}
