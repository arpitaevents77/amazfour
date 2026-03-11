/*
  # Fix Orders RLS Policies

  1. Security Updates
    - Add policy for users to update their own orders
    - Fix order update permissions for payment processing

  2. Changes
    - Allow authenticated users to update orders they own
    - Enable proper order status and payment updates
*/

-- Add policy for users to update their own orders
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Add policy for users to insert orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Add policy for order items updates (needed for order processing)
CREATE POLICY "Users can insert order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));