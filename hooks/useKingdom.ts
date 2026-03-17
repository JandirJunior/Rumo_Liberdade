import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Kingdom, KingdomMember, KingdomInvite, KingdomRole } from '@/lib/types';
import { kingdomService } from '@/src/services/kingdomService';

export function useKingdom() {
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeMembers: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setKingdom(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const kingdoms = await kingdomService.getUserKingdoms(user.uid);
        
        if (kingdoms.length > 0) {
          const currentKingdom = kingdoms[0];
          setKingdom(currentKingdom);
          
          const membersRef = collection(db, 'kingdom_members');
          const q = query(membersRef, where('kingdom_id', '==', currentKingdom.id), where('user_id', '==', user.uid));
          
          unsubscribeMembers = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              setRole(snapshot.docs[0].data().role as KingdomRole);
            }
            setLoading(false);
          });
        } else {
          const newKingdom = await kingdomService.createKingdom(`Reino de ${user.displayName || 'Herói'}`, user.uid);
          setKingdom(newKingdom);
          setRole('admin');
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading kingdom:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, []);

  const joinKingdomByCode = async (code: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    const kingdomToJoin = await kingdomService.getKingdomByInviteCode(code);
    if (!kingdomToJoin) throw new Error('Reino não encontrado');
    
    // Check if user is already a member
    const members = await kingdomService.getKingdomMembers(kingdomToJoin.id);
    if (members.some(m => m.user_id === auth.currentUser!.uid)) {
      throw new Error('Você já é membro deste Reino');
    }

    await kingdomService.addMember(kingdomToJoin.id, auth.currentUser.uid, 'viewer');
    
    // Refresh kingdom state
    setKingdom(kingdomToJoin);
    setRole('viewer');
    return kingdomToJoin;
  };

  return { kingdom, role, loading, joinKingdomByCode };
}

export function useKingdomMembers(kingdomId: string | undefined) {
  const [members, setMembers] = useState<KingdomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kingdomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([]);
      setLoading(false);
      return;
    }

    const membersRef = collection(db, 'kingdom_members');
    const q = query(membersRef, where('kingdom_id', '==', kingdomId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedMembers = snapshot.docs.map(doc => doc.data() as KingdomMember);
      
      // Fetch user details for each member
      for (const member of loadedMembers) {
        const userDoc = await kingdomService.getKingdomMembers(kingdomId);
        const found = userDoc.find(u => u.user_id === member.user_id);
        if (found) {
          member.user_name = found.user_name;
          member.user_email = found.user_email;
        }
      }
      
      setMembers(loadedMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [kingdomId]);

  return { members, loading };
}

export function useKingdomInvites(email: string | undefined) {
  const [invites, setInvites] = useState<KingdomInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvites([]);
      setLoading(false);
      return;
    }

    const invitesRef = collection(db, 'kingdom_invites');
    const q = query(invitesRef, where('email', '==', email), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedInvites = snapshot.docs.map(doc => doc.data() as KingdomInvite);
      
      for (const invite of loadedInvites) {
        const k = await kingdomService.getKingdom(invite.kingdom_id);
        if (k) invite.kingdom_name = k.name;
      }
      
      setInvites(loadedInvites);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [email]);

  return { invites, loading };
}
