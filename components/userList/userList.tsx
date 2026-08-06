"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from "@mui/material";

import axios from "axios";
import "./userList.css";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
}

interface UserListProps {
  onNavigate?: () => void;
}

export default function UserList({ onNavigate }: UserListProps) {
  const pathname = usePathname();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/user/list")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  useEffect(() => {
    const match = pathname?.match(/\/users\/(\w+)/);

    const userId = match ? match[1] : null;

    setSelectedUserId(userId);
  }, [pathname]);

  return (
    <div>
      <List component="nav">
        {users.map((user) => (
          <div key={user._id}>
            <ListItem>
              <ListItemButton
                component={Link}
                href={`/users/${user._id}`}
                selected={selectedUserId === user._id}
                onClick={() => {
                  setSelectedUserId(user._id);
                  onNavigate?.();
                }}
              >
                <ListItemText
                  primary={`${user.first_name} ${user.last_name}`}
                />
              </ListItemButton>
            </ListItem>

            <Divider />
          </div>
        ))}
      </List>
    </div>
  );
}