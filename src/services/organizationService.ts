import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Organization } from '../../lib/types';
import { logService } from './logService';

export const organizationService = {
  async createOrganization(orgId: string, name: string, userId: string): Promise<Organization> {
    const orgRef = doc(db, 'organizations', orgId);
    const newOrg: Organization = {
      orgId,
      name,
      plan: 'basic',
      maxUsers: 1,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    await setDoc(orgRef, {
      ...newOrg,
      createdAt: serverTimestamp()
    });

    await logService.createLog(orgId, userId, 'CREATE_ORGANIZATION', { name, plan: 'basic' });
    return newOrg;
  },

  async getOrganization(orgId: string): Promise<Organization | null> {
    const orgRef = doc(db, 'organizations', orgId);
    const snap = await getDoc(orgRef);
    if (snap.exists()) {
      return snap.data() as Organization;
    }
    return null;
  }
};
