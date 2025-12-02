'use client'

import { useState, useEffect } from 'react'
import { LogIn, Send, Paperclip } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'  // Fixed import
import { isISUser } from '@/lib/is-team'  // Fixed import

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email profile' }
  })

  const signOut = () => supabase.auth.signOut()

  const quickRequest = (t: string, c: string, d: string) => {
    setTitle(t)
    setCategory(c)
    setDescription(d)
  }

  const submitTicket = async () => {
    if (!user) return alert('Please log in first.')

    let attachment_url = null
    if (file) {
      const { data } = await supabase.storage
        .from('attachments')
        .upload(`${user.id}/${Date.now()}-${file.name}`, file)
      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(data.path)
        attachment_url = publicUrl
      }
    }

    const { data: newTicket } = await supabase
      .from('tickets')
      .insert({
        user_email: user.user_metadata?.email || user.email,
        user_name: user.user_metadata?.full_name || user.email,
        title,
        description,
        category,
        priority,
        attachment_url,
        status: 'New'
      })
      .select()
      .single()

    if (newTicket) {
      await fetch('/api/new-ticket-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: newTicket })
      })
    }

    alert('Ticket submitted! IS team will contact you soon.')
    setTitle(''); setDescription(''); setCategory(''); setPriority('Medium'); setFile(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md w-full">
          <img src="https://resourcery.com/wp-content/uploads/2023/06/Resourcery-Logo-1.png" alt="Resourcery" className="h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-navy mb-4">Resourcery IS Portal</h1>
          <p className="text-gray-600 mb-8">One-click support from Information Systems</p>
          <button
            onClick={signIn}
            className="bg-teal hover:bg-teal/90 text-white px-8 py-4 rounded-xl flex items-center gap-3 mx-auto text-lg font-bold transition-colors"
          >
            <LogIn size={24} /> Login with Office 365
          </button>
        </div>
      </div>
    )
  }

  const quickButtons = [
    { title: 'New Laptop', icon: '💻', cat: 'Hardware', desc: 'Request new laptop or accessories' },
    { title: 'Software Install', icon: '📦', cat: 'Software', desc: 'Install new software' },
    { title: 'Account Unlock', icon: '🔓', cat: 'Account', desc: 'Unlock account or reset password' },
    { title: 'Guest Wi-Fi', icon: '📶', cat: 'Network', desc: 'Guest Wi-Fi access' },
    { title: 'Printer Issue', icon: '🖨️', cat: 'Printer', desc: 'Printer not working' },
    { title: 'Teams/Zoom', icon: '🎥', cat: 'Collaboration', desc: 'Teams or Zoom problem' },
    { title: 'VPN Problem', icon: '🌐', cat: 'Network', desc: 'VPN connection issue' },
    { title: 'New Employee', icon: '👤', cat: 'Onboarding', desc: 'Onboard new staff' },
    { title: 'Access Request', icon: '🔑', cat: 'Permissions', desc: 'Request folder/software access' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="https://resourcery.com/wp-content/uploads/2023/06/Resourcery-Logo-1.png" alt="Resourcery" className="h-12" />
            <div>
              <h1 className="text-2xl font-bold">Resourcery IS Portal</h1>
              <p className="text-sm opacity-80">Information Systems Support</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {isISUser(user.user_metadata?.email || user.email) && (
              <a href="/is/dashboard" className="bg-teal hover:bg-teal/90 px-6 py-3 rounded-lg font-bold transition-colors">
                IS Dashboard →
              </a>
            )}
            <button onClick={signOut} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-navy">Quick Requests (One Tap)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {quickButtons.map((btn, i) => (
            <button
              key={i}
              onClick={() => quickRequest(btn.title, btn.cat, btn.desc)}
              className="bg-white border-2 border-gray-200 hover:border-teal hover:shadow-lg rounded-xl p-6 text-center transition-all"
            >
              <div className="text-4xl mb-2">{btn.icon}</div>
              <div className="font-semibold text-gray-800">{btn.title}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-navy">Create Custom Ticket</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <input
              placeholder="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal"
            />
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
            <input
              placeholder="Category (e.g., Hardware)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border rounded-lg px-4 py-3 md:col-span-2 focus:ring-2 focus:ring-teal"
            />
            <textarea
              placeholder="Describe your issue in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="border rounded-lg px-4 py-3 md:col-span-2 focus:ring-2 focus:ring-teal"
            />
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium">Attachment (optional)</label>
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-4 py-3"
              />
              <button
                onClick={submitTicket}
                className="mt-4 bg-teal hover:bg-teal/90 text-white px-8 py-4 rounded-xl flex items-center gap-3 text-lg font-bold transition-colors w-full md:w-auto justify-center"
              >
                <Send size={24} /> Submit Ticket
                {file && <Paperclip size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
