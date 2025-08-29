import React, { useState } from 'react';
import './Login.css';
import assets from '../../assets/assets'; // must export { logo } = bubble icon (png/svg)
import { signup, login, resetPass } from '../../config/supabase';

const Login = () => {
  const [currState, setCurrState] = useState('Sign up');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (currState === 'Sign up') {
      signup(userName, email, password);
    } else {
      login(email, password);
    }
  };

  return (
    <div className="login">
      {/* Left brand block (icon + wordmark) */}
      <div className="brand">
        <img className="brand-icon" src={assets.logo_big} alt="Talksy icon" />
        
      </div>

      {/* Right form */}
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2>

        {currState === 'Sign up' && (
          <input
            className="form-input"
            type="text"
            placeholder="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        )}

        <input
          className="form-input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="form-input"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          {currState === 'Sign up' ? 'Create account' : 'Login now'}
        </button>

        <div className="login-term">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="login-forgot">
          {currState === 'Sign up' ? (
            <p className="login-toggle">
              Already have an account?{' '}
              <span onClick={() => setCurrState('Login')}>Login here</span>
            </p>
          ) : (
            <p className="login-toggle">
              Create an account{' '}
              <span onClick={() => setCurrState('Sign up')}>Click here</span>
            </p>
          )}

          {currState === 'Login' && (
            <p className="login-toggle">
              Forgot Password? <span onClick={() => resetPass(email)}>Click here</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
