import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Starting demo data creation in Production database...');

    // Create demo company
    const company = await base44.asServiceRole.entities.Company.create({
      name: 'TechSolutions México S.A. de C.V. (Demo)',
      rfc: 'TSM200101ABC',
      industry: 'tecnología',
      address: 'Av. Reforma 123, CDMX',
      phone: '+52 55 1234 5678',
      email: 'contacto@techsolutions.mx',
      status: 'active',
      fiscal_regime: '601'
    });

    console.log('Company created:', company.id);
    const companyId = company.id;

    // Create ONE transaction first to test
    const testTransaction = await base44.asServiceRole.entities.Transaction.create({
      company_id: companyId,
      type: 'ingreso',
      category: 'ventas',
      amount: 150000,
      currency: 'MXN',
      description: 'Venta de software empresarial',
      date: '2026-04-01',
      status: 'confirmed',
      payment_method: 'transferencia'
    });

    console.log('Test transaction created:', testTransaction.id);

    // Create remaining transactions
    const transactions = [
      { company_id: companyId, type: 'ingreso', category: 'servicios', amount: 45000, currency: 'MXN', description: 'Servicios de consultoría TI', date: '2026-04-05', status: 'confirmed', payment_method: 'transferencia' },
      { company_id: companyId, type: 'gasto', expense_type: 'fijo', category: 'nómina', amount: 85000, currency: 'MXN', description: 'Nómina quincenal - Abril', date: '2026-04-15', status: 'confirmed', payment_method: 'transferencia' },
      { company_id: companyId, type: 'gasto', expense_type: 'fijo', category: 'renta', amount: 18000, currency: 'MXN', description: 'Renta de oficinas', date: '2026-04-01', status: 'confirmed', payment_method: 'transferencia' },
      { company_id: companyId, type: 'gasto', expense_type: 'variable', category: 'marketing', amount: 12000, currency: 'MXN', description: 'Campaña Google Ads', date: '2026-04-10', status: 'confirmed', payment_method: 'tarjeta_credito' },
      { company_id: companyId, type: 'ingreso', category: 'ventas', amount: 220000, currency: 'MXN', description: 'Venta de licencias anuales', date: '2026-05-01', status: 'confirmed', payment_method: 'transferencia' },
      { company_id: companyId, type: 'gasto', expense_type: 'variable', category: 'tecnología', amount: 15600, currency: 'MXN', description: 'Servicios AWS y Azure', date: '2026-05-03', status: 'confirmed', payment_method: 'tarjeta_credito' }
    ];

    for (const t of transactions) {
      const created = await base44.asServiceRole.entities.Transaction.create(t);
      console.log('Transaction created:', created.id);
    }

    // Create Employees
    const employees = [
      { company_id: companyId, full_name: 'María González Ramírez', email: 'maria.gonzalez@empresademomx', phone: '+52 55 1111 2222', department: 'Desarrollo', position: 'Senior Developer', employment_type: 'tiempo_completo', status: 'activo', hire_date: '2024-03-15', base_salary: 45000 },
      { company_id: companyId, full_name: 'Carlos Hernández López', email: 'carlos.hernandez@empresademomx', phone: '+52 55 3333 4444', department: 'Ventas', position: 'Gerente Comercial', employment_type: 'tiempo_completo', status: 'activo', hire_date: '2023-08-01', base_salary: 38000 },
      { company_id: companyId, full_name: 'Ana Patricia Morales', email: 'ana.morales@empresademomx', phone: '+52 55 5555 6666', department: 'Administración', position: 'Contadora General', employment_type: 'tiempo_completo', status: 'activo', hire_date: '2022-01-10', base_salary: 42000 }
    ];

    for (const e of employees) {
      const created = await base44.asServiceRole.entities.Employee.create(e);
      console.log('Employee created:', created.id);
    }

    // Create CRM Clients
    const clients = [
      { company_id: companyId, name: 'Grupo Comercial Delta', email: 'contacto@deltacomercial.com', phone: '+52 81 1234 5678', rfc: 'GCD190515ABC', segment: 'premium', industry: 'comercio', assigned_to: 'Carlos Hernández', total_revenue: 450000, status: 'activo' },
      { company_id: companyId, name: 'Innovación Digital SA', email: 'admin@innovaciondigital.mx', phone: '+52 33 9876 5432', rfc: 'IDS200820XYZ', segment: 'recurrente', industry: 'tecnología', assigned_to: 'Carlos Hernández', total_revenue: 280000, status: 'activo' },
      { company_id: companyId, name: 'Distribuidora Central', email: 'contacto@districentral.com', rfc: 'DIC150420JKL', segment: 'premium', industry: 'comercio', assigned_to: 'Carlos Hernández', total_revenue: 680000, status: 'activo' }
    ];

    for (const c of clients) {
      const created = await base44.asServiceRole.entities.CRMClient.create(c);
      console.log('Client created:', created.id);
    }

    // Create CRM Deals
    const deals = [
      { company_id: companyId, client_name: 'Grupo Comercial Delta', title: 'Implementación ERP Empresarial', stage: 'negociacion', amount: 180000, probability: 75, expected_close: '2026-05-30', description: 'Implementación de sistema ERP completo', assigned_to: 'Carlos Hernández' },
      { company_id: companyId, client_name: 'Innovación Digital SA', title: 'Licencias de Software 2026', stage: 'propuesta', amount: 95000, probability: 60, expected_close: '2026-05-20', description: 'Renovación anual de licencias', assigned_to: 'Carlos Hernández' },
      { company_id: companyId, client_name: 'Distribuidora Central', title: 'Sistema de Gestión de Inventarios', stage: 'cerrado_ganado', amount: 220000, probability: 100, expected_close: '2026-04-15', description: 'Implementación de WMS', assigned_to: 'Carlos Hernández' }
    ];

    for (const d of deals) {
      const created = await base44.asServiceRole.entities.CRMDeal.create(d);
      console.log('Deal created:', created.id);
    }

    // Create Projects
    const projects = [
      { company_id: companyId, name: 'Desarrollo Plataforma E-commerce', description: 'Creación de plataforma e-commerce', status: 'en_curso', priority: 'alta', owner: 'María González', start_date: '2026-03-01', end_date: '2026-06-30', budget: 250000, spent: 125000, progress: 50, tags: ['desarrollo', 'e-commerce'] },
      { company_id: companyId, name: 'Migración a la Nube', description: 'Migración de infraestructura a AWS', status: 'en_curso', priority: 'critica', owner: 'María González', start_date: '2026-04-01', end_date: '2026-05-31', budget: 80000, spent: 45000, progress: 65, tags: ['infraestructura', 'cloud'] }
    ];

    for (const p of projects) {
      const created = await base44.asServiceRole.entities.Project.create(p);
      console.log('Project created:', created.id);
    }

    // Create KPIs
    const kpis = [
      { company_id: companyId, name: 'Ingresos Mensuales', category: 'financiero', target: 200000, current: 220000, unit: 'MXN', frequency: 'mensual', status: 'alcanzado', owner: 'Ana Patricia Morales' },
      { company_id: companyId, name: 'Margen de Utilidad', category: 'financiero', target: 35, current: 38, unit: '%', frequency: 'mensual', status: 'alcanzado', owner: 'Ana Patricia Morales' },
      { company_id: companyId, name: 'Tasa de Cierre de Ventas', category: 'comercial', target: 60, current: 55, unit: '%', frequency: 'mensual', status: 'en_curso', owner: 'Carlos Hernández' }
    ];

    for (const k of kpis) {
      const created = await base44.asServiceRole.entities.KPI.create(k);
      console.log('KPI created:', created.id);
    }

    // Create CompanyMember for the current user to access this company
    try {
      await base44.asServiceRole.entities.CompanyMember.create({
        company_id: companyId,
        user_email: user.email,
        user_name: user.full_name,
        role: 'director',
        status: 'active'
      });
      console.log('CompanyMember created for user:', user.email);
    } catch (memberError) {
      console.log('CompanyMember already exists or error:', memberError.message);
    }

    return Response.json({ 
      success: true, 
      message: 'Datos demo creados exitosamente. Empresa: TechSolutions México (Demo)',
      companyId: companyId
    });
  } catch (error) {
    console.error('Error creating demo data:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});