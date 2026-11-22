import { expect, test, type Page } from '@playwright/test';

// Scoped, browser-facing tests on the current MVP snapshot. No fake backend.
async function login(page: Page, role: 'student-a' | 'student-b' | 'operator' = 'student-a') {
  const account = role === 'student-b'
    ? ['student.b@example.test', 'demo-student-b']
    : role === 'operator'
      ? ['operator@example.test', 'demo-operator']
      : ['student.a@example.test', 'demo-student-a'];
  await page.goto('/login');
  await page.getByLabel('Email').fill(account[0]);
  await page.getByLabel('Password').fill(account[1]);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(role === 'operator' ? /\/operator\/monitoring$/ : /\/student\/hubs$/);
}
async function hubSearch(page: Page, value: string) {
  await page.getByRole('textbox', { name: 'Search by Hub or vehicle' }).fill(value);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}
async function futureDate(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}
async function selectHub(page: Page, name: string) {
  await page.getByRole('heading', { name }).locator('..').getByRole('button', { name: 'Select Hub' }).click();
}

test.describe('UC00 — authentication & route access', () => {
  test('TC-UC00-001 | Wrong password rejected', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student.a@example.test');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', {name:'Sign in'}).click();
    await expect(page.getByRole('alert')).toContainText('Sign-in failed');
    await expect(page).toHaveURL(/\/login$/);
  });
  test('TC-UC00-002 | Student A logs in', async ({page}) => {
    await login(page); await expect(page.getByRole('heading', {name:'Search Mobility Hubs and Resources'})).toBeVisible();
  });
  test('TC-UC00-003 | Operator logs in', async ({page}) => {
    await login(page,'operator'); await expect(page.getByRole('heading', {name:'Monitor Network'})).toBeVisible();
  });
  test('TC-UC00-004 | Blank credentials rejected', async ({page}) => {
    await page.goto('/login');
    await page.getByRole('button', {name:'Sign in'}).click();
    await expect(page.getByRole('alert')).toContainText('Sign-in failed');
    await expect(page).toHaveURL(/\/login$/);
  });
  test('TC-UC00-005 | Student cannot visit operator incident route', async ({page}) => {
    await login(page); await page.goto('/operator/incidents');
    await expect(page).toHaveURL(/\/student\/hubs$/);
  });
  test('TC-UC00-006 | Operator cannot visit student charging route', async ({page}) => {
    await login(page, 'operator'); await page.goto('/student/charging');
    await expect(page).toHaveURL(/\/operator\/monitoring$/);
  });
});

