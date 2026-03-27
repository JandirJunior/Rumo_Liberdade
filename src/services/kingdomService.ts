import { db, auth } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, query, where, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Kingdom, KingdomMember, KingdomInvite, KingdomRole } from '@/types';
import { logActivity } from '@/lib/auditLogger';

export const kingdomService = {
  async createKingdom(name: string, ownerId: string): Promise<Kingdom> {
    const kingdomRef = doc(collection(db, 'kingdoms'));
    const inviteCode = `KNG-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newKingdom: Kingdom = {
      id: kingdomRef.id,
      name,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      invite_code: inviteCode
    };

    await setDoc(kingdomRef, newKingdom);

    // Add owner as admin
    await this.addMember(newKingdom.id, ownerId, 'admin');

    return newKingdom;
  },

  async getKingdom(kingdomId: string): Promise<Kingdom | null> {
    const docRef = doc(db, 'kingdoms', kingdomId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Kingdom;
    }
    return null;
  },

  async getUserKingdoms(userId: string): Promise<Kingdom[]> {
    const membersRef = collection(db, 'kingdom_members');
    const q = query(membersRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];

    const kingdomIds = snapshot.docs.map(doc => doc.data().kingdom_id);
    
    // Fetch kingdoms
    const kingdoms: Kingdom[] = [];
    for (const id of kingdomIds) {
      const k = await this.getKingdom(id);
      if (k) kingdoms.push(k);
    }
    
    return kingdoms;
  },

  async getKingdomByInviteCode(inviteCode: string): Promise<Kingdom | null> {
    const kingdomsRef = collection(db, 'kingdoms');
    const q = query(kingdomsRef, where('invite_code', '==', inviteCode));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Kingdom;
    }
    return null;
  },

  async addMember(kingdomId: string, userId: string, role: KingdomRole): Promise<KingdomMember> {
    const memberId = `${userId}_${kingdomId}`;
    const memberRef = doc(db, 'kingdom_members', memberId);
    const newMember: KingdomMember = {
      id: memberId,
      kingdom_id: kingdomId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    await setDoc(memberRef, newMember);
    
    if (auth.currentUser) {
      await logActivity(kingdomId, auth.currentUser.uid, 'USER_JOINED', userId, { role });
    }
    
    return newMember;
  },

  async removeMember(memberId: string): Promise<void> {
    const memberRef = doc(db, 'kingdom_members', memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const memberData = memberSnap.data() as KingdomMember;
      await deleteDoc(memberRef);
      if (auth.currentUser) {
        await logActivity(memberData.kingdom_id, auth.currentUser.uid, 'USER_LEFT', memberData.user_id, { removed_member_id: memberId });
      }
    }
  },

  async updateMemberRole(memberId: string, role: KingdomRole): Promise<void> {
    const memberRef = doc(db, 'kingdom_members', memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const memberData = memberSnap.data() as KingdomMember;
      await updateDoc(memberRef, { role });
      if (auth.currentUser) {
        await logActivity(memberData.kingdom_id, auth.currentUser.uid, 'ROLE_UPDATED', memberData.user_id, { new_role: role });
      }
    }
  },

  async getKingdomMembers(kingdomId: string): Promise<KingdomMember[]> {
    const membersRef = collection(db, 'kingdom_members');
    const q = query(membersRef, where('kingdom_id', '==', kingdomId));
    const snapshot = await getDocs(q);
    
    const members = snapshot.docs.map(doc => doc.data() as KingdomMember);
    
    // Fetch user details (name, email) for each member
    for (const member of members) {
      const userDoc = await getDoc(doc(db, 'users', member.user_id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        member.user_name = userData.name || userData.displayName;
        member.user_email = userData.email;
      }
    }
    
    return members;
  },

  async createInvite(kingdomId: string, email: string, role: KingdomRole, invitedBy: string): Promise<KingdomInvite> {
    const inviteRef = doc(collection(db, 'kingdom_invites'));
    const newInvite: KingdomInvite = {
      id: inviteRef.id,
      kingdom_id: kingdomId,
      email,
      role,
      status: 'pending',
      invited_by: invitedBy,
      created_at: new Date().toISOString()
    };
    await setDoc(inviteRef, newInvite);
    
    if (auth.currentUser) {
      await logActivity(kingdomId, auth.currentUser.uid, 'INVITE_SENT', inviteRef.id, { email, role });
    }
    
    return newInvite;
  },

  async getUserInvites(email: string): Promise<KingdomInvite[]> {
    const invitesRef = collection(db, 'kingdom_invites');
    const q = query(invitesRef, where('email', '==', email), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    const invites = snapshot.docs.map(doc => doc.data() as KingdomInvite);
    
    for (const invite of invites) {
      const k = await this.getKingdom(invite.kingdom_id);
      if (k) invite.kingdom_name = k.name;
    }
    
    return invites;
  },

  async updateInviteStatus(inviteId: string, status: 'accepted' | 'rejected'): Promise<void> {
    await updateDoc(doc(db, 'kingdom_invites', inviteId), { status });
  },

  async acceptInvite(inviteId: string, userId: string): Promise<void> {
    const inviteRef = doc(db, 'kingdom_invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invite not found');
    
    const inviteData = inviteSnap.data() as KingdomInvite;
    
    // Update invite status
    await this.updateInviteStatus(inviteId, 'accepted');
    
    // Add member to kingdom
    await this.addMember(inviteData.kingdom_id, userId, inviteData.role);
  },

  async rejectInvite(inviteId: string): Promise<void> {
    await this.updateInviteStatus(inviteId, 'rejected');
  },

  async deleteKingdom(kingdomId: string): Promise<void> {
    // 1. Delete all invites first (requires isAdmin, which requires member doc to exist)
    const invitesRef = collection(db, 'kingdom_invites');
    const qInvites = query(invitesRef, where('kingdom_id', '==', kingdomId));
    const invitesSnap = await getDocs(qInvites);
    for (const inviteDoc of invitesSnap.docs) {
      await deleteDoc(doc(db, 'kingdom_invites', inviteDoc.id));
    }

    // 2. Delete all members
    const membersRef = collection(db, 'kingdom_members');
    const qMembers = query(membersRef, where('kingdom_id', '==', kingdomId));
    const membersSnap = await getDocs(qMembers);
    for (const memberDoc of membersSnap.docs) {
      await deleteDoc(doc(db, 'kingdom_members', memberDoc.id));
    }

    // 3. Delete the kingdom itself
    await deleteDoc(doc(db, 'kingdoms', kingdomId));
  },

  async getAllKingdoms(): Promise<(Kingdom & { owner_name?: string; owner_email?: string; last_activity_at?: string })[]> {
    const kingdomsRef = collection(db, 'kingdoms');
    const snapshot = await getDocs(kingdomsRef);
    const kingdoms = snapshot.docs.map(doc => doc.data() as Kingdom & { owner_name?: string; owner_email?: string; last_activity_at?: string });
    
    for (const kingdom of kingdoms) {
      // Fetch owner details
      if (kingdom.owner_id) {
        try {
          const userDoc = await getDoc(doc(db, 'users', kingdom.owner_id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            kingdom.owner_name = userData.name || userData.displayName || 'Desconhecido';
            kingdom.owner_email = userData.email || 'Desconhecido';
          }
        } catch (e) {
          console.error('Error fetching user for kingdom:', e);
        }
      }

      // Fetch last activity
      try {
        const logsRef = collection(db, 'activity_logs');
        const q = query(
          logsRef, 
          where('kingdom_id', '==', kingdom.id),
          // We can't easily order by created_at without a composite index for every kingdom
          // But we can just get the most recent one if we have an index on [kingdom_id, created_at]
          // For now, let's just try to get any log and see if we can find the max created_at
        );
        const logsSnap = await getDocs(q);
        if (!logsSnap.empty) {
          const dates = logsSnap.docs.map(d => d.data().created_at).filter(Boolean);
          if (dates.length > 0) {
            kingdom.last_activity_at = dates.sort().reverse()[0];
          }
        }
      } catch (e) {
        console.error('Error fetching last activity for kingdom:', e);
      }
    }
    
    return kingdoms;
  }
};
