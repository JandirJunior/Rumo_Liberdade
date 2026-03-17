import { db } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, where, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Kingdom, KingdomMember, KingdomInvite, KingdomRole } from '@/lib/types';

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
    const memberRef = doc(collection(db, 'kingdom_members'));
    const newMember: KingdomMember = {
      id: memberRef.id,
      kingdom_id: kingdomId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    await setDoc(memberRef, newMember);
    return newMember;
  },

  async removeMember(memberId: string): Promise<void> {
    await deleteDoc(doc(db, 'kingdom_members', memberId));
  },

  async updateMemberRole(memberId: string, role: KingdomRole): Promise<void> {
    await updateDoc(doc(db, 'kingdom_members', memberId), { role });
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
  }
};
