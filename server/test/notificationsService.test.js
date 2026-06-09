import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';

process.env.DATABASE_URL = 'postgresql://localhost/dummy_test_db';

let executedQueries = [];
let mockResponse = {
  insertResult: null,
  selectRows: [],
  updateCount: 0,
  deleteCount: 0,
};

pg.Pool = class MockPool {
  on() {}
  async connect() {
    return {
      query: async (sql, params) => {
        executedQueries.push({ sql: sql.trim().replace(/\s+/g, ' '), params });
        const s = sql.toLowerCase();
        if (s.includes('insert into notifications')) {
          return {
            rows: mockResponse.insertResult ? [mockResponse.insertResult] : [],
            rowCount: 1,
          };
        }
        if (s.includes('select') && s.includes('notifications')) {
          return { rows: mockResponse.selectRows, rowCount: mockResponse.selectRows.length };
        }
        if (s.includes('update')) {
          return { rows: [], rowCount: mockResponse.updateCount };
        }
        if (s.includes('delete')) {
          return { rows: [], rowCount: mockResponse.deleteCount };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    };
  }
};

import {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  removeNotification,
} from '../services/notificationsService.js';

test.beforeEach(() => {
  executedQueries = [];
  mockResponse = {
    insertResult: null,
    selectRows: [],
    updateCount: 0,
    deleteCount: 0,
  };
});

test('getNotifications returns empty array when DB has no rows', async () => {
  const result = await getNotifications('t1_user');
  assert.deepEqual(result, []);
  const q = executedQueries.find((x) => x.sql.includes('select'));
  assert.ok(q, 'should execute select query');
  assert.ok(q.sql.includes('user_id'));
});

test('getNotifications always fetches from DB', async () => {
  mockResponse.selectRows = [
    {
      id: 'n1',
      user_id: 't2_user',
      type: 'info',
      title: 'Test',
      message: 'msg',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  const result1 = await getNotifications('t2_user');
  assert.equal(result1.length, 1);
  assert.equal(result1[0].id, 'n1');
  assert.equal(result1[0].isRead, false);
  const selectCount = executedQueries.filter((x) => x.sql.includes('select')).length;
  assert.equal(selectCount, 1);
  const result2 = await getNotifications('t2_user');
  assert.equal(result2.length, 1);
});

test('getNotifications does not filter expired entries (handled by deleteExpired)', async () => {
  const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  mockResponse.selectRows = [
    {
      id: 'old',
      user_id: 't3_user',
      type: 'info',
      title: 'Old',
      message: 'msg',
      link: null,
      is_read: false,
      created_at: oldDate,
      expires_at: null,
    },
  ];
  const result = await getNotifications('t3_user');
  assert.equal(result.length, 1);
});

test('addNotification inserts into DB and returns note', async () => {
  mockResponse.insertResult = {
    id: 'abc-123',
    user_id: 't4_user',
    type: 'system',
    title: 'Welcome',
    message: 'Hello',
    link: null,
    is_read: false,
    created_at: new Date().toISOString(),
    expires_at: null,
  };
  const note = await addNotification('t4_user', { title: 'Welcome', message: 'Hello' });
  assert.equal(note.id, 'abc-123');
  assert.equal(note.title, 'Welcome');
  assert.equal(note.isRead, false);
  assert.ok(note.createdAt);
  const q = executedQueries.find((x) => x.sql.includes('insert'));
  assert.ok(q, 'should execute insert query');
});

test('addNotification and getNotifications work end-to-end', async () => {
  const userId = 't5_user';
  mockResponse.insertResult = {
    id: 'n2',
    user_id: userId,
    type: 'alert',
    title: 'Cached',
    message: 'test',
    link: null,
    is_read: true,
    created_at: new Date().toISOString(),
    expires_at: null,
  };
  mockResponse.selectRows = [
    {
      id: 'n2',
      user_id: userId,
      type: 'alert',
      title: 'Cached',
      message: 'test',
      link: null,
      is_read: true,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  await addNotification(userId, { title: 'Cached', message: 'test', isRead: true });
  const result = await getNotifications(userId);
  assert.equal(result.length, 1, 'should return the notification');
  assert.equal(result[0].title, 'Cached');
  assert.equal(result[0].isRead, true);
  const selectQueries = executedQueries.filter((x) =>
    x.sql.toLowerCase().trim().startsWith('select')
  );
  assert.equal(selectQueries.length, 1, 'should execute exactly one select query');
});

test('markAsRead updates DB', async () => {
  const userId = 't6_user';
  mockResponse.selectRows = [
    {
      id: 'n1',
      user_id: userId,
      type: 'info',
      title: 'T',
      message: 'M',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  await getNotifications(userId);
  mockResponse.updateCount = 1;
  const ok = await markAsRead(userId, 'n1');
  assert.equal(ok, true);

  mockResponse.selectRows[0].is_read = true; // Mock DB update
  const list = await getNotifications(userId);
  assert.equal(list[0].isRead, true);
  const q = executedQueries.find((x) => x.sql.includes('update'));
  assert.ok(q);
  assert.ok(q.sql.includes('is_read = true'));
});

test('markAsRead returns false when notification not found', async () => {
  mockResponse.updateCount = 0;
  const ok = await markAsRead('t7_user', 'nonexistent');
  assert.equal(ok, false);
});

test('markAllAsRead updates all unread in DB', async () => {
  const userId = 't8_user';
  mockResponse.selectRows = [
    {
      id: 'a1',
      user_id: userId,
      type: 'info',
      title: 'A',
      message: 'M',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
    {
      id: 'a2',
      user_id: userId,
      type: 'info',
      title: 'B',
      message: 'M',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  await getNotifications(userId);
  await markAllAsRead(userId);

  mockResponse.selectRows.forEach((n) => (n.is_read = true)); // Mock DB update
  const list = await getNotifications(userId);
  assert.equal(
    list.every((n) => n.isRead),
    true
  );
});

test('removeNotification deletes from DB', async () => {
  const userId = 't9_user';
  mockResponse.selectRows = [
    {
      id: 'r1',
      user_id: userId,
      type: 'info',
      title: 'R',
      message: 'M',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  await getNotifications(userId);
  mockResponse.deleteCount = 1;
  const ok = await removeNotification(userId, 'r1');
  assert.equal(ok, true);

  mockResponse.selectRows = []; // Mock DB delete
  const list = await getNotifications(userId);
  assert.equal(list.length, 0);
});

test('removeNotification returns false when not found', async () => {
  mockResponse.deleteCount = 0;
  const ok = await removeNotification('t10_user', 'nope');
  assert.equal(ok, false);
});

test('clearAll empties notifications for user in DB', async () => {
  const userId = 't11_user';
  mockResponse.selectRows = [
    {
      id: 'c1',
      user_id: userId,
      type: 'info',
      title: 'C',
      message: 'M',
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at: null,
    },
  ];
  await getNotifications(userId);
  await clearAll(userId);

  mockResponse.selectRows = []; // Mock DB delete
  const list = await getNotifications(userId);
  assert.equal(list.length, 0);
  const q = executedQueries.find((x) => x.sql.includes('delete'));
  assert.ok(q);
});

test('uses default userId of global when none provided', async () => {
  await getNotifications();
  const q = executedQueries.find((x) => x.sql.includes('select'));
  assert.ok(q);
  assert.ok(q.params.includes('global'));
});
