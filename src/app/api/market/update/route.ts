import { NextResponse } from 'next/server';
import { marketDataService } from '@/services/marketDataService';

export async function POST(request: Request) {
  try {
    const result = await marketDataService.updateMarketData();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      // Determine status code based on message
      let status = 500;
      if (result.message.includes('disabled') || result.message.includes('limit reached')) {
        status = 429; // Too Many Requests or Forbidden
      }
      return NextResponse.json({ error: result.message }, { status });
    }
  } catch (error) {
    console.error('Erro ao atualizar dados de mercado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
