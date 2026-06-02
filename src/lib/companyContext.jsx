import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setActiveCompany(null);
      setMemberships([]);
      setLoading(false);
      return;
    }

    loadCompanies();
  }, [user]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const allMembers = await firebase.entities.CompanyMember.list();
      const members = allMembers.filter(m => m.user_email === user.email && m.status === 'active');
      setMemberships(members);
      
      if (members && members.length > 0) {
        const companyIds = members.map(m => m.company_id).filter(Boolean);
        if (companyIds.length > 0) {
          const allCompanies = await firebase.entities.Company.list();
          const validCompanies = allCompanies.filter(c => companyIds.includes(c.id));
          setCompanies(validCompanies);
          
          const savedId = localStorage.getItem('gemailla_active_company');
          const saved = validCompanies.find(c => c.id === savedId);
          setActiveCompany(saved || validCompanies[0] || null);
        } else {
          setCompanies([]);
          setActiveCompany(null);
        }
      } else {
        setCompanies([]);
        setActiveCompany(null);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
      setActiveCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (company) => {
    setActiveCompany(company);
    localStorage.setItem('gemailla_active_company', company.id);
  };

  const getUserRole = () => {
    if (!activeCompany || !user) return null;
    const membership = memberships.find(m => m.company_id === activeCompany.id);
    return membership?.role || null;
  };

  return (
    <CompanyContext.Provider value={{
      companies, activeCompany, switchCompany, loading,
      memberships, getUserRole, reloadCompanies: loadCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}