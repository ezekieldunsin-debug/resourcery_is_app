'use client'

import { useState, useEffect } from 'react'
import { Search, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'  // Fixed import
import { isISUser } from '@/lib/is-team'  // Fixed import

export default function ISDashboard() {
  const [user, setUser] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user && !isISUser(user.user_metadata?.email || user.email)) {
        window.location.href = '/'
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    fetchTickets()
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchTickets()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const fetchTickets = async () => {
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false })
    setTickets(data || [])
  }

  const updateTicket = async (id: string, updates: any) => {
    await supabase.from('tickets').update(updates).eq('id', id)
    fetchTickets()
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, ...updates })
  }

  const addComment = async () => {
    if (!comment.trim() || !selectedTicket) return
    const newComment = {
      text: comment,
      author: user.user_metadata?.full_name || user.user_metadata?.email || user.email,
      timestamp: new Date().toISOString(),
    }
    const comments = selectedTicket.comments ? [...(selectedTicket.comments as any[]), newComment] : [newComment]
    await supabase.from('tickets').update({ comments }).eq('id', selectedTicket.id)
    setComment('')
    fetchTickets()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search && !`${t.title} ${t.user_name || t.user_email}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <AlertCircle className="text-red-500" size={16} />
      case 'In Progress': return <Clock className="text-yellow-500" size={16} />
      case 'Resolved': return <CheckCircle className="text-green-500" size={16} />
      default: return <Clock className="text-gray-500" size={16} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-navy p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src="https://resourcery.com/wp-content/uploads/2023/06/Resourcery-Logo-1.png"
              alt="Resourcery"
              className="h-12"
            />
            <h1 className="text-3xl font-bold">IS Department Dashboard</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                <input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-teal"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="bg-gray-700 px-4 py-3 rounded-lg border border-gray-600"
              >
                <option value="all">All</option>
                <option>New</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>
            <div className="space-y-3 max-h-[80vh] overflow-y-auto">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-700 ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-teal bg-gray-700' : 'bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm pr-2 flex-1">{ticket.title}</h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      <span className="text-xs px-2 py-1 rounded bg-gray-600">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    {ticket.user_name || ticket.user_email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {filteredTickets.length === 0 && (
                <p className="text-center text-gray-500 py-8">No tickets found</p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{selectedTicket.title}</h2>
                <select
                  value={selectedTicket.status}
                  onChange={e => updateTicket(selectedTicket.id, { status: e.target.value })}
                  className="bg-gray-700 px-4 py-2 rounded border border-gray-600 focus:border-teal"
                >
                  <option>New</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 p-3 rounded">
                  <strong>Priority:</strong> {selectedTicket.priority}
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong>Category:</strong> {selectedTicket.category}
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong>User:</strong> {selectedTicket.user_name || selectedTicket.user_email}
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong>Submitted:</strong> {new Date(selectedTicket.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <strong>Description:</strong>
                <p className="mt-2 whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                {selectedTicket.attachment_url && (
                  <a
                    href={selectedTicket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline block mt-2 flex items-center gap-1"
                  >
                    <Paperclip size={16} /> View Attachment
                  </a>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} /> Comments
                </h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {(selectedTicket.comments as any[])?.length > 0 ? (
                    (selectedTicket.comments as any[]).map((c: any, i: number) => (
                      <div key={i} className="bg-gray-600 p-3 rounded">
                        <div className="font-semibold text-sm">{c.author}</div>
                        <div className="text-xs text-gray-400 mb-1">
                          {new Date(c.timestamp).toLocaleString()}
                        </div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No comments yet. Add one below!</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <input
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="flex-1 bg-gray-700 px-4 py-3 rounded-lg border border-gray-600 focus:border-teal"
                  />
                  <button
                    onClick={addComment}
                    disabled={!comment.trim()}
                    className="bg-teal disabled:opacity-50 px-6 py-3 rounded-lg hover:bg-teal/90 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => updateTicket(selectedTicket.id, { status: 'In Progress' })}
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg flex-1 transition-colors"
                >
                  Take Ticket
                </button>
                <button
                  onClick={() => updateTicket(selectedTicket.id, { status: 'Resolved' })}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex-1 transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-10 text-center text-gray-500">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
