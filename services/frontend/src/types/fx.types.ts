// Currency exchange types
export interface ConvertRequest {
  from_currency: string;
  to_currency: string;
  amount: number;
}

export interface ConvertResponse {
  from_currency: string;
  to_currency: string;
  original_amount: number;
  converted_amount: number;
  rate: number;
  provider: string;
  from_cache: boolean;
  timestamp: string;
}

export interface ExchangeRateRequest {
  from_currency: string;
  to_currency: string;
}

export interface ExchangeRateResponse {
  from_currency: string;
  to_currency: string;
  rate: number;
  provider: string;
  from_cache: boolean;
  timestamp: string;
}

export interface GetRatesRequest {
  base_currency: string;
  target_currencies: string[];
}

export interface GetRatesResponse {
  base_currency: string;
  rates: Record<string, number>;
  provider: string;
  from_cache: boolean;
  timestamp: string;
}
