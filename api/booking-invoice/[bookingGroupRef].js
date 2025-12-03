import { createClient } from '@supabase/supabase-js';
import { getSession } from '../_lib/session.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  // Check authentication
  const session = await getSession(req);
  if (!session?.data?.memberId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { bookingGroupRef } = req.query;

  if (!bookingGroupRef) {
    return res.status(400).json({ error: 'Booking group reference required' });
  }

  try {
    // Fetch booking with Xero invoice data and verify ownership
    const { data: booking, error } = await supabase
      .from('booking')
      .select('xero_invoice_id, xero_invoice_number, xero_invoice_pdf_base64, member_id')
      .eq('booking_group_reference', bookingGroupRef)
      .not('xero_invoice_pdf_base64', 'is', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({ error: 'Failed to fetch booking' });
    }

    if (!booking || !booking.xero_invoice_pdf_base64) {
      return res.status(404).json({ error: 'Invoice not found for this booking' });
    }

    // Verify ownership - the logged-in member must be the one who made the booking
    if (booking.member_id !== session.data.memberId) {
      return res.status(403).json({ error: 'Not authorized to view this invoice' });
    }

    // Check if inline preview is requested
    const inline = req.query.inline === 'true';
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(booking.xero_invoice_pdf_base64, 'base64');
    
    // Set headers for PDF download or inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    if (inline) {
      res.setHeader('Content-Disposition', `inline; filename="invoice-${booking.xero_invoice_number || bookingGroupRef}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.xero_invoice_number || bookingGroupRef}.pdf"`);
    }
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error serving invoice PDF:', error);
    return res.status(500).json({ error: 'Failed to serve invoice' });
  }
}
