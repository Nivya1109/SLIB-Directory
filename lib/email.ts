import { Resend } from 'resend'

interface ReplyEmailOptions {
  toName:     string
  toEmail:    string
  subject:    string
  adminReply: string
}

export async function sendReplyEmail({
  toName,
  toEmail,
  subject,
  adminReply,
}: ReplyEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith('re_xxx')) {
    console.warn('[email] RESEND_API_KEY is missing or still a placeholder — email skipped. Set a real key in .env and restart the server.')
    return
  }

  const resend = new Resend(apiKey)
  const from   = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  const { error } = await resend.emails.send({
    from,
    to:      toEmail,
    subject: `Re: ${subject}`,
    text: [
      `Hello ${toName},`,
      '',
      'Thank you for contacting SLIB Directory & Finder.',
      '',
      'Here is our response:',
      '',
      adminReply,
      '',
      'Best regards,',
      'SLIB Support Team',
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <p>Hello <strong>${toName}</strong>,</p>
        <p>Thank you for contacting <strong>SLIB Directory &amp; Finder</strong>.</p>
        <p>Here is our response:</p>
        <blockquote style="border-left:3px solid #7c3aed;padding:12px 16px;margin:16px 0;background:#f5f3ff;border-radius:4px;white-space:pre-wrap;">${adminReply.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>
        <p>Best regards,<br/><strong>SLIB Support Team</strong></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="font-size:12px;color:#6b7280;">This is a reply to your support request. Please do not reply to this email.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
