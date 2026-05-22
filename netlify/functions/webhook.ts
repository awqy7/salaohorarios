import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (_) {
      // Ignora erro de parsing se for urlencoded
    }

    // O Mercado Pago envia notificações por Webhook ou IPN
    // O ID do pagamento pode vir no body.data.id ou via query string
    const paymentId = body.data?.id || event.queryStringParameters?.id || body.resource?.split('/').pop();
    const type = body.type || event.queryStringParameters?.topic || body.topic;

    console.log('Webhook do Mercado Pago recebido:', { paymentId, type, body, query: event.queryStringParameters });

    // Verificamos se a notificação é de fato sobre um pagamento
    if (paymentId && (type === 'payment' || !type)) {
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.warn('MP_ACCESS_TOKEN não configurado no webhook. Ignorando.');
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, warning: 'sem_token' }) };
      }

      // Consulta os detalhes do pagamento no Mercado Pago para garantir autenticidade
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
        },
      });

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();
        const appointmentId = paymentData.external_reference;
        const isApproved = paymentData.status === 'approved';

        console.log(`Pagamento MP ${paymentId}: status = ${paymentData.status}, ref = ${appointmentId}`);

        if (isApproved && appointmentId && supabase) {
          // Atualiza o agendamento no Supabase
          const { error } = await supabase
            .from('appointments')
            .update({ paid: true, status: 'confirmed' })
            .eq('id', appointmentId);

          if (error) {
            console.error('Erro ao atualizar agendamento via Webhook:', error);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Erro ao atualizar agendamento no Supabase.' }),
            };
          }
          console.log(`Agendamento ${appointmentId} atualizado com SUCESSO via Webhook.`);
        }
      } else {
        console.error(`Erro ao consultar pagamento ${paymentId} no MP:`, await mpResponse.text());
      }
    }

    // O Mercado Pago exige que retornemos status 200 (ou 201) rapidamente
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Erro no handler webhook:', error);
    return {
      statusCode: 200, // Mesmo em caso de erro interno, retornamos 200 para o MP parar de reenviar a notificação repetidamente
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
