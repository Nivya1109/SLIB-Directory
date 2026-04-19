import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReplyEmail } from '@/lib/email'

const VALID_STATUSES = ['open', 'in_progress', 'resolved']

// PATCH /api/support/[id] — admin only: update status or add reply
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, adminReply } = body

    // Reply branch — takes priority, auto-resolves ticket
    if (adminReply !== undefined) {
      const trimmed = typeof adminReply === 'string' ? adminReply.trim() : ''
      if (!trimmed) {
        return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: params.id },
        data: {
          adminReply: trimmed,
          repliedAt:  new Date(),
          status:     'resolved',
        },
      })

      // Send email — non-blocking: a mail failure must not lose the saved reply
      try {
        await sendReplyEmail({
          toName:    ticket.name,
          toEmail:   ticket.email,
          subject:   ticket.subject,
          adminReply: trimmed,
        })
      } catch (mailErr) {
        console.error('Reply email failed (reply still saved):', mailErr)
      }

      return NextResponse.json({ success: true, ticket })
    }

    // Status-only branch
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status },
      })

      return NextResponse.json({ success: true, ticket })
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Support ticket update error:', msg, error)
    return NextResponse.json({ error: 'Failed to update ticket', detail: msg }, { status: 500 })
  }
}
