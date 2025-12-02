import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const IS_EMAILS = ['is@resourcery.com.ng']  // Add your real IS emails here

export async function POST(request: NextRequest) {
  try {
    const { ticket } = await request.json()

    await resend.emails.send({
      from: 'Resourcery IS Portal <no-reply@resourcery.com.ng>',
      to: IS_EMAILS,
      subject: `🚨 NEW IS TICKET #${ticket.id.slice(-6)} - ${ticket.priority}: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <img src="https://resourcery.com/wp-content/uploads/2023/06/Resourcery-Logo-1.png" alt="Resourcery" style="height: 50px; margin-bottom: 20px;" />
          <h2 style="color: #0F172A;">New IS Support Ticket</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; padding: 15px; border-radius: 4px;">
            <tr><td style="padding: 8px; font-weight: bold;">From:</td><td style="padding: 8px;">${ticket.user_name || ticket.user_email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Priority:</td><td style="padding: 8px; color: ${ticket.priority === 'Urgent' ? 'red' : ticket.priority === 'High' ? 'orange' : '#00D4AA'}">${ticket.priority}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${ticket.category}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${ticket.title}</td></tr>
          </table>
          <p style="background: white; padding: 15px; border-radius: 4px; white-space: pre-wrap;"><strong>Description:</strong><br/>${ticket.description.replace(/\n/g, '<br/>')}</p>
          ${ticket.attachment_url ? `<p style="background: white; padding: 15px; border-radius: 4px;"><a href="${ticket.attachment_url}" style="color: #00D4AA;">📎 View Attachment</a></p>` : ''}
          <br />
          <a href="${`https://${process.env.VERCEL_URL || 'your-app.vercel.app'}/is/dashboard`}" style="background: #00D4AA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Open IS Dashboard →
          </a>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
