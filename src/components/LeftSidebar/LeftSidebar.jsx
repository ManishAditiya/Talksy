import React, { useContext, useEffect, useMemo, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {
  const {
    chatData,            // [{ id, message_id, last_message, rid, message_seen, userData }, ...]
    userData,            // { id, name, username, avatar, ... }
    chatUser,
    setChatUser,
    setMessagesId,
    messagesId,
    chatVisible,
    setChatVisible
  } = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  // ---------- SEARCH HANDLER ----------
  const inputHandler = (e) => setSearch(e.target.value);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
    );
  }, [search, allUsers]);

  // ---------- CLICK: OPEN EXISTING CHAT ROW ----------
  const openChatRow = async (row) => {
    try {
      setMessagesId(row.message_id);
      setChatUser(row);
      await supabase.from('chats').update({ message_seen: true }).eq('id', row.id);
      setChatVisible(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------- CLICK: START/RESUME CHAT WITH A USER ----------
  const startChatWithUser = async (otherUser) => {
    try {
      if (!otherUser || !userData) return;

      // find any existing chat between the two users
      const { data: existingChats, error } = await supabase
        .from('chats')
        .select('*')
        .or(
          `and(user_id.eq.${userData.id},rid.eq.${otherUser.id}),and(user_id.eq.${otherUser.id},rid.eq.${userData.id})`
        );

      if (error) throw error;

      let messageId;

      if (existingChats && existingChats.length) {
        messageId = existingChats[0].message_id;
      } else {
        // create a messages row
        const { data: messageRow, error: msgErr } = await supabase
          .from('messages')
          .insert([{ created_at: new Date().toISOString(), chat_id: null }])
          .select()
          .single();
        if (msgErr) throw msgErr;

        messageId = messageRow.id;

        // create two chat rows (one per user)
        const nowISO = new Date().toISOString();
        const { error: chatErr } = await supabase.from('chats').insert([
          {
            user_id: userData.id,
            message_id: messageId,
            last_message: '',
            rid: otherUser.id,
            updated_at: nowISO,
            message_seen: true
          },
          {
            user_id: otherUser.id,
            message_id: messageId,
            last_message: '',
            rid: userData.id,
            updated_at: nowISO,
            message_seen: true
          }
        ]);
        if (chatErr) throw chatErr;
      }

      // set context and open the chat
      setMessagesId(messageId);
      setChatUser({ userData: otherUser, rId: otherUser.id });
      setChatVisible(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------- KEEP chatUser.userData FRESH ----------
  useEffect(() => {
    const updateChatUserData = async () => {
      try {
        if (chatUser?.userData?.id) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', chatUser.userData.id)
            .single();
          if (!error && data) setChatUser((prev) => ({ ...prev, userData: data }));
        }
      } catch (_) {}
    };
    updateChatUserData();
  }, [chatData]); // refresh when chat list updates

  // ---------- LOAD ALL USERS (EXCEPT SELF) ----------
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar')
        .neq('id', userData.id)
        .order('name', { ascending: true });
      if (!error && data) setAllUsers(data);
    };
    if (userData?.id) fetchUsers();

    // optional: realtime subscription to users table
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          if (userData?.id) fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  return (
    <div className={`ls ${chatVisible ? 'hidden' : ''}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img className="logo" src={assets.logo} alt="Talksy Logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="Menu" />
            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p onClick={async () => { await supabase.auth.signOut(); }}>Logout</p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            onChange={inputHandler}
            value={search}
            type="text"
            placeholder="Search name or username…"
          />
        </div>
      </div>

      <div className="ls-list">
        {/* ALL PEOPLE */}
        <div className="ls-section-title" style={{ marginTop: 12 }}>
          People
        </div>
        {filteredUsers.length === 0 && <div className="muted">No users found</div>}
        {filteredUsers.map((u) => (
          <div key={u.id} className="friends add-user" onClick={() => startChatWithUser(u)}>
            <img src={u.avatar} alt="" />
            <div>
              <p>{u.name}</p>
              <span>@{u.username}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftSidebar;
