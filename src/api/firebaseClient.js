import { db, auth } from '@/firebase';
export { auth, db, storage } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

const firestoreCollections = {
  Company: 'companies',
  CompanyMember: 'company_members',
  Transaction: 'transactions',
  Document: 'documents',
  AuditLog: 'audit_logs',
  CRMClient: 'crm_clients',
  CRMInteraction: 'crm_interactions',
  KPI: 'kpis',
  Subscription: 'subscriptions',
  PredictionLog: 'prediction_logs',
  AIConversation: 'ai_conversations',
  Project: 'projects',
};

export const firebase = {
  entities: {},
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        console.log('InvokeLLM called with:', params);
        return { predictions: [], methodology: '', trend: 'estable' };
      },
      UploadFile: async ({ file }) => {
        console.log('File upload:', file.name);
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },
  auth: {
    me: async () => {
      if (auth.currentUser) {
        return {
          id: auth.currentUser.uid,
          email: auth.currentUser.email,
          full_name: auth.currentUser.displayName,
          role: 'user',
        };
      }
      return null;
    },
    logout: async (redirectUrl) => {
      await auth.signOut();
      if (redirectUrl) window.location.href = redirectUrl;
    },
  },
};

Object.keys(firestoreCollections).forEach((entityName) => {
  const collectionName = firestoreCollections[entityName];

  firebase.entities[entityName] = {
    list: async () => {
      const q = collection(db, collectionName);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },

    filter: async (filters = {}, orderByField = null, limitCount = null) => {
      let q = collection(db, collectionName);
      const conditions = [];

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null) {
          conditions.push(where(key, '==', filters[key]));
        }
      });

      const queryConstraints = [...conditions];

      if (orderByField) {
        const direction = orderByField.startsWith('-') ? 'desc' : 'asc';
        const field = orderByField.replace(/^-/, '');
        queryConstraints.push(orderBy(field, direction));
      }

      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      if (queryConstraints.length > 0) {
        q = query(q, ...queryConstraints);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },

    get: async (id) => {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    create: async (data) => {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { id: docRef.id, ...data };
    },

    update: async (id, data) => {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString(),
      });
      return { id, ...data };
    },

    delete: async (id) => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return { id };
    },
  };
});

export default firebase;