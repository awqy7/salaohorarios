import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  const { payment_id, appointment_id } = event.queryStringParameters || {};

  if (!payment_id || !appointment_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Parâmetros payment_id e appointment_id são obrigatórios.' }),
    };
  }

  try {
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;

    // Se for um pagamento simulado ou se o token não estiver configurado
    if (payment_id.startsWith('simulated_') || !mpAccessToken) {
      // Retorna aprovado se for simulado para facilitar testes locais
      if (supabase && !payment_id.startsWith('simulated_')) {
        // Se houver supabase, verifica se o agendamento já foi atualizado pelo webhook
        const { data } = await supabase
          .from('appointments')
          .select('paid, status')
          .eq('id', appointment_id)
          .single();
        
        if (data && data.paid) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ approved: true, status: 'approved' }),
          };
        }
      }

      // Simulação padrão: se for simulado, aprova
      if (supabase) {
        await supabase
          .from('appointments')
          .update({ paid: true, status: 'confirmed' })
          .eq('id', appointment_id);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ approved: true, status: 'approved', simulated: true }),
      };
    }

    // Consulta real no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpResponse.ok) {
      console.error(`Erro ao consultar pagamento ${payment_id}:`, await mpResponse.text());
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Não foi possível verificar o pagamento junto ao Mercado Pago.' }),
      };
    }

    const paymentData = await mpResponse.json();
    const isApproved = paymentData.status === 'approved';

    if (isApproved && supabase) {
      // Atualiza o agendamento no Supabase
      const { error } = await supabase
        .from('appointments')
        .update({ paid: true, status: 'confirmed' })
        .eq('id', appointment_id);

      if (error) {
        console.error('Erro ao atualizar agendamento no Supabase:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        approved: isApproved,
        status: paymentData.status,
      }),
    };
  } catch (error: any) {
    console.error('Erro no handler check-payment:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Erro interno.' }),
    };
  }
};
