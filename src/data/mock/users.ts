import type { User } from "../../types/domain";

export const mockUsers: User[] = [
  { id: "ST-01", displayName: "Demo Student A", email: "student.a@example.test", role: "student" },
  { id: "ST-02", displayName: "Demo Student B", email: "student.b@example.test", role: "student" },
  { id: "OP-01", displayName: "Demo Operator", email: "operator@example.test", role: "system_operator" },
];