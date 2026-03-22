// src/middleware/permissionEngine.ts
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Role = "Admin" | "Member" | "Viewer";

export async function validatePermission(
  kingdomId: string,
  requiredRole: Role
): Promise<boolean> {
  const user = getAuth().currentUser;
  if (!user) return false;

  const ref = doc(db, "kingdoms", kingdomId, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const role = snap.data().role as Role;
  const hierarchy: Role[] = ["Viewer", "Member", "Admin"];

  return hierarchy.indexOf(role) >= hierarchy.indexOf(requiredRole);
}
