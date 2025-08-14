import { createClient } from "@supabase/supabase-js";
import { toast } from "react-toastify";

// ---- Supabase Config ----
// Move these to your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----------------------------
// Auth Functions
// ----------------------------

const signup = async (username, email, password) => {
  try {
    // Check if username already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username.toLowerCase());

    if (userCheckError) throw userCheckError;

    if (existingUser.length > 0) {
      toast.error("Username already taken");
      return 0;
    }

    // Sign up user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    const user = signUpData.user || signUpData.session?.user;

    if (!user) {
      toast.success("Check your email to confirm your account.");
      return;
    }

    // Insert user profile (must match auth.uid())
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: user.id, // UUID from auth.uid()
        username: username.toLowerCase(),
        email: email,
        name: "",
        avatar: "",
        bio: "Hey, There I am using chat app",
        last_seen: new Date().toISOString(),
      },
    ]);

    if (insertError) throw insertError;

    toast.success("Signup successful!");
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};


const login = async (email, password) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};

const logout = async () => {
  await supabase.auth.signOut();
};

const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return null;
  }
  try {
    // Check if email exists in users table
    const { data: userData, error: emailCheckError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (emailCheckError) throw emailCheckError;

    if (userData.length > 0) {
      // Supabase sends a password reset email automatically
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Reset Email Sent");
    } else {
      toast.error("Email doesn't exist");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};

export { signup, login, logout, resetPass };
