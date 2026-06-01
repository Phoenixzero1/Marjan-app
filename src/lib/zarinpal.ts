import axios from "axios";

const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const MERCHANT = process.env.ZARINPAL_MERCHANT_ID ?? "";
const BASE_URL = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://api.zarinpal.com/pg/v4/payment";
const GATE_URL = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://www.zarinpal.com/pg/StartPay";

export interface ZarinpalRequestResult {
  success: boolean;
  authority?: string;
  paymentUrl?: string;
  error?: string;
}

export interface ZarinpalVerifyResult {
  success: boolean;
  refId?: string;
  cardHash?: string;
  error?: string;
}

export async function requestPayment(
  amount: number,
  description: string,
  callbackUrl: string,
  mobile?: string,
  email?: string
): Promise<ZarinpalRequestResult> {
  try {
    const res = await axios.post(`${BASE_URL}/request.json`, {
      merchant_id: MERCHANT,
      amount,
      description,
      callback_url: callbackUrl,
      metadata: { mobile, email },
    });

    const data = res.data;
    if (data.data?.code === 100 && data.data?.authority) {
      return {
        success: true,
        authority: data.data.authority,
        paymentUrl: `${GATE_URL}/${data.data.authority}`,
      };
    }
    return { success: false, error: `Code: ${data.data?.code}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function verifyPayment(
  amount: number,
  authority: string
): Promise<ZarinpalVerifyResult> {
  try {
    const res = await axios.post(`${BASE_URL}/verify.json`, {
      merchant_id: MERCHANT,
      amount,
      authority,
    });

    const data = res.data;
    if (data.data?.code === 100 || data.data?.code === 101) {
      return {
        success: true,
        refId: String(data.data.ref_id),
        cardHash: data.data.card_hash,
      };
    }
    return { success: false, error: `Code: ${data.data?.code}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
