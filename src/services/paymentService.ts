import { OrderService } from './orderService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  onSuccess: (response: RazorpayResponse) => void;
  onError: (error: any) => void;
}

export class PaymentService {
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }

  static async openRazorpayCheckout(options: PaymentOptions): Promise<void> {
    console.log('Opening Razorpay checkout with options:', options);
    
    try {
      const scriptLoaded = await this.loadRazorpayScript();
      
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: options.amount * 100, // Convert to paise
        currency: options.currency,
        name: options.name,
        description: options.description,
        order_id: options.orderId,
        handler: async (response: RazorpayResponse) => {
          console.log('Razorpay payment success:', response);
          
          try {
            // Update order with payment details
            await OrderService.updateOrderPayment(options.orderId, {
              payment_status: 'completed',
              order_status: 'confirmed',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id
            });
            
            options.onSuccess(response);
          } catch (error) {
            console.error('Error updating order after payment:', error);
            options.onError(error);
          }
        },
        prefill: options.prefill,
        theme: {
          color: '#F97316' // Orange color matching the theme
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay checkout dismissed');
            options.onError(new Error('Payment cancelled by user'));
          }
        }
      };

      console.log('Creating Razorpay instance with options:', razorpayOptions);
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
      
    } catch (error) {
      console.error('PaymentService.openRazorpayCheckout failed:', error);
      options.onError(error);
    }
  }
}