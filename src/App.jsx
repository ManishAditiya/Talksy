import React, { useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { AppContext } from './context/AppContext';
import { supabase } from './config/supabase';

const App = () => {

  const navigate = useNavigate();
  const { loadUserData, setChatUser, setMessagesId } = useContext(AppContext);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user;
        if (user) {
          loadUserData(user.id);
        } else {
          setChatUser(null);
          setMessagesId(null);
          navigate('/');
        }
      }
    );
    // Cleanup on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/chat' element={<Chat />} />
        <Route path='/' element={<Login />} />
        <Route path='/profile' element={<ProfileUpdate />} />
      </Routes>
    </>
  )
}

export default App
