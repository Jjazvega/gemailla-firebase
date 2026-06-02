import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { alerts, company_id, company_name, channels, recipient_email, recipient_phone } = await req.json();

    if (!alerts?.length) return Response.json({ sent: false, reason: 'No alerts' });
    if (!company_id) return Response.json({ error: 'company_id is required' }, { status: 400 });

    // Verify user belongs to the company
    const memberships = await base44.entities.CompanyMember.filter({
      company_id,
      user_email: user.email,
      status: 'active'
    });
    if (!memberships.length) {
      return Response.json({ error: 'Unauthorized: User does not belong to this company' }, { status: 403 });
    }

    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    const warningAlerts = alerts.filter(a => a.level === 'warning');

    // Build plain-text summary for WhatsApp
    const buildWhatsappText = () => {
      let text = `⚡ *GEMAILLA AI — Alerta Financiera*\n📅 ${new Date().toLocaleDateString('es-MX')}\n🏢 *${company_name}*\n\n`;

      if (criticalAlerts.length) {
        text += `🔴 *ALERTAS CRÍTICAS (${criticalAlerts.length}):*\n`;
        criticalAlerts.forEach(a => { text += `• *${a.title}*: ${a.message}\n`; });
        text += '\n';
      }

      if (warningAlerts.length) {
        text += `🟡 *ADVERTENCIAS (${warningAlerts.length}):*\n`;
        warningAlerts.forEach(a => { text += `• *${a.title}*: ${a.message}\n`; });
        text += '\n';
      }

      text += `💡 Ingresa a GEMAILLA AI para ver el análisis completo y las recomendaciones.\n\n_Este es un mensaje automático del sistema de alertas predictivas GEMAILLA._`;
      return text;
    };

    // Build HTML email
    const buildEmailHTML = () => {
      const rows = alerts.map(a => {
        const color = a.level === 'critical' ? '#ef4444' : a.level === 'warning' ? '#f59e0b' : '#6b7280';
        const icon = a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟡' : '🔵';
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1f1f1f;">
              <span style="font-size: 16px;">${icon}</span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1f1f1f;">
              <p style="margin:0; font-weight: 600; color: ${color}; font-size: 14px;">${a.title}</p>
              <p style="margin:4px 0 0; color: #9ca3af; font-size: 13px;">${a.message}</p>
              ${a.detail ? `<p style="margin:4px 0 0; color: #6b7280; font-size: 12px;">${a.detail}</p>` : ''}
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1f1f1f; text-align: right; white-space: nowrap;">
              <span style="color: ${color}; font-weight: 700; font-size: 14px;">${a.value || ''}</span>
            </td>
          </tr>`;
      }).join('');

      return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background: #0a0a0a; color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(90deg, #c9972d 0%, #f0bb5f 100%); padding: 24px 32px;">
        <p style="margin: 0; color: #0a0a0a; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">GEMAILLA AI</p>
        <h1 style="margin: 8px 0 0; color: #0a0a0a; font-size: 22px; font-weight: 700;">⚡ Alerta Financiera Predictiva</h1>
        <p style="margin: 4px 0 0; color: #3a2800; font-size: 13px;">${company_name} · ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <!-- Summary badges -->
      <div style="padding: 20px 32px; display: flex; gap: 12px; border-bottom: 1px solid #1f1f1f;">
        ${criticalAlerts.length ? `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;">🔴 ${criticalAlerts.length} Crítica${criticalAlerts.length > 1 ? 's' : ''}</span>` : ''}
        ${warningAlerts.length ? `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;">🟡 ${warningAlerts.length} Advertencia${warningAlerts.length > 1 ? 's' : ''}</span>` : ''}
      </div>

      <!-- Alerts table -->
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>

      <!-- CTA -->
      <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1f1f1f;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px;">Revisa el análisis completo y las recomendaciones en tu dashboard.</p>
        <a href="#" style="background: linear-gradient(90deg, #c9972d, #f0bb5f); color: #0a0a0a; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Ver Dashboard Financiero →</a>
      </div>

      <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #1f1f1f;">
        <p style="color: #4b5563; font-size: 11px; margin: 0;">Este mensaje fue generado automáticamente por el sistema de alertas predictivas de GEMAILLA AI.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    };

    const results = {};

    // Send Email
    if (channels?.includes('email') && recipient_email) {
      const critCount = criticalAlerts.length;
      const warnCount = warningAlerts.length;
      const subject = critCount > 0
        ? `🔴 ${critCount} Alerta${critCount > 1 ? 's' : ''} Crítica${critCount > 1 ? 's' : ''} — ${company_name}`
        : `🟡 ${warnCount} Advertencia${warnCount > 1 ? 's' : ''} Financiera${warnCount > 1 ? 's' : ''} — ${company_name}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient_email,
        subject,
        body: buildEmailHTML(),
        from_name: 'GEMAILLA AI',
      });
      results.email = 'sent';
    }

    // WhatsApp via wa.me link (stored in response, frontend opens it)
    // For direct WhatsApp API: would need Twilio/Meta secret
    if (channels?.includes('whatsapp') && recipient_phone) {
      const text = buildWhatsappText();
      const encoded = encodeURIComponent(text);
      const phone = recipient_phone.replace(/\D/g, '');
      results.whatsapp_url = `https://wa.me/${phone}?text=${encoded}`;
      results.whatsapp_text = text;
    }

    return Response.json({ sent: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});