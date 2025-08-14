import React, { useContext, useEffect, useRef, useState } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { supabase } from '../../config/supabase';

const ChatBox = () => {

  const { userData, messagesId, chatUser, messages, setMessages, chatVisible, setChatVisible } = useContext(AppContext);
  const [input, setInput] = useState("");
  const scrollEnd = useRef();

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        // Insert new message
        const { error } = await supabase
          .from('messages')
          .insert([{
            chat_id: messagesId,
            sender_id: userData.id,
            text: input,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;

        // Update last message in chats
        const userIDs = [chatUser.rId, userData.id];
        for (const id of userIDs) {
          const { data: chatRow } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', id)
            .eq('message_id', messagesId)
            .single();

          if (chatRow) {
            const updates = {
              last_message: input,
              updated_at: new Date().toISOString(),
            };
            if (chatRow.rid === userData.id) {
              updates.message_seen = false;
            }
            await supabase
              .from('chats')
              .update(updates)
              .eq('id', chatRow.id);
          }
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
    setInput("")
  }

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (hour > 12) {
      return (hour - 12) + ':' + minute + " PM";
    } else {
      return hour + ':' + minute + " AM";
    }
  }

  const sendImage = async (e) => {
    const fileUrl = await upload(e.target.files[0])
    if (fileUrl && messagesId) {
      await supabase
        .from('messages')
        .insert([{
          chat_id: messagesId,
          sender_id: userData.id,
          image: fileUrl,
          created_at: new Date().toISOString()
        }]);
      // Update last message in chats
      const userIDs = [chatUser.rId, userData.id];
      for (const id of userIDs) {
        const { data: chatRow } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', id)
          .eq('message_id', messagesId)
          .single();
        if (chatRow) {
          await supabase
            .from('chats')
            .update({
              last_message: "Image",
              updated_at: new Date().toISOString()
            })
            .eq('id', chatRow.id);
        }
      }
    }
  }

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages])

  useEffect(() => {
    let subscription;
    const fetchMessages = async () => {
      if (messagesId) {
        // Initial fetch
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', messagesId)
          .order('created_at', { ascending: false });
        if (!error) setMessages(data);

        // Subscribe to changes
        subscription = supabase
          .channel('messages')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${messagesId}` },
            payload => {
              fetchMessages();
            }
          )
          .subscribe();
      }
    };
    fetchMessages();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [messagesId]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <img src={chatUser ? chatUser.userData.avatar : assets.profile_img} alt="" />
        <p>{chatUser ? chatUser.userData.name : "Richard Sanford"} {Date.now() - chatUser.userData.lastSeen <= 70000 ? <img className='dot' src={assets.green_dot} alt='' /> : null}</p>
        <img onClick={() => setChatVisible(false)} className='arrow' src={assets.arrow_icon} alt="" />
        <img className='help' src={assets.help_icon} alt="" />
      </div>
      <div className="chat-msg">
        <div ref={scrollEnd}></div>
        {
          messages.map((msg, index) => {
            return (
              <div key={index} className={msg.sender_id === userData.id ? "s-msg" : "r-msg"}>
                {msg["image"]
                  ? <img className='msg-img' src={msg["image"]} alt="" />
                  : <p className="msg">{msg["text"]}</p>
                }
                <div>
                  <img src={msg.sender_id === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
                  <p>{convertTimestamp(msg.created_at)}</p>
                </div>
              </div>
            )
          })
        }
      </div>
      <div className="chat-input">
        <input onKeyDown={(e) => e.key === "Enter" ? sendMessage() : null} onChange={(e) => setInput(e.target.value)} value={input} type="text" placeholder='Send a message' />
        <input onChange={sendImage} type="file" id='image' accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  ) : <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
    <img src={assets.logo_icon} alt=''/>
    <p>Chat anytime, anywhere</p>
  </div>
}

export default ChatBox
