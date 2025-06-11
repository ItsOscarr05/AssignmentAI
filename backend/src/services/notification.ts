import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'in-app';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  readAt?: Date;
}

interface EmailNotification extends Notification {
  type: 'email';
  recipient: string;
}

interface InAppNotification extends Notification {
  type: 'in-app';
}

// Create email transporter
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// In-memory storage for in-app notifications (replace with database in production)
const inAppNotifications: InAppNotification[] = [];

export const sendEmailNotification = async (
  userId: string,
  recipient: string,
  title: string,
  message: string
): Promise<string> => {
  try {
    const notification: EmailNotification = {
      id: uuidv4(),
      userId,
      type: 'email',
      title,
      message,
      status: 'pending',
      createdAt: new Date(),
      recipient,
    };

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient,
      subject: title,
      text: message,
      html: `<div>${message}</div>`,
    });

    notification.status = 'sent';
    return notification.id;
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw new Error('Failed to send email notification');
  }
};

export const createInAppNotification = (userId: string, title: string, message: string): string => {
  const notification: InAppNotification = {
    id: uuidv4(),
    userId,
    type: 'in-app',
    title,
    message,
    status: 'sent',
    createdAt: new Date(),
  };

  inAppNotifications.push(notification);
  return notification.id;
};

export const getInAppNotifications = (userId: string): InAppNotification[] => {
  return inAppNotifications.filter(
    notification => notification.userId === userId && !notification.readAt
  );
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notification = inAppNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.readAt = new Date();
  }
};

export const sendAssignmentNotification = async (
  userId: string,
  email: string,
  assignmentTitle: string,
  notificationType: 'created' | 'updated' | 'due' | 'overdue'
): Promise<void> => {
  const title = `Assignment ${notificationType}: ${assignmentTitle}`;
  let message = '';

  switch (notificationType) {
    case 'created':
      message = `A new assignment "${assignmentTitle}" has been created.`;
      break;
    case 'updated':
      message = `The assignment "${assignmentTitle}" has been updated.`;
      break;
    case 'due':
      message = `The assignment "${assignmentTitle}" is due soon.`;
      break;
    case 'overdue':
      message = `The assignment "${assignmentTitle}" is overdue.`;
      break;
  }

  // Send both email and in-app notifications
  await sendEmailNotification(userId, email, title, message);
  createInAppNotification(userId, title, message);
};

export const sendStatusChangeNotification = async (
  userId: string,
  email: string,
  assignmentTitle: string,
  newStatus: string
): Promise<void> => {
  const title = `Assignment Status Update: ${assignmentTitle}`;
  const message = `The status of your assignment "${assignmentTitle}" has been updated to ${newStatus}.`;

  await sendEmailNotification(userId, email, title, message);
  createInAppNotification(userId, title, message);
};
