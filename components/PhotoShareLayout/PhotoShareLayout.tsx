"use client";

import { ReactNode, useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

import TopBar from "@/components/topBar/TopBar";
import UserList from "@/components/userList/userList";
import { AuthContext } from "@/components/AuthContext";
import "./PhotoShareLayout.css";

interface User {
  _id: string;
  login_name: string;
  first_name: string;
  last_name: string;
}

interface PhotoShareLayoutProps {
  children: ReactNode;
}

export default function PhotoShareLayout({
  children,
}: PhotoShareLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login-register";
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [photoRefreshCounter, setPhotoRefreshCounter] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    axios.defaults.withCredentials = true;

    axios
      .get("/api/me", { withCredentials: true })
      .then((response) => {
        setLoggedInUser(response.data);
      })
      .catch(() => {
        setLoggedInUser(null);
      })
      .finally(() => {
        setCheckedLogin(true);
      });
  }, []);

  // Protect routes that require login
  useEffect(() => {
    if (!checkedLogin) return;

    const protectedPaths = [
      "/users",
      "/photos",
    ];

    const requiresAuth = pathname
  ? protectedPaths.some((path) => pathname.startsWith(path))
  : false;

    if (requiresAuth && !loggedInUser) {
      router.push("/login-register");
    }
  }, [checkedLogin, loggedInUser, pathname, router]);

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
  };

  const handleLogout = () => {
    axios
      .post("/api/admin/logout")
      .then(() => {
        setLoggedInUser(null);
        router.push("/login-register");
      })
      .catch(() => {
        setLoggedInUser(null);
        router.push("/login-register");
      });
  };

  const handlePhotoUploaded = () => {
    setPhotoRefreshCounter((previous) => previous + 1);
  };

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  if (!checkedLogin) {
    return <p className="ps-loading">Loading...</p>;
  }

  return (
    <AuthContext.Provider
      value={{
        loggedInUser,
        setLoggedInUser,
        handleLogin,
        handleLogout,
      }}
    >
      <div className="ps-app">
        <TopBar
          loggedInUser={loggedInUser}
          onLogout={handleLogout}
          onPhotoUploaded={handlePhotoUploaded}
          onToggleSidebar={loggedInUser ? toggleSidebar : undefined}
        />

        <div className="ps-body">
          {loggedInUser && (
            <aside
              className={`ps-sidebar ${
                sidebarOpen ? "ps-sidebar--open" : ""
              }`}
            >
              <div className="ps-panel">
                <UserList
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            </aside>
          )}

          <main className={`${isLoginPage ? "ps-main--auth" : "ps-main"}`}>
            {isLoginPage ? (
                children
            ) : (
                <div className="ps-panel">
                {children}
                </div>
            )}
            </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}