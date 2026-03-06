import { supabase } from '../lib/supabase';

export interface CreateOrderData {
  user_id: string;
  address_id: string;
  total_amount: number;
  shipping_cost: number;
  payment_method: string;
  shipping_method?: string;
}

export interface OrderItem {
  variant_id: string;
  quantity: number;
  price: number;
}

export interface UpdateOrderPaymentData {
  payment_status: string;
  order_status: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
}

export class OrderService {
  static async createOrder(orderData: CreateOrderData): Promise<string> {
    console.log('Creating order with data:', orderData);
    
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.user_id,
          address_id: orderData.address_id,
          total_amount: orderData.total_amount,
          shipping_cost: orderData.shipping_cost,
          payment_method: orderData.payment_method,
          shipping_method: orderData.shipping_method || 'standard',
          payment_status: 'pending',
          order_status: 'processing'
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      console.log('Order created successfully:', order.id);
      return order.id;
    } catch (error) {
      console.error('OrderService.createOrder failed:', error);
      throw error;
    }
  }

  static async addOrderItems(orderId: string, items: OrderItem[]): Promise<void> {
    console.log('Adding order items for order:', orderId, items);
    
    try {
      const orderItems = items.map(item => ({
        order_id: orderId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (error) {
        console.error('Error adding order items:', error);
        throw error;
      }

      console.log('Order items added successfully');
    } catch (error) {
      console.error('OrderService.addOrderItems failed:', error);
      throw error;
    }
  }

  static async updateOrderPayment(orderId: string, paymentData: UpdateOrderPaymentData): Promise<void> {
    console.log('Updating order payment for order:', orderId, paymentData);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update(paymentData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order payment:', error);
        throw error;
      }

      console.log('Order payment updated successfully');
    } catch (error) {
      console.error('OrderService.updateOrderPayment failed:', error);
      throw error;
    }
  }

  static async getOrder(orderId: string) {
    console.log('Fetching order:', orderId);
    
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            variant:product_variants (
              *,
              product:products (
                name,
                images:product_images (image_url)
              )
            )
          ),
          address:user_addresses (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      console.log('Order fetched successfully:', order);
      return order;
    } catch (error) {
      console.error('OrderService.getOrder failed:', error);
      throw error;
    }
  }

  static async updateOrderForCOD(orderId: string): Promise<void> {
    console.log('Updating order for COD:', orderId);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          order_status: 'confirmed',
          payment_method: 'cod'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order for COD:', error);
        throw error;
      }

      console.log('Order updated for COD successfully');
    } catch (error) {
      console.error('OrderService.updateOrderForCOD failed:', error);
      throw error;
    }
  }
}