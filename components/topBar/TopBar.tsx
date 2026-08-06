"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { AuthContext } from "@/components/AuthContext";

import "./TopBar.css";

interface User {
  _id: string;
  login_name: string;
  first_name: string;
  last_name: string;
}

interface TopBarProps {
  loggedInUser: User | null;
  onLogout?: () => void;
  onPhotoUploaded?: () => void;
  onToggleSidebar?: () => void;
}

export default function TopBar({
  loggedInUser,
  onLogout,
  onPhotoUploaded,
  onToggleSidebar,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [contextText, setContextText] = useState("");
  const [loadingContext, setLoadingContext] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  

  useEffect(() => {
    updateContext();
  }, [pathname]);

  const updateContext = async () => {
  if (
    pathname?.includes("/users/") ||
    pathname?.includes("/photos/")
  ) {
    const userId = pathname.split("/").pop();

    if (!userId) {
      setContextText("");
      return;
    }

    setLoadingContext(true);

    try {
      const response = await axios.get(`/api/user/${userId}`);

      const user = response.data;

      const prefix = pathname.includes("/photos/")
        ? "Photos of "
        : "Details of ";

      setContextText(
        `${prefix}${user.first_name} ${user.last_name}`
      );
    } catch {
      setContextText("");
    } finally {
      setLoadingContext(false);
    }
  } else {
    setContextText("");
    setLoadingContext(false);
  }
};

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("uploadedphoto", file);

    try {
      await axios.post("/api/photos/new", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      onPhotoUploaded?.();

      if (loggedInUser) {
        router.push(`/photos/${loggedInUser._id}`);
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
    } finally {
      event.target.value = "";
    }
  };
  

  return (
    <header className="ps-topbar">
      <div className="ps-topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="ps-hamburger"
            aria-label="Toggle user list"
            onClick={onToggleSidebar}
          >
            <span />
            <span />
            <span />
          </button>
        )}

        <span className="ps-topbar-title">
          PhotoApp
        </span>
      </div>

      <div className="ps-topbar-context">
        {loadingContext ? "\u00A0" : contextText}
      </div>
      <div className="ps-topbar-right">
        {loggedInUser ? (
          <>
            <span className="ps-topbar-greeting">
              Hi {loggedInUser.first_name}
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoSelected}
            />

            <button
              type="button"
              className="ps-btn"
              onClick={handleAddPhotoClick}
            >
              Add Photo
            </button>

            <button
              type="button"
              className="ps-btn"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <span className="ps-topbar-greeting">
            Please Login
          </span>
        )}
      </div>
    </header>
  );
}