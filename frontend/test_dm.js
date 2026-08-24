import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqnskzdnawpnxxefdxwn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnNremRuYXdwbnh4ZWZkeHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzE4NTUsImV4cCI6MjA5Nzg0Nzg1NX0.8x19QF57prWtLbtYmicD2gMEjrJ4l9q8t8BINfidi80'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    // 1. Sign in as employee1
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'employee1@fusion.com',
      password: 'password123'
    })

    if (authErr) {
      console.error('Auth Error:', authErr)
      return
    }

    const user = authData.user
    console.log('Logged in as:', user.email, user.id)

    // 2. Fetch employee2's user details
    const { data: otherUser, error: otherUserErr } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', 'employee2@fusion.com')
      .single()

    if (otherUserErr) {
      console.error('Other User Error:', otherUserErr)
      return
    }

    console.log('Other user:', otherUser.full_name, otherUser.id)

    // 3. Try to start DM
    const sortedIds = [user.id, otherUser.id].sort()
    const dmRoomName = `dm-${sortedIds[0]}-${sortedIds[1]}`
    console.log('DM Room name:', dmRoomName)

    // Find if room already exists
    const { data: existing, error: findErr } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('name', dmRoomName)
      .eq('type', 'direct')
      .maybeSingle()

    if (findErr) {
      console.error('Find Room Error:', findErr)
      return
    }

    console.log('Existing room result:', existing)

    if (existing) {
      console.log('Room already exists. Checking user membership...')
      const { data: isMember, error: isMemberErr } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('room_id', existing.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (isMemberErr) {
        console.error('isMember check Error:', isMemberErr)
        return
      }

      console.log('Is member check:', isMember)

      if (!isMember) {
        console.log('Inserting member...')
        const { data: insertMember, error: insertMemberErr } = await supabase.from('chat_members').insert([
          { room_id: existing.id, user_id: user.id }
        ]).select()

        if (insertMemberErr) {
          console.error('Insert Member Error:', insertMemberErr)
        } else {
          console.log('Insert member success:', insertMember)
        }
      }
    } else {
      console.log('Creating new room...')
      const { data: newRoom, error: createErr } = await supabase
        .from('chat_rooms')
        .insert([{
          name: dmRoomName,
          type: 'direct'
        }])
        .select()
        .single()

      if (createErr) {
        console.error('Create Room Error:', createErr)
        return
      }

      console.log('Created room successfully:', newRoom)

      if (newRoom) {
        console.log('Adding members to chat_members...')
        const { data: insertedMembers, error: membersErr } = await supabase.from('chat_members').insert([
          { room_id: newRoom.id, user_id: user.id },
          { room_id: newRoom.id, user_id: otherUser.id }
        ]).select()

        if (membersErr) {
          console.error('Add Members Error:', membersErr)
        } else {
          console.log('Members added successfully:', insertedMembers)
        }
      }
    }
  } catch (error) {
    console.error('Script error:', error)
  }
}

test()
