-- Sample Knowledge Base Entries for Testing

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Shipping', 'Standard Shipping Time', 'How long does shipping take?', 
 'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Express shipping is available for $10 and takes 1-2 business days.', 
 'shipping, delivery, free shipping, express, time, days', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Shipping', 'International Shipping', 'Do you ship internationally?', 
 'Yes, we ship to over 50 countries worldwide. International shipping takes 7-14 business days and costs vary by location. Customs fees may apply.', 
 'international, worldwide, global, shipping, countries', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Returns', 'Return Policy', 'What is your return policy?', 
 'We accept returns within 30 days of purchase. Items must be unused and in original packaging with tags attached. Refund will be processed within 5-7 business days after we receive the item.', 
 'return, refund, money back, exchange, 30 days', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Returns', 'Return Process', 'How do I return an item?', 
 'To initiate a return: 1) Log into your account and go to Order History, 2) Select the order and click Return Item, 3) Print the prepaid return label, 4) Pack the item securely and drop it off at any carrier location.', 
 'return process, how to return, return steps, return label', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Support', 'Business Hours', 'What are your business hours?', 
 'Our customer support team is available Monday-Friday 9am-5pm EST. Weekend support is available via email and we respond within 24 hours. Live chat is available during business hours.', 
 'hours, open, time, weekend, support hours, availability', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Support', 'Contact Methods', 'How can I contact support?', 
 'You can reach us through: Live chat (Mon-Fri 9am-5pm EST), Email: support@example.com (24hr response), Phone: 1-800-123-4567 (Mon-Fri 9am-5pm EST), or visit our Help Center.', 
 'contact, support, phone, email, chat, help', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Orders', 'Track Order', 'How do I track my order?', 
 'You can track your order by: 1) Logging into your account and visiting Order History, 2) Clicking on the order number, 3) Viewing the tracking number and carrier information. You will also receive tracking updates via email.', 
 'track, tracking, order status, shipment, where is my order', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Orders', 'Cancel Order', 'Can I cancel my order?', 
 'Orders can be cancelled within 1 hour of placement. After that, the order enters processing and cannot be cancelled. If your order has shipped, you will need to initiate a return once you receive it.', 
 'cancel, cancel order, stop order, change order', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Products', 'Product Warranty', 'Do your products have a warranty?', 
 'All products come with a 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranty options are available at checkout. Warranty does not cover normal wear and tear or damage from misuse.', 
 'warranty, guarantee, defect, broken, repair, replacement', 1, NOW(), NOW());

INSERT INTO knowledge_base (tenant_id, category, title, question, answer, keywords, is_active, created_at, updated_at) VALUES
('demo-tenant', 'Billing', 'Payment Methods', 'What payment methods do you accept?', 
 'We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, Google Pay, and shop gift cards. All transactions are secured with SSL encryption.', 
 'payment, credit card, paypal, apple pay, google pay, how to pay', 1, NOW(), NOW());
