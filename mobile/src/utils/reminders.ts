import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Task } from '../types';

const CHANNEL_ID = 'deadlines';
const LEAD_MINUTES = 30;

let channelReady: Promise<string> | null = null;

async function ensureChannel(): Promise<string> {
  if (!channelReady) {
    channelReady = notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Deadline reminders',
      importance: AndroidImportance.HIGH,
    });
  }

  return channelReady;
}

export async function requestReminderPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus !== AuthorizationStatus.DENIED;
}

function reminderId(taskId: string): string {
  return 'deadline-' + taskId;
}

export function reminderTime(task: Task): number | null {
  if (!task.deadline || task.completed) return null;

  const deadline = new Date(task.deadline).getTime();
  if (Number.isNaN(deadline)) return null;

  const fireAt = deadline - LEAD_MINUTES * 60 * 1000;
  return fireAt > Date.now() ? fireAt : null;
}

export async function scheduleReminder(task: Task): Promise<void> {
  await cancelReminder(task.id);

  const fireAt = reminderTime(task);
  if (fireAt === null) return;

  const channelId = await ensureChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireAt,
  };

  await notifee.createTriggerNotification(
    {
      id: reminderId(task.id),
      title: task.title,
      body: 'Due in ' + LEAD_MINUTES + ' minutes',
      android: {
        channelId,
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
      },
    },
    trigger,
  );
}

export async function cancelReminder(taskId: string): Promise<void> {
  await notifee.cancelTriggerNotification(reminderId(taskId));
}

export async function syncReminders(tasks: Task[]): Promise<void> {
  const wanted = tasks.filter((task) => reminderTime(task) !== null);
  const existing = await notifee.getTriggerNotificationIds();

  const keep = new Set(wanted.map((task) => reminderId(task.id)));

  await Promise.all(
    existing
      .filter((id) => id.startsWith('deadline-') && !keep.has(id))
      .map((id) => notifee.cancelTriggerNotification(id)),
  );

  await Promise.all(wanted.map((task) => scheduleReminder(task)));
}
