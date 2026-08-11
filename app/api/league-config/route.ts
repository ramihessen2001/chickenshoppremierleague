/**
 * API Route for updating league configuration
 * Used by admin to change current week
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { current_week } = body

    if (typeof current_week !== 'number' || current_week < 1) {
      return NextResponse.json(
        { error: 'Invalid current_week value' },
        { status: 400 }
      )
    }

    // First, get the league config (there should only be one row)
    const { data: configs, error: fetchError } = await supabaseAdmin
      .from('league_config')
      .select('id')
      .limit(1)

    if (fetchError || !configs || configs.length === 0) {
      console.error('Error fetching league config:', fetchError)
      return NextResponse.json(
        { error: 'League config not found' },
        { status: 404 }
      )
    }

    // Update league config using admin client
    const { error } = await supabaseAdmin
      .from('league_config')
      .update({ 
        current_week,
        updated_at: new Date().toISOString()
      })
      .eq('id', configs[0].id)

    if (error) {
      console.error('Error updating league config:', error)
      return NextResponse.json(
        { error: 'Failed to update league config' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, current_week })
  } catch (error) {
    console.error('Error in league-config API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

