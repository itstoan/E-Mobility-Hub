import type { User } from "../../types/domain";
import { mockUsers } from "./users";

const demoPasswords: Readonly<Record<string, string>> = {
  "ST-01": "demo-student-a",
  "ST-02": "demo-student-b",
  "OP-01": "demo-operator",
};

export function authenticateMockUser(email: string, password: string): User | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || demoPasswords[user.id] !== password) return null;
  return { ...user }; // Không bao gồm password, trả bản sao
}