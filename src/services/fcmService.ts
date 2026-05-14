import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface NotificationData {
  recipientId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
}

export const sendNotificationToUser = async (notification: NotificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      recipientId: notification.recipientId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data || {},
      isRead: false,
      createdAt: serverTimestamp(),
    });

    // Also trigger FCM if needed via the send-notification API
    try {
      await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: notification.recipientId,
          senderName: 'Plasa Dashboard',
          message: notification.body,
          orderId: notification.data?.orderId || '',
          conversationId: notification.data?.conversationId || '',
          title: notification.title,
          type: notification.type,
        }),
      });
    } catch (fcmError) {
      console.error('FCM Push Error:', fcmError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving notification to Firestore:', error);
    return { success: false, error };
  }
};

export const sendNewOrderNotification = async (
  recipientId: string,
  orderId: string,
  orderType: string
) => {
  return sendNotificationToUser({
    recipientId,
    title: 'New Order Offer',
    body: `You have a new ${orderType} order offer!`,
    type: 'new_order_offer',
    data: { orderId, orderType },
  });
};

export const sendOrderAssignedNotification = async (
  recipientId: string,
  orderId: string,
  orderType: string
) => {
  return sendNotificationToUser({
    recipientId,
    title: 'Order Assigned',
    body: `You have been directly assigned a new ${orderType} order.`,
    type: 'order_assigned',
    data: { orderId, orderType },
  });
};

export const sendBatchOrdersNotification = async (...args: any[]) => {
  console.log('FCM Stub: sendBatchOrdersNotification called', args);
};

export const saveFCMToken = async (...args: any[]) => {
  console.log('FCM Stub: saveFCMToken called', args);
};

export const removeFCMToken = async (...args: any[]) => {
  console.log('FCM Stub: removeFCMToken called', args);
};

export const sendChatNotification = async (
  recipientId: string,
  senderName: string,
  message: string,
  orderId: string,
  conversationId: string
) => {
  return sendNotificationToUser({
    recipientId,
    title: `New message from ${senderName}`,
    body: message,
    type: 'chat_message',
    data: { orderId, conversationId, senderName },
  });
};
