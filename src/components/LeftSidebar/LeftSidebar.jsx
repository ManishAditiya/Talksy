import React, { useContext, useEffect, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {

    const { chatData, userData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false)
    const navigate = useNavigate();

    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            if (input) {
                setShowSearch(true);
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', input.toLowerCase());
                if (error) throw error;
                if (data.length && data[0].id !== userData.id) {
                    let userExist = false;
                    chatData.forEach((user) => {
                        if (user.rid === data[0].id) {
                            userExist = true;
                        }
                    })
                    if (!userExist) {
                        setUser(data[0]);
                    }
                } else {
                    setUser(null)
                }
            } else {
                setShowSearch(false);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const addChat = async () => {
        try {
            if (user.id === userData.id) return 0;
            // Create new chat and message row
            const { data: messageRow, error: msgErr } = await supabase
                .from('messages')
                .insert([{ created_at: new Date().toISOString(), chat_id: null }])
                .select()
                .single();
            if (msgErr) throw msgErr;

            // Insert chat for both users
            await supabase.from('chats').insert([
                {
                    user_id: user.id,
                    message_id: messageRow.id,
                    last_message: "",
                    rid: userData.id,
                    updated_at: Date.now(),
                    message_seen: true
                },
                {
                    user_id: userData.id,
                    message_id: messageRow.id,
                    last_message: "",
                    rid: user.id,
                    updated_at: Date.now(),
                    message_seen: true
                }
            ]);

            // Fetch userData for chat
            const { data: uData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            setChat({
                messageId: messageRow.id,
                lastMessage: "",
                rId: user.id,
                updatedAt: Date.now(),
                messageSeen: true,
                userData: uData,
            });
            setShowSearch(false)
            setChatVisible(true)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const setChat = async (item) => {
        setMessagesId(item.message_id)
        setChatUser(item)
        await supabase
            .from('chats')
            .update({ message_seen: true })
            .eq('id', item.id);
        setChatVisible(true)
    }

    useEffect(() => {
        const updateChatUserData = async () => {
            if (chatUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', chatUser.userData.id)
                    .single();
                setChatUser(prev => ({ ...prev, userData }))
            }
        }
        updateChatUserData();
    }, [chatData])

    return (
        <div className={`ls ${chatVisible ? "hidden" : ""}`}>
            <div className='ls-top'>
                <div className='ls-nav'>
                    <img className='logo' src={assets.logo} alt="" />
                    <div className='menu'>
                        <img src={assets.menu_icon} alt="" />
                        <div className='sub-menu'>
                            <p onClick={() => navigate('/profile')}>Edit Profile</p>
                            <hr />
                            <p onClick={async () => { await supabase.auth.signOut(); }}>Logout</p>
                        </div>
                    </div>

                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="" />
                    <input onChange={inputHandler} type="text" placeholder='Search here..' />
                </div>
            </div>
            <div className="ls-list">
                {showSearch && user
                    ? <div onClick={addChat} className='friends add-user'>
                        <img src={user.avatar} alt="" />
                        <p>{user.name}</p>
                    </div>
                    : chatData.map((item, index) => (
                        <div onClick={() => setChat(item)} key={index} className={`friends ${item.message_seen || item.message_id === messagesId ? "" : "border"}`}>
                            <img src={item.userData.avatar} alt="" />
                            <div>
                                <p>{item.userData.name}</p>
                                <span>{item.last_message?.slice(0, 30)}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

export default LeftSidebar
