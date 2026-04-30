process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/server');

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Servidor funcionando correctamente');
    expect(response.body.uptime).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.environment).toBe('test');
  });
});
