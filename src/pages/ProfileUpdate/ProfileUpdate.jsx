import React, { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import upload from '../../lib/upload'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { supabase } from '../../config/supabase' 
const ProfileUpdate = () => {

  const [image, setImage] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [uid, setUid] = useState("")
  const navigate = useNavigate()
  const [prevImage, setPrevImage] = useState("")
  const { setUserData } = useContext(AppContext)

  const profileUpdate = async (event) => {
    event.preventDefault()
    try {
      if (!prevImage && !image) {
        toast.error("Upload profile picture")
        return
      }

      let imgUrl = prevImage
      if (image) {
        imgUrl = await upload(image)
        setPrevImage(imgUrl)
      }

      const { error } = await supabase
        .from('users')
        .update({
          avatar: imgUrl,
          bio: bio,
          name: name
        })
        .eq('id', uid)

      if (error) throw error

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single()

      if (fetchError) throw fetchError

      setUserData(data)
      navigate('/chat')
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUid(user.id)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        if (error) {
          toast.error(error.message)
          return
        }
        if (data.name) setName(data.name)
        if (data.bio) setBio(data.bio)
        if (data.avatar) setPrevImage(data.avatar)
      } else {
        navigate("/")
      }
    }
    getUser()
  }, [navigate])

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile details</h3>
          <label htmlFor='avatar'>
            <input onChange={(e) => setImage(e.target.files[0])} id='avatar' type="file" accept=".png, .jpg, .jpeg" hidden />
            <img src={image ? URL.createObjectURL(image) : assets.avatar_icon} alt="" />
            upload profile image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} placeholder='Your name' type="text" required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Write profile bio' required />
          <button type="submit">Save</button>
        </form>
        <img className='profile-pic' src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfileUpdate
