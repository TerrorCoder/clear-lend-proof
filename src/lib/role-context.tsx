import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "Borrower" | "Lender" | "Auditor";
export const ROLES: Role[] = ["Borrower", "Lender", "Auditor"];

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "Borrower",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Borrower");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
