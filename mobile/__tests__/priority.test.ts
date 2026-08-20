import { scoreTask, sortTasks, urgencyLabel } from '../src/utils/priority';
import { Priority } from '../src/types';

const NOW = new Date('2026-05-10T09:00:00.000Z').getTime();
const HOUR = 1000 * 60 * 60;

function makeTask(overrides: {
  priority?: Priority;
  startsInHours?: number;
  deadlineInHours?: number | null;
  completed?: boolean;
  title?: string;
}) {
  const {
    priority = 'medium',
    startsInHours = 0,
    deadlineInHours = null,
    completed = false,
    title = 'task',
  } = overrides;

  return {
    title,
    priority,
    completed,
    dateTime: new Date(NOW + startsInHours * HOUR).toISOString(),
    deadline:
      deadlineInHours === null ? null : new Date(NOW + deadlineInHours * HOUR).toISOString(),
    createdAt: new Date(NOW).toISOString(),
  };
}

describe('scoreTask', () => {
  it('ranks a higher priority above a lower one when timing matches', () => {
    const urgent = scoreTask(makeTask({ priority: 'urgent', deadlineInHours: 10 }), NOW);
    const low = scoreTask(makeTask({ priority: 'low', deadlineInHours: 10 }), NOW);

    expect(urgent).toBeGreaterThan(low);
  });

  it('ranks a nearer deadline above a distant one at equal priority', () => {
    const soon = scoreTask(makeTask({ deadlineInHours: 2 }), NOW);
    const later = scoreTask(makeTask({ deadlineInHours: 60 }), NOW);

    expect(soon).toBeGreaterThan(later);
  });

  it('pushes overdue work above upcoming work of the same priority', () => {
    const overdue = scoreTask(makeTask({ priority: 'medium', deadlineInHours: -3 }), NOW);
    const upcoming = scoreTask(makeTask({ priority: 'medium', deadlineInHours: 1 }), NOW);

    expect(overdue).toBeGreaterThan(upcoming);
  });

  it('lets an overdue high priority task outrank an urgent one due later today', () => {
    const overdueHigh = scoreTask(makeTask({ priority: 'high', deadlineInHours: -6 }), NOW);
    const urgentSoon = scoreTask(makeTask({ priority: 'urgent', deadlineInHours: 3 }), NOW);

    expect(overdueHigh).toBeGreaterThan(urgentSoon);
  });

  it('still lets a truly urgent task win when the overdue one is lower priority', () => {
    const overdueLow = scoreTask(makeTask({ priority: 'low', deadlineInHours: -1 }), NOW);
    const urgentSoon = scoreTask(makeTask({ priority: 'urgent', deadlineInHours: 1 }), NOW);

    expect(urgentSoon).toBeGreaterThan(overdueLow);
  });

  it('grows the score the longer a task stays overdue', () => {
    const justMissed = scoreTask(makeTask({ deadlineInHours: -1 }), NOW);
    const longOverdue = scoreTask(makeTask({ deadlineInHours: -40 }), NOW);

    expect(longOverdue).toBeGreaterThan(justMissed);
  });

  it('gives a task that has already started a nudge over one starting later', () => {
    const started = scoreTask(makeTask({ startsInHours: -1, deadlineInHours: 30 }), NOW);
    const upcoming = scoreTask(makeTask({ startsInHours: 20, deadlineInHours: 30 }), NOW);

    expect(started).toBeGreaterThan(upcoming);
  });

  it('scores completed work below everything else', () => {
    const done = scoreTask(makeTask({ priority: 'urgent', deadlineInHours: -50, completed: true }), NOW);
    const open = scoreTask(makeTask({ priority: 'low', deadlineInHours: 500 }), NOW);

    expect(done).toBeLessThan(open);
  });

  it('does not reward a missing deadline over a real one', () => {
    const none = scoreTask(makeTask({ deadlineInHours: null }), NOW);
    const soon = scoreTask(makeTask({ deadlineInHours: 4 }), NOW);

    expect(soon).toBeGreaterThan(none);
  });
});

describe('sortTasks', () => {
  it('orders a mixed list by overdue, then urgency, then priority', () => {
    const tasks = [
      makeTask({ title: 'someday', priority: 'low', deadlineInHours: 400 }),
      makeTask({ title: 'overdue bill', priority: 'high', deadlineInHours: -6 }),
      makeTask({ title: 'release', priority: 'urgent', deadlineInHours: 3 }),
      makeTask({ title: 'reading', priority: 'medium', deadlineInHours: null }),
    ];

    const sorted = sortTasks(tasks, NOW).map((task) => task.title);

    expect(sorted[0]).toBe('overdue bill');
    expect(sorted[1]).toBe('release');
    expect(sorted[3]).toBe('someday');
  });

  it('keeps completed tasks at the bottom regardless of priority', () => {
    const tasks = [
      makeTask({ title: 'finished', priority: 'urgent', deadlineInHours: -2, completed: true }),
      makeTask({ title: 'pending', priority: 'low', deadlineInHours: 200 }),
    ];

    expect(sortTasks(tasks, NOW).map((task) => task.title)).toEqual(['pending', 'finished']);
  });

  it('leaves the input array untouched', () => {
    const tasks = [
      makeTask({ title: 'a', priority: 'low', deadlineInHours: 100 }),
      makeTask({ title: 'b', priority: 'urgent', deadlineInHours: 1 }),
    ];

    sortTasks(tasks, NOW);

    expect(tasks.map((task) => task.title)).toEqual(['a', 'b']);
  });
});

describe('urgencyLabel', () => {
  it('says when there is no deadline', () => {
    expect(urgencyLabel(makeTask({ deadlineInHours: null }), NOW)).toBe('No deadline');
  });

  it('counts down in hours and days', () => {
    expect(urgencyLabel(makeTask({ deadlineInHours: 5 }), NOW)).toBe('5h left');
    expect(urgencyLabel(makeTask({ deadlineInHours: 48 }), NOW)).toBe('2d left');
  });

  it('counts up once the deadline has passed', () => {
    expect(urgencyLabel(makeTask({ deadlineInHours: -5 }), NOW)).toBe('5h overdue');
    expect(urgencyLabel(makeTask({ deadlineInHours: -48 }), NOW)).toBe('2d overdue');
  });
});
