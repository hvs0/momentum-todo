import { env } from '../src/config/env';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:' + env.port + '/api';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, extra?: unknown) {
  if (ok) {
    passed += 1;
    console.log('  pass  ' + name);
    return;
  }

  failed += 1;
  console.log('  FAIL  ' + name + (extra === undefined ? '' : ' -> ' + JSON.stringify(extra)));
}

interface Reply {
  status: number;
  body: any;
}

async function call(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<Reply> {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let parsed: any = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  return { status: response.status, body: parsed };
}

async function main() {
  const email = 'smoke' + Date.now() + '@example.com';
  const password = 'Password123';
  const now = Date.now();
  const iso = (hours: number) => new Date(now + hours * 3600000).toISOString();

  console.log('\nchecking ' + BASE);

  console.log('\nauth');
  let reply = await call('GET', '/health');
  check('health responds', reply.status === 200 && reply.body?.data?.status === 'ok', reply.body);

  reply = await call('POST', '/auth/register', { name: 'Smoke', email, password });
  check('register returns a token pair', reply.status === 201 && !!reply.body?.data?.accessToken);
  check('register hides the password', !('password' in (reply.body?.data?.user ?? {})));

  reply = await call('POST', '/auth/register', { name: 'Smoke', email, password });
  check('duplicate email is rejected', reply.status === 409);

  reply = await call('POST', '/auth/register', { name: 'X', email: 'nope', password: 'short' });
  check('invalid input is rejected with details', reply.status === 400 && Array.isArray(reply.body?.details));

  reply = await call('POST', '/auth/login', { email, password: 'WrongPass123' });
  check('wrong password is rejected', reply.status === 401);

  reply = await call('POST', '/auth/login', { email, password });
  check('login succeeds', reply.status === 200 && !!reply.body?.data?.accessToken);

  let access: string = reply.body?.data?.accessToken;
  const refreshToken: string = reply.body?.data?.refreshToken;

  reply = await call('GET', '/auth/me', null, access);
  check('me returns the signed in user', reply.body?.data?.user?.email === email);

  reply = await call('GET', '/tasks');
  check('tasks reject an anonymous caller', reply.status === 401);

  reply = await call('POST', '/auth/refresh', { refreshToken });
  check('refresh issues a new pair', reply.status === 200 && !!reply.body?.data?.accessToken);

  const rotated: string = reply.body?.data?.refreshToken;
  access = reply.body?.data?.accessToken;

  reply = await call('POST', '/auth/refresh', { refreshToken });
  check('the rotated-out refresh token stops working', reply.status === 401);

  console.log('\ntasks');
  const seeds = [
    { title: 'Ship release build', priority: 'urgent', dateTime: iso(0), deadline: iso(3), category: 'Work', tags: ['build'] },
    { title: 'Water the plants', priority: 'low', dateTime: iso(0), deadline: iso(200), category: 'Home' },
    { title: 'Pay electricity bill', priority: 'high', dateTime: iso(-48), deadline: iso(-6), category: 'Home' },
    { title: 'Read a chapter', priority: 'medium', dateTime: iso(0), category: 'Personal' },
  ];

  const created: any[] = [];
  for (const seed of seeds) {
    const result = await call('POST', '/tasks', { ...seed, description: 'seeded' }, access);
    if (result.status === 201) created.push(result.body.data.task);
  }
  check('all four tasks were created', created.length === 4, created.length);

  reply = await call('POST', '/tasks', { title: '' }, access);
  check('an empty title is rejected', reply.status === 400);

  reply = await call('POST', '/tasks', { title: 'Bad window', dateTime: iso(10), deadline: iso(2) }, access);
  check('a deadline before the start time is rejected', reply.status === 400);

  reply = await call('GET', '/tasks?sort=smart', null, access);
  const smart = (reply.body?.data?.tasks ?? []).map((task: any) => task.title);
  check('the list returns every task', smart.length === 4, smart.length);
  check('smart sort floats the overdue task to the top', smart[0] === 'Pay electricity bill', smart);
  check('smart sort sinks the distant low priority task', smart[3] === 'Water the plants', smart);

  reply = await call('GET', '/tasks?sort=deadline', null, access);
  const byDeadline = (reply.body?.data?.tasks ?? []).map((task: any) => task.title);
  check('deadline sort starts with the most overdue', byDeadline[0] === 'Pay electricity bill', byDeadline);
  check('deadline sort ends with the task that has none', byDeadline[3] === 'Read a chapter', byDeadline);

  reply = await call('GET', '/tasks?category=Home', null, access);
  check('filtering by category works', reply.body?.data?.count === 2, reply.body?.data?.count);

  reply = await call('GET', '/tasks?priority=urgent', null, access);
  check('filtering by priority works', reply.body?.data?.count === 1, reply.body?.data?.count);

  reply = await call('GET', '/tasks?search=bill', null, access);
  check('searching by title works', reply.body?.data?.count === 1, reply.body?.data?.count);

  reply = await call('GET', '/tasks?tag=build', null, access);
  check('filtering by tag works', reply.body?.data?.count === 1, reply.body?.data?.count);

  const target = created[0];

  reply = await call('PATCH', '/tasks/' + target.id + '/toggle', null, access);
  check('toggling marks the task complete', reply.body?.data?.task?.completed === true);
  check('completion is timestamped', !!reply.body?.data?.task?.completedAt);

  reply = await call('GET', '/tasks?status=completed', null, access);
  check('filtering by completed status works', reply.body?.data?.count === 1, reply.body?.data?.count);

  reply = await call('PATCH', '/tasks/' + target.id + '/toggle', null, access);
  check(
    'toggling back clears the completion stamp',
    reply.body?.data?.task?.completed === false && reply.body?.data?.task?.completedAt === null,
  );

  reply = await call('PATCH', '/tasks/' + target.id, { title: 'Ship the release build', priority: 'high' }, access);
  check(
    'updating edits the stored fields',
    reply.body?.data?.task?.title === 'Ship the release build' && reply.body?.data?.task?.priority === 'high',
  );

  reply = await call('GET', '/tasks/stats', null, access);
  check('stats count the overdue task', reply.body?.data?.total === 4 && reply.body?.data?.overdue === 1, reply.body?.data);

  console.log('\nsubtasks and recurrence');
  reply = await call(
    'POST',
    '/tasks',
    {
      title: 'Release checklist',
      dateTime: iso(0),
      subtasks: [{ title: 'draft notes' }, { title: 'tag the build' }],
    },
    access,
  );
  const withSubtasks = reply.body?.data?.task;
  check('subtasks are stored on create', withSubtasks?.subtasks?.length === 2, withSubtasks?.subtasks);
  check('each subtask gets an id', !!withSubtasks?.subtasks?.[0]?.id);
  check('subtasks start undone', withSubtasks?.subtasks?.every((item: any) => item.done === false));

  const subtaskId = withSubtasks.subtasks[0].id;
  reply = await call(
    'PATCH',
    '/tasks/' + withSubtasks.id + '/subtasks/' + subtaskId + '/toggle',
    null,
    access,
  );
  check(
    'toggling a subtask flips only that one',
    reply.body?.data?.task?.subtasks?.[0]?.done === true &&
      reply.body?.data?.task?.subtasks?.[1]?.done === false,
    reply.body?.data?.task?.subtasks,
  );

  reply = await call(
    'PATCH',
    '/tasks/' + withSubtasks.id + '/subtasks/deadbeefdeadbeefdeadbeef/toggle',
    null,
    access,
  );
  check('an unknown subtask id gives 404', reply.status === 404);

  reply = await call(
    'POST',
    '/tasks',
    { title: 'Water the plants', dateTime: iso(0), deadline: iso(5), repeat: 'daily' },
    access,
  );
  const repeating = reply.body?.data?.task;
  check('the repeat rule is stored', repeating?.repeat === 'daily', repeating?.repeat);

  reply = await call('PATCH', '/tasks/' + repeating.id + '/toggle', null, access);
  const nextUp = reply.body?.data?.nextOccurrence;
  check('completing a repeating task spawns the next one', !!nextUp, reply.body?.data);
  check('the next occurrence starts incomplete', nextUp?.completed === false);
  check(
    'the next occurrence moves one day forward',
    new Date(nextUp?.dateTime).getTime() - new Date(repeating.dateTime).getTime() === 86400000,
    { from: repeating?.dateTime, to: nextUp?.dateTime },
  );
  check('the next occurrence keeps repeating', nextUp?.repeat === 'daily');
  check(
    'the next occurrence shifts the deadline too',
    new Date(nextUp?.deadline).getTime() - new Date(repeating.deadline).getTime() === 86400000,
  );

  reply = await call('PATCH', '/tasks/' + withSubtasks.id + '/toggle', null, access);
  check('completing a one-off task spawns nothing', reply.body?.data?.nextOccurrence === null);

  reply = await call('GET', '/tasks/stats', null, access);
  const stats = reply.body?.data;
  check('stats expose a seven day trend', Array.isArray(stats?.trend) && stats.trend.length === 7, stats?.trend?.length);
  check('todays completions land in the trend', stats?.trend?.[6]?.count >= 2, stats?.trend);
  check('stats expose a streak', stats?.streak >= 1, stats?.streak);
  check(
    'stats break down by category',
    Array.isArray(stats?.byCategory) && stats.byCategory.length > 0,
    stats?.byCategory,
  );


  console.log('\nownership');
  reply = await call('POST', '/auth/register', {
    name: 'Stranger',
    email: 'stranger' + Date.now() + '@example.com',
    password,
  });
  const strangerToken: string = reply.body?.data?.accessToken;

  reply = await call('GET', '/tasks', null, strangerToken);
  check('a fresh account starts with no tasks', reply.body?.data?.count === 0);

  reply = await call('GET', '/tasks/' + target.id, null, strangerToken);
  check('another account cannot read the task', reply.status === 404);

  reply = await call('DELETE', '/tasks/' + target.id, null, strangerToken);
  check('another account cannot delete the task', reply.status === 404);

  reply = await call('DELETE', '/tasks/' + target.id, null, access);
  check('the owner can delete', reply.status === 200);

  reply = await call('GET', '/tasks/' + target.id, null, access);
  check('the deleted task is gone', reply.status === 404);

  reply = await call('GET', '/tasks/not-an-id', null, access);
  check('a malformed id gives a clean 400', reply.status === 400);

  console.log('\nlogout');
  reply = await call('POST', '/auth/logout', { refreshToken: rotated }, access);
  check('logout succeeds', reply.status === 200);

  reply = await call('POST', '/auth/refresh', { refreshToken: rotated });
  check('the refresh token dies with the session', reply.status === 401);

  console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nThe API did not respond. Start it with "npm run dev" first.\n', error);
  process.exit(1);
});
