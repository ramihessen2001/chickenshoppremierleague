/**
 * Read the signup list. Admin only.
 *
 *   GET                  -> { signups: [...] }
 *   GET ?format=csv      -> text/csv download, for the draft
 *
 * These rows carry contact details and are not readable with the anon key, so
 * this route is the only way to see them.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'

/** Wraps a value for CSV: escape quotes, and quote anything with a separator. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function GET(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)

  const { data, error } = await supabaseAdmin
    .from('signups')
    .select('*, drafted_team:teams!drafted_team_id(id, name, slug)')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading signups:', error)
    return fail('Failed to load signups', 500)
  }

  const signups = data ?? []

  if (searchParams.get('format') === 'csv') {
    const header = [
      'Name',
      'Email',
      'Phone',
      'Position',
      'Experience',
      'Status',
      'Drafted team',
      'Notes',
      'Registered',
    ]

    const rows = signups.map((signup: Record<string, unknown>) =>
      [
        signup.name,
        signup.email,
        signup.phone,
        signup.position,
        signup.experience,
        signup.status,
        (signup.drafted_team as { name?: string } | null)?.name ?? '',
        signup.notes,
        signup.created_at,
      ]
        .map(csvCell)
        .join(',')
    )

    // The BOM makes Excel read it as UTF-8 rather than mangling accented names.
    const csv = `﻿${[header.join(','), ...rows].join('\r\n')}`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="signups.csv"',
      },
    })
  }

  return NextResponse.json({ signups })
}
