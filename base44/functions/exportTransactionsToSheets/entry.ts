import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, spreadsheet_id } = await req.json();

    if (!company_id || !spreadsheet_id) {
      return Response.json(
        { error: 'company_id y spreadsheet_id son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a la empresa
    const memberCheck = await base44.entities.CompanyMember.filter({
      company_id,
      user_email: user.email,
      status: 'active'
    });

    if (memberCheck.length === 0) {
      return Response.json(
        { error: 'No tienes acceso a esta empresa' },
        { status: 403 }
      );
    }

    // Obtener transacciones de la empresa
    const transactions = await base44.entities.Transaction.filter({
      company_id,
      status: 'confirmed'
    });

    // Obtener conexión de Google Sheets del usuario
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('googlesheets-contabilidad');

    // Preparar datos para la hoja
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Moneda', 'Estado', 'Método de Pago'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'ingreso' ? 'Ingreso' : 'Gasto',
      t.category,
      t.description || '',
      t.amount,
      t.currency || 'MXN',
      t.status,
      t.payment_method || ''
    ]);

    // Crear/actualizar hoja en Google Sheets
    const sheetName = `Transacciones ${new Date().toLocaleDateString('es-MX')}`;
    
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [headers, ...rows]
        })
      }
    );

    if (!appendResponse.ok) {
      const error = await appendResponse.json();
      throw new Error(`Google Sheets API error: ${error.error.message}`);
    }

    const result = await appendResponse.json();

    return Response.json({
      success: true,
      message: `${transactions.length} transacciones exportadas a Google Sheets`,
      updates: result.updates
    });
  } catch (error) {
    console.error('Error en exportTransactionsToSheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});