test.describe('UC01 — hub & vehicle discovery', () => {
  test('TC-UC01-001 | Search EV-01 by identifier', async ({page}) => {
    await login(page); await hubSearch(page,'EV-01');
    await expect(page.getByRole('heading',{name:'Campus EV-01'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Campus EV-02'})).toHaveCount(0);
  });
  test('TC-UC01-002 | Search Campus Hub A', async ({page}) => {
    await login(page); await hubSearch(page,'Campus Mobility Hub A');
    await expect(page.getByRole('heading',{name:'Campus Mobility Hub A'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Campus EV-01'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Campus EV-04'})).toBeVisible();
  });
  test('TC-UC01-003 | Unknown search reports no matches', async ({page}) => {
    await login(page); await hubSearch(page,'XYZ-NOT-FOUND');
    await expect(page.getByRole('heading',{name:'No matching results found'})).toBeVisible();
  });
  test('TC-UC01-004 | Low-battery vehicle cannot be reserved', async ({page}) => {
    await login(page); await page.goto('/student/hubs/vehicles/EV-03');
    await expect(page.getByText('12%',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Reserve',exact:true})).toBeDisabled();
  });
});

test.describe('UC02–UC06 — student workflows', () => {
  test('TC-UC02-001 | Reserve EV-01', async ({page}) => {
    await login(page); await page.goto('/student/hubs/vehicles/EV-01/reserve');
    await page.getByRole('button',{name:'Confirm Reservation'}).click();
    await expect(page.getByRole('heading',{name:'Vehicle Reserved Successfully'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Reservation Code'})).toBeVisible();
  });
  test('TC-UC02-002 | Empty start time is rejected', async ({page}) => {
    await login(page); await page.goto('/student/hubs/vehicles/EV-01/reserve');
    await page.locator('#reserve-start-time').fill('');
    await page.getByRole('button',{name:'Confirm Reservation'}).click();
    await expect(page.getByRole('alert')).toContainText('Please select both start and end times');
  });
  test('TC-UC03-001 | Wrong pickup PIN rejected', async ({page}) => {
    await login(page,'student-b'); await page.goto('/student/reservations/VR-02/pickup');
    await page.getByLabel('Vehicle PIN').fill('9999');
    await page.getByRole('button',{name:'Verify Vehicle'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('heading',{name:'Trip Started'})).toHaveCount(0);
  });
  test('TC-UC03-002 | Correct pickup PIN starts trip', async ({page}) => {
    await login(page,'student-b'); await page.goto('/student/reservations/VR-02/pickup');
    await page.getByLabel('Vehicle PIN').fill('2468');
    await page.getByRole('button',{name:'Verify Vehicle'}).click();
    await expect(page.getByRole('heading',{name:'Trip Started'})).toBeVisible();
  });
  test('TC-UC04-001 | Return active trip with docking confirmation', async ({page}) => {
    await login(page); await page.goto('/student/trips/TR-01');
    await selectHub(page, 'Campus Mobility Hub B');
    await page.getByLabel('Simulated sensor confirms vehicle is docked').check();
    await page.getByRole('button',{name:'Confirm Return'}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Confirm Return'}).click();
    await expect(page.getByRole('heading',{name:'Vehicle Returned Successfully'})).toBeVisible();
  });
  test('TC-UC04-002 | Sensor not confirmed blocks return', async ({page}) => {
    await login(page); await page.goto('/student/trips/TR-01');
    await selectHub(page,'Campus Mobility Hub B');
    await page.getByRole('button',{name:'Confirm Return'}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Confirm Return'}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();
    await expect(page.getByText(/Simulated docking confirmation has not been received/)).toBeVisible();
  });
  test('TC-UC04-003 | Offline HUB-C cannot be selected', async ({page}) => {
    await login(page); await page.goto('/student/trips/TR-01');
    await expect(page.getByRole('heading',{name:'Campus Mobility Hub C'}).locator('..').getByRole('button',{name:'Select Hub'})).toBeDisabled();
  });
  test('TC-UC05-001 | Parking Hub search', async ({page}) => {
    await login(page); await page.goto('/student/parking');
    await page.getByLabel('Area / Hub').fill('Campus Mobility Hub A');
    await page.getByRole('button',{name:'Search',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Campus Mobility Hub A'})).toBeVisible();
  });
  test('TC-UC06-001 | Submit pending charging request', async ({page}) => {
    await login(page); await page.goto('/student/charging');
    await selectHub(page,'Campus Mobility Hub A');
    await page.getByLabel('Desired date').fill(await futureDate(page));
    await page.getByRole('button',{name:'Review Request'}).click();
    await page.getByRole('button',{name:'Submit Request'}).click();
    await expect(page.getByRole('heading',{name:'Charging Request Submitted'})).toBeVisible();
    await expect(page.getByText('A charging port is NOT allocated yet.',{exact:false})).toBeVisible();
  });
  test('TC-UC06-002 | HUB-C without idle ports cannot be selected', async ({page}) => {
    await login(page); await page.goto('/student/charging');
    await expect(page.getByRole('heading',{name:'Campus Mobility Hub C'}).locator('..').getByRole('button',{name:'Select Hub'})).toBeDisabled();
  });
  test('TC-UC06-003 | Past date is rejected', async ({page}) => {
    await login(page); await page.goto('/student/charging');
    await selectHub(page,'Campus Mobility Hub A');
    await page.getByLabel('Desired date').fill('2020-01-01');
    await page.getByRole('button',{name:'Review Request'}).click();
    await page.getByRole('button',{name:'Submit Request'}).click();
    await expect(page.getByText(/Select a valid future time window/)).toBeVisible();
  });
});

test.describe('UC07, UC10 — operator workflows', () => {
  test('TC-UC07-001 | Monitoring list renders', async ({page}) => {
    await login(page,'operator');
    await expect(page.getByRole('heading',{name:'Monitor Network'})).toBeVisible();
    await expect(page.getByText('Campus Mobility Hub A').first()).toBeVisible();
  });
  test('TC-UC07-002 | Disconnected HUB-C shows last-known data', async ({page}) => {
    await login(page,'operator'); await page.goto('/operator/monitoring/HUB-C');
    await expect(page.getByRole('heading',{name:'Hub Disconnected'})).toBeVisible();
    await expect(page.getByRole('heading',{name:/Last known sample resources/})).toBeVisible();
  });
  test('TC-UC10-001 | Incident list renders', async ({page}) => {
    await login(page,'operator'); await page.goto('/operator/incidents');
    await expect(page.getByRole('heading',{name:'Manage Incidents'})).toBeVisible();
    await expect(page.getByText('INC-02')).toBeVisible();
  });
  test('TC-UC10-002 | Incident details renders', async ({page}) => {
    await login(page,'operator'); await page.goto('/operator/incidents/INC-02');
    await expect(page.getByRole('heading',{name:'Incident Details'})).toBeVisible();
    await expect(page.getByText('CP-C01').first()).toBeVisible();
  });
});

test.describe('Integration flows (UI)', () => {
  test('IT-UC00-UC01-001 | Sign in then search Hub A', async ({page}) => {
    await login(page); await hubSearch(page,'Campus Mobility Hub A');
    await expect(page.getByRole('heading',{name:'Campus Mobility Hub A'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Campus EV-01'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Campus EV-04'})).toBeVisible();
  });
  test('IT-ROLE-001 | Role protection in both directions', async ({browser}) => {
    const a = await browser.newContext(); const p1 = await a.newPage();
    await login(p1); await p1.goto('/operator/incidents');
    await expect(p1).toHaveURL(/\/student\/hubs$/); await a.close();
    const b = await browser.newContext(); const p2 = await b.newPage();
    await login(p2,'operator'); await p2.goto('/student/charging');
    await expect(p2).toHaveURL(/\/operator\/monitoring$/); await b.close();
  });
});
