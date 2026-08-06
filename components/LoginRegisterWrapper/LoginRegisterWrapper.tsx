"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginRegister from "@/components/LoginRegister/LoginRegister";
import { useAuth } from "@/components/AuthContext";
import { AuthContext } from "@/components/AuthContext";

interface User {
  _id: string;
  login_name: string;
  first_name: string;
  last_name: string;
}

interface LoginRegisterProps {
  isLoggedIn?: boolean;
  onLogin?: (user: User) => void;
}

function LoginRegisterWrapper(props: LoginRegisterProps) {
  const router = useRouter();
  const { loggedInUser, handleLogin } = useContext(AuthContext);


  const login = (user: User) => {
    handleLogin(user);
    router.push(`/users/${user._id}`);
  };

  useEffect(() => {
    if (loggedInUser) {
      router.replace("/users");
    }
  }, [loggedInUser, router]);

  return (
    <div className="ps-login-page">
    <LoginRegister
      {...props}
      onLogin={login}
    />
    </div>
  );
}

export default LoginRegisterWrapper;