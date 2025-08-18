import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([])
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);
    const navigate = useNavigate();

    const loadUserData = async (uid) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', uid)
                .single();
            if (error) throw error;
            setUserData(data);
            if (data.avatar && data.name) {
                navigate('/chat');
            } else {
                navigate('/profile')
            }
            await supabase
                .from('users')
                .update({ last_seen: Date.now() })
                .eq('id', uid);
            setInterval(async () => {
                await supabase
                    .from('users')
                    .update({ last_seen: Date.now() })
                    .eq('id', uid);
            }, 60000);
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (userData) {
            const fetchChats = async () => {
                const { data, error } = await supabase
                    .from("chats")
                    .select(`
      id,
      message_id,
      last_message,
      updated_at,
      message_seen,
      users (
        id,
        email,
        name,
        avatar
      )
    `)
                    .eq('user_id', userData.id);

                if (error) {
                    toast.error(error.message);
                    return;
                }
                setChatData(data);
            };
            fetchChats();
            const interval = setInterval(fetchChats, 10000);
            return () => clearInterval(interval);
        }
    }, [userData])

    const value = {
        userData, setUserData,
        loadUserData,
        chatData,
        messagesId,
        setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible,
        messages, setMessages
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